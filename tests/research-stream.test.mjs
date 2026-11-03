import test from 'node:test';import assert from 'node:assert/strict';
import {streamResearch} from '../src/research-stream.js';
import {readResearchStream} from '../web/research-stream.js';
const request=()=>new Request('https://finn.test/api/research/stream',{method:'POST',body:'{"symbol":"INFY","question":"Overview"}'});
test('research sends progress immediately and delivers a delayed final answer',async()=>{
 let release;const gate=new Promise(resolve=>release=resolve);
 const response=await streamResearch(request(),{},async(input,env)=>{assert.equal(new URL(input.url).pathname,'/api/research');assert.equal((await input.json()).symbol,'INFY');env.RESEARCH_PROGRESS('Reading primary documents');await gate;return Response.json({title:'Cited answer',claims:[{text:'Supported'}]})},{heartbeatMs:5});
 const reader=response.body.getReader(),first=await reader.read();assert.match(new TextDecoder().decode(first.value),/Checking saved research/);reader.releaseLock();
 const progress=[];const result=readResearchStream(response,p=>{progress.push(p.message);if(p.message==='Reading primary documents')release()});assert.equal((await result).title,'Cited answer');assert.ok(progress.includes('Reading primary documents'));
});
test('stream preserves API errors and turns interruption into an actionable error',async()=>{
 await assert.rejects(()=>readResearchStream(awaitResponse()),/Use a valid question/);
 function awaitResponse(){return new Response('{"type":"error","message":"Use a valid question"}\n',{headers:{'Content-Type':'application/x-ndjson'}})}
 const error=await streamResearch(request(),{},async()=>Response.json({error:'Invalid company'},{status:400}));await assert.rejects(()=>readResearchStream(error),/Invalid company/);
 const incomplete=new Response('{"type":"progress","message":"Reading"}\n',{headers:{'Content-Type':'application/x-ndjson'}});await assert.rejects(()=>readResearchStream(incomplete),/before the answer arrived/);
});
test('stream parsing handles split UTF-8 characters and packet boundaries',async()=>{
 const encoded=new TextEncoder().encode(JSON.stringify({type:'result',data:{title:'₹ cash flow'}})+'\n');let at=0;const body=new ReadableStream({pull(controller){if(at>=encoded.length){controller.close();return}controller.enqueue(encoded.slice(at,++at))}});
 assert.equal((await readResearchStream(new Response(body,{headers:{'Content-Type':'application/x-ndjson'}}))).title,'₹ cash flow');
});
test('deadline returns a clear error and cancellation leaves no open heartbeat timers',async()=>{
 let release;const gate=new Promise(resolve=>release=resolve);
 const response=await streamResearch(request(),{},async()=>{await gate;return Response.json({title:'Finished later'})},{heartbeatMs:2,deadlineMs:10});await assert.rejects(()=>readResearchStream(response),/taking too long/);release();
 const cancelled=await streamResearch(request(),{},async()=>Response.json({title:'Answer'}),{heartbeatMs:2});await cancelled.body.cancel();
 assert.equal((await streamResearch(new Request('https://finn.test/api/research/stream'),{},()=>{})).status,405);
});
