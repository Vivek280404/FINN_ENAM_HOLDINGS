import {spawn} from 'node:child_process';
import {mkdtemp,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
await mkdir(resolve(root,'.local'),{recursive:true});
const dataDir=await mkdtemp(resolve(root,'.local/portable-check-'));
const port=Number(process.env.CHECK_PORT||14173),origin='http://127.0.0.1:'+port,token='portable-check-password-at-least-24';
const authorization='Basic '+Buffer.from('finn:'+token).toString('base64');
let child;
async function start(){
 child=spawn(process.execPath,['scripts/serve.mjs'],{cwd:root,env:{...process.env,PUBLIC_DEMO:'false',DATABASE_URL:'',TURSO_DATABASE_URL:'',TURSO_AUTH_TOKEN:'',GEMINI_API_KEY:'',RESEARCH_API_KEY:'',RESEARCH_FREE_TIER_CONFIRMED:'false',HOST:'127.0.0.1',PORT:String(port),DATA_DIR:dataDir,APP_ACCESS_TOKEN:token,APP_ORIGIN:origin},stdio:['ignore','pipe','pipe'],windowsHide:true});
 let output='';child.stdout.on('data',c=>output+=c);child.stderr.on('data',c=>output+=c);
 for(let i=0;i<100;i++){if(child.exitCode!==null)throw new Error('Standalone server exited before readiness: '+output);try{if((await fetch(origin+'/health',{signal:AbortSignal.timeout(500)})).ok)return}catch{}await new Promise(r=>setTimeout(r,100))}
 throw new Error('Standalone readiness check timed out.');
}
async function stop(){if(!child||child.exitCode!==null)return;await new Promise(resolve=>{child.once('exit',resolve);child.kill()})}
try{
 await start();
 assert.equal((await fetch(origin+'/api/history',{headers:{'oai-authenticated-user-id':'forged'}})).status,401);
 const headers={authorization,'Content-Type':'application/json'};
 const research=await fetch(origin+'/api/research',{method:'POST',headers,body:JSON.stringify({symbol:'INFY',question:'Did management deliver on FY26 guidance?'})});assert.equal(research.status,200);
 const answer=await research.json();assert.equal(answer.historySaved,true);
 const before=await (await fetch(origin+'/api/history',{headers})).json();assert.equal(before.items.length,1);
 await stop();await start();
 const after=await (await fetch(origin+'/api/history',{headers})).json();assert.equal(after.items.length,1);
 const reopened=await (await fetch(origin+'/api/history/'+after.items[0].id,{headers})).json();assert.equal(reopened.answer.cache.reused,true);
 console.log('Standalone smoke passed: authentication, research, saved history, restart persistence and reopening.');
}finally{await stop()}
