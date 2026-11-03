import {createServer} from 'node:http';
import {DatabaseSync} from 'node:sqlite';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {standaloneConfig,standaloneIdentity,authenticationResponse,publicVisitor} from '../src/standalone.js';
import worker from '../dist/server/index.js';
import {remoteDatabase,migrateRemote} from '../src/remote-database.js';
const root=fileURLToPath(new URL('../',import.meta.url)),config=standaloneConfig();
const dataDir=resolve(config.dataDir);await mkdir(dataDir,{recursive:true});
let db,DB;
const journal=JSON.parse(await readFile(resolve(root,'drizzle/meta/_journal.json'),'utf8'));
if(process.env.TURSO_DATABASE_URL||process.env.TURSO_AUTH_TOKEN){
 DB=remoteDatabase(process.env.TURSO_DATABASE_URL,process.env.TURSO_AUTH_TOKEN);
 const migrations=await Promise.all(journal.entries.map(async m=>({name:m.tag,sql:await readFile(resolve(root,'drizzle',m.tag+'.sql'),'utf8')})));
 await migrateRemote(DB,migrations);
}else{
 db=new DatabaseSync(resolve(dataDir,'finn.sqlite'));
db.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');
db.exec('CREATE TABLE IF NOT EXISTS finn_local_migrations(name TEXT PRIMARY KEY, applied TEXT NOT NULL)');
for(const migration of journal.entries){
 if(db.prepare('SELECT name FROM finn_local_migrations WHERE name=?').get(migration.tag))continue;
 const legacyTable=migration.tag==='0000_initial'?'documents':migration.tag==='0001_research_history'?'research_history':null;
 const exists=legacyTable&&db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(legacyTable);
 db.exec('BEGIN');try{if(!exists)db.exec(await readFile(resolve(root,'drizzle',migration.tag+'.sql'),'utf8'));db.prepare('INSERT INTO finn_local_migrations(name,applied) VALUES(?,?)').run(migration.tag,new Date().toISOString());db.exec('COMMIT')}catch(error){db.exec('ROLLBACK');throw error}
}
DB={prepare(sql){return {bind(...values){return {async all(){return {results:db.prepare(sql).all(...values)}},async first(){return db.prepare(sql).get(...values)},async run(){return db.prepare(sql).run(...values)}}}}}};
}
const BUCKET={async put(key,bytes){if(!/^documents\/[a-f0-9]{64}$/.test(key))throw new Error('Invalid document storage key');const path=resolve(dataDir,key);await mkdir(dirname(path),{recursive:true});await writeFile(path,bytes)}};
const env={DB,BUCKET,RESEARCH_FREE_TIER_CONFIRMED:process.env.RESEARCH_FREE_TIER_CONFIRMED,GEMINI_API_KEY:process.env.GEMINI_API_KEY,RESEARCH_API_KEY:process.env.RESEARCH_API_KEY,RESEARCH_MODEL:process.env.RESEARCH_MODEL,PUBLIC_DEMO:config.publicDemo?'true':'false'};
async function send(res,response){res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()))}
const server=createServer(async(req,res)=>{
 try{
  const path=new URL(req.url,'http://localhost').pathname;
  if(path==='/health'&&req.method==='GET'){res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end('{"status":"ok"}');return}
  const visitor=config.publicDemo?publicVisitor(req.headers,config.origin):null;
  const headers=visitor?.headers||standaloneIdentity(req.headers,config.token);
  if(visitor?.cookie)res.setHeader('Set-Cookie',visitor.cookie);
  if(!headers){await send(res,authenticationResponse());return}
  const chunks=[];let size=0;
  for await(const chunk of req){size+=chunk.length;if(size>12000){res.writeHead(413,{'Content-Type':'application/json'});res.end('{"error":"Request too large"}');return}chunks.push(chunk)}
  const origin=config.origin||'http://'+req.headers.host;
  const body=Buffer.concat(chunks),request=new Request(new URL(req.url,origin),{method:req.method,headers,...(body.length?{body}:{})});
  await send(res,await worker.fetch(request,env,{}));
 }catch(error){console.error('FINN request failed:',error.name);if(!res.headersSent)res.writeHead(500,{'Content-Type':'application/json'});res.end('{"error":"The request could not be completed. Please retry."}')}
});
server.requestTimeout=120000;
server.listen(config.port,config.host,()=>console.log(`FINN is available at ${config.origin||'http://'+config.host+':'+config.port}${config.token?' (password protected)':''}`));
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>server.close(()=>{db?.close();process.exit(0)}));
