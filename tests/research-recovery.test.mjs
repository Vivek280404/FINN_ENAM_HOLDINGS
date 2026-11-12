import test from 'node:test';import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {savedResearch} from '../src/history.js';import {researchRequest} from '../web/research-stream.js';
const stream=value=>new Response(JSON.stringify({type:'result',data:value})+'\n',{headers:{'Content-Type':'application/x-ndjson'}});
test('a lost final response recovers the persisted answer without repeating generation or refresh',async()=>{
 const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE research_answers(key TEXT PRIMARY KEY,payload TEXT NOT NULL,created TEXT NOT NULL,expires INTEGER NOT NULL)');
 const env={DB:{prepare(sql){
  return {bind(...values){
   return {async first(){return db.prepare(sql).get(...values)},async run(){return db.prepare(sql).run(...values)}};
  }};
 }}};
 let requests=0,generations=0;const progress=[];const input={symbol:'INFY',question:'Why did cash flow change?',refresh:true,parentAnswerKey:'parent'};
 try{const answer=await researchRequest(input,{onProgress:p=>progress.push(p.message),send:async(_,options)=>{
  requests++;const body=JSON.parse(options.body);assert.equal(body.parentAnswerKey,'parent');assert.equal(body.question,input.question);assert.equal(body.refresh,requests===1);
  const result=await savedResearch(env,'recovery-test',async()=>{generations++;return {title:'Saved research',claims:[{text:'Evidence'}]}},{refresh:body.refresh});
  if(requests===1)return new Response(new ReadableStream({start(controller){controller.error(new TypeError('terminated'))}}),{headers:{'Content-Type':'application/x-ndjson'}});
  return stream(result);
 }});assert.equal(answer.cache.reused,true);assert.equal(requests,2);assert.equal(generations,1);assert.ok(progress.some(p=>p.includes('recovering saved research')))}finally{db.close()}
});
test('connection recovery is bounded to one retry',async()=>{
 let requests=0;await assert.rejects(()=>researchRequest({symbol:'INFY',question:'Overview'},{send:async()=>{requests++;throw new TypeError('Failed to fetch')}}),/connection was interrupted/);assert.equal(requests,2);
});
test('provider errors and user cancellation do not trigger connection recovery',async()=>{
 let requests=0;await assert.rejects(()=>researchRequest({symbol:'INFY',question:'Overview'},{send:async()=>{requests++;return new Response('{"type":"error","message":"Gemini unavailable (503)"}\n',{headers:{'Content-Type':'application/x-ndjson'}})}}),/503/);assert.equal(requests,1);
 const cancel=new AbortController();requests=0;await assert.rejects(()=>researchRequest({symbol:'INFY',question:'Overview'},{signal:cancel.signal,send:async()=>{requests++;cancel.abort();throw cancel.signal.reason}}),{name:'AbortError'});assert.equal(requests,1);
});
