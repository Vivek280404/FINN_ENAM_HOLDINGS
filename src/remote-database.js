function encode(value){
 if(value==null)return {type:'null'};
 if(typeof value==='string')return {type:'text',value};
 if(typeof value==='boolean')return {type:'integer',value:value?'1':'0'};
 if(typeof value==='number'&&Number.isFinite(value))return Number.isSafeInteger(value)?{type:'integer',value:String(value)}:{type:'float',value};
 throw new Error('Unsupported database value.');
}
function decode(value){if(value.type==='null')return null;if(value.type==='integer'||value.type==='float')return Number(value.value);return value.value}
export function remoteDatabase(url,token,send=fetch){
 if(!url||!token)throw new Error('Set both TURSO_DATABASE_URL and TURSO_AUTH_TOKEN.');
 const endpoint=new URL(url.replace(/^libsql:/,'https:'));
 if(endpoint.protocol!=='https:'||endpoint.username||endpoint.password||endpoint.search||endpoint.hash||!['','/'].includes(endpoint.pathname))throw new Error('TURSO_DATABASE_URL must be a database HTTPS or libsql origin.');
 endpoint.pathname='/v2/pipeline';
 async function execute(statements){
  const response=await send(endpoint.href,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({requests:[...statements.map(({sql,args=[]})=>({type:'execute',stmt:{sql,args:args.map(encode),want_rows:true}})),{type:'close'}]}),signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw new Error('The persistent database is temporarily unavailable.');
  const data=await response.json();
  if(!Array.isArray(data.results)||data.results.length<statements.length)throw new Error('The persistent database returned an incomplete response.');
  return data.results.slice(0,statements.length).map(item=>{if(item.type!=='ok'||!item.response?.result)throw new Error('The persistent database could not complete this query.');const result=item.response.result;return {results:(result.rows||[]).map(row=>Object.fromEntries(result.cols.map((col,i)=>[col.name,decode(row[i])]))),changes:result.affected_row_count||0}});
 }
 return {prepare(sql){return {bind(...args){const run=async()=>(await execute([{sql,args}]))[0];return {async first(){return (await run()).results[0]||null},all:run,run}}}},async batch(statements){return execute([{sql:'BEGIN IMMEDIATE'},...statements,{sql:'COMMIT'}])}};
}
export async function migrateRemote(DB,migrations){
 await DB.prepare('CREATE TABLE IF NOT EXISTS finn_local_migrations(name TEXT PRIMARY KEY, applied TEXT NOT NULL)').bind().run();
 for(const {name,sql} of migrations){
  if(await DB.prepare('SELECT name FROM finn_local_migrations WHERE name=?').bind(name).first())continue;
  const statements=sql.split('--> statement-breakpoint').map(s=>s.trim()).filter(Boolean).map(sql=>({sql:sql.replace(/CREATE TABLE (?!IF NOT EXISTS)/g,'CREATE TABLE IF NOT EXISTS ').replace(/CREATE INDEX (?!IF NOT EXISTS)/g,'CREATE INDEX IF NOT EXISTS ')}));
  await DB.batch([...statements,{sql:'INSERT OR IGNORE INTO finn_local_migrations(name,applied) VALUES(?,?)',args:[name,new Date().toISOString()]}]);
 }
}
