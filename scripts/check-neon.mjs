import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {neonDatabase} from '../src/neon-database.js';
import {researchContext} from '../src/conversation.js';

if(!process.env.DATABASE_URL)throw Error('Set DATABASE_URL privately before running the Neon smoke test.');
await mkdir('.local',{recursive:true});
const origin='http://127.0.0.1:14175';let child;
async function start(){
 // A different empty local disk on each start proves that history comes from Neon.
 const dataDir=await mkdtemp(resolve('.local/neon-check-'));
 child=spawn(process.execPath,['scripts/serve.mjs'],{env:{...process.env,HOST:'127.0.0.1',PORT:'14175',APP_ORIGIN:origin,PUBLIC_DEMO:'true',APP_ACCESS_TOKEN:'',DATA_DIR:dataDir,TURSO_DATABASE_URL:'',TURSO_AUTH_TOKEN:'',GEMINI_API_KEY:'',RESEARCH_API_KEY:'',RESEARCH_FREE_TIER_CONFIRMED:'false'},stdio:['ignore','pipe','pipe'],windowsHide:true});
 let output='';child.stdout.on('data',x=>output+=x);child.stderr.on('data',x=>output+=x);
 for(let i=0;i<300;i++){if(child.exitCode!==null)throw Error('Neon startup failed: '+(output.match(/\[cause\]: \{[^\n]+/)?.[0]||'check private server logs.'));try{if((await fetch(origin+'/health',{signal:AbortSignal.timeout(500)})).ok)return}catch{}await new Promise(r=>setTimeout(r,100))}throw Error('Neon startup timed out.');
}
async function stop(){if(child?.exitCode===null)await new Promise(resolve=>{child.once('exit',resolve);child.kill()})}
try{
 await start();
 const bootstrap=await fetch(origin+'/api/bootstrap'),cookie=bootstrap.headers.get('set-cookie').split(';')[0];assert.equal((await bootstrap.json()).historyAvailable,true);
 const headers={cookie,'Content-Type':'application/json'};
 const question='Did management deliver on FY26 guidance?';
 const response=await fetch(origin+'/api/research',{method:'POST',headers,body:JSON.stringify({symbol:'INFY',question})}),answer=await response.json();assert.equal(response.status,200,JSON.stringify(answer));assert.equal(answer.historySaved,true);
 await stop();await start();
 const list=await (await fetch(origin+'/api/history',{headers})).json();assert.ok(list.items.some(item=>item.id===answer.answerKey));
 const repeatResponse=await fetch(origin+'/api/research',{method:'POST',headers,body:JSON.stringify({symbol:'INFY',question})});const repeated=await repeatResponse.json();assert.equal(repeatResponse.status,200,JSON.stringify(repeated));assert.equal(repeated.cache.reused,true);
 const stranger=await (await fetch(origin+'/api/history/'+answer.answerKey)).status;assert.equal(stranger,404);
 const DB=neonDatabase(process.env.DATABASE_URL),context=await researchContext({DB},'visitor:'+cookie.split('=')[1],'INFY',answer.answerKey);assert.equal(context.parentKey,answer.answerKey);assert.equal(context.rootQuestion,question);
 const budgetKey='smoke-budget:'+crypto.randomUUID(),budgetSQL="INSERT INTO cache(key,payload,expires) VALUES(?, '1', ?) ON CONFLICT(key) DO UPDATE SET payload=CAST((CAST(cache.payload AS INTEGER)+1) AS TEXT) WHERE CAST(cache.payload AS INTEGER) < ? RETURNING payload";
 const reservations=await DB.batch(Array.from({length:25},()=>({sql:budgetSQL,args:[budgetKey,Date.now()+120000,20]})));assert.equal(reservations.filter(r=>r.results.length).length,20);assert.equal((await DB.prepare('SELECT payload FROM cache WHERE key=?').bind(budgetKey).first()).payload,'20');
 console.log('Neon smoke passed: migrations, saved research, cache reuse after restart with an empty local disk, history isolation and follow-ups. No model calls used.');
}finally{await stop()}
