import {spawn} from 'node:child_process';
import {mkdtemp,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
await mkdir('.local',{recursive:true});
const dataDir=await mkdtemp(resolve('.local/public-check-')),origin='http://127.0.0.1:14174';
let child;
async function start(){child=spawn(process.execPath,['scripts/serve.mjs'],{env:{...process.env,HOST:'127.0.0.1',PORT:'14174',APP_ORIGIN:origin,PUBLIC_DEMO:'true',APP_ACCESS_TOKEN:'',DATA_DIR:dataDir,DATABASE_URL:'',TURSO_DATABASE_URL:'',TURSO_AUTH_TOKEN:'',GEMINI_API_KEY:'',RESEARCH_API_KEY:'',RESEARCH_FREE_TIER_CONFIRMED:'false'},stdio:['ignore','pipe','pipe'],windowsHide:true});let output='';child.stdout.on('data',x=>output+=x);child.stderr.on('data',x=>output+=x);for(let i=0;i<100;i++){if(child.exitCode!==null)throw Error(output);try{if((await fetch(origin+'/health')).ok)return}catch{}await new Promise(r=>setTimeout(r,100))}throw Error('Public preview did not start')}
async function stop(){if(child?.exitCode===null)await new Promise(resolve=>{child.once('exit',resolve);child.kill()})}
try{
 await start();
 const a=await fetch(origin+'/api/bootstrap'),b=await fetch(origin+'/api/bootstrap');
 const cookieA=a.headers.get('set-cookie').split(';')[0],cookieB=b.headers.get('set-cookie').split(';')[0];
 assert.notEqual(cookieA,cookieB);assert.equal((await a.json()).signedIn,true);assert.equal((await b.json()).historyAvailable,true);
 const response=await fetch(origin+'/api/research',{method:'POST',headers:{cookie:cookieA,'Content-Type':'application/json'},body:JSON.stringify({symbol:'INFY',question:'Did management deliver on FY26 guidance?'})});const note=await response.json();assert.equal(response.status,200);assert.equal(note.historySaved,true);
 assert.equal((await (await fetch(origin+'/api/history',{headers:{cookie:cookieB,'oai-authenticated-user-id':'standalone-owner'}})).json()).items.length,0);
 await stop();await start();
 const history=await (await fetch(origin+'/api/history',{headers:{cookie:cookieA}})).json();assert.equal(history.items.length,1);
 assert.equal((await fetch(origin+'/api/history/'+note.answerKey,{headers:{cookie:cookieB}})).status,404);
 const reopened=await (await fetch(origin+'/api/history/'+note.answerKey,{headers:{cookie:cookieA}})).json();assert.equal(reopened.answer.cache.reused,true);
 console.log('Public smoke passed: no sign-in, isolated browser histories, forgery rejection and restart persistence.');
}finally{await stop()}
