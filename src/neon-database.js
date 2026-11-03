import {neon} from '@neondatabase/serverless';

export function normalizePostgresRow(row){
 if(row.expires==null)return row;
 const expires=Number(row.expires);
 if(!Number.isSafeInteger(expires))throw new Error('Database timestamp exceeds supported range.');
 return {...row,expires};
}

// Only application-owned SQL reaches this adapter. Values remain bound parameters.
export function postgresParameters(sql){
 let index=0;
 const text=sql.replace(/'(?:''|[^'])*'|"(?:""|[^"])*"|--[^\n]*|\/\*[\s\S]*?\*\/|\?/g,token=>token==='?'?'$'+(++index):token);
 return {text,count:index};
}
export function neonDatabase(connectionString,driver=neon){
 let url;try{url=new URL(connectionString)}catch{throw new Error('DATABASE_URL must be a Neon PostgreSQL connection string.')}
 if(!['postgres:','postgresql:'].includes(url.protocol)||!url.username||!url.password||!url.hostname.endsWith('.neon.tech')||url.pathname.length<2)throw new Error('DATABASE_URL must be a Neon PostgreSQL connection string.');
 const sql=driver(connectionString,{fullResults:true});
 const query=({sql:text,args=[]},options)=>{const compiled=postgresParameters(text);if(compiled.count!==args.length)throw new Error('Database parameter count mismatch.');return sql.query(compiled.text,args,options)};
 const result=value=>({results:(value.rows||[]).map(normalizePostgresRow),changes:value.rowCount||0});
 const unavailable=error=>new Error('The persistent database is temporarily unavailable. Please retry.',{cause:{code:error?.code||error?.name||'unavailable',transport:error?.sourceError?.cause?.code||error?.sourceError?.code||error?.cause?.code||null}});
 let active=0;const waiting=[];
 async function execute(work){
  if(active<4)active++;else{if(waiting.length>=64)throw unavailable();await new Promise(resolve=>waiting.push(resolve))}
  try{return await work()}catch(error){throw unavailable(error)}finally{const next=waiting.shift();if(next)next();else active--}
 }
 return {kind:'neon',prepare(text){return {bind(...args){
  const run=()=>execute(async()=>{
   const readOnly=/^\s*SELECT\b/i.test(text);
   for(let attempt=0;attempt<2;attempt++){try{return result(await query({sql:text,args},{fetchOptions:{signal:AbortSignal.timeout(readOnly?10000:20000)}}))}catch(error){if(attempt||!readOnly||error.code)throw error}}
  });
  return {async first(){return (await run()).results[0]||null},all:run,run};
 }}},async batch(statements){
  return execute(async()=>(await sql.transaction(statements.map(statement=>query(statement)),{fullResults:true,fetchOptions:{signal:AbortSignal.timeout(20000)}})).map(result));
 }};
}
export async function migrateNeon(DB,migrations){
 await DB.prepare('CREATE TABLE IF NOT EXISTS finn_neon_migrations(name TEXT PRIMARY KEY, applied TEXT NOT NULL)').bind().run();
 for(const {name,sql} of migrations){
  if(await DB.prepare('SELECT name FROM finn_neon_migrations WHERE name=?').bind(name).first())continue;
  const statements=sql.split('--> statement-breakpoint').map(s=>s.trim()).filter(Boolean).map(sql=>({sql:sql.replace(/\bINTEGER\b/g,'BIGINT').replace(/CREATE TABLE (?!IF NOT EXISTS)/g,'CREATE TABLE IF NOT EXISTS ').replace(/CREATE INDEX (?!IF NOT EXISTS)/g,'CREATE INDEX IF NOT EXISTS ')}));
  await DB.batch([...statements,{sql:'INSERT INTO finn_neon_migrations(name,applied) VALUES(?,?) ON CONFLICT(name) DO NOTHING',args:[name,new Date().toISOString()]}]);
 }
}
