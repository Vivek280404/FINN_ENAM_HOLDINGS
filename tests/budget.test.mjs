import test from 'node:test';import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';import {modelAnswer} from '../src/model.js';
test('persistent daily budget stops calls after twenty without paid fallback',async()=>{
 const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE cache(key TEXT PRIMARY KEY,payload TEXT NOT NULL,expires INTEGER NOT NULL)');
 const DB={prepare(sql){return {bind(...values){return {async first(){return db.prepare(sql).get(...values)}}}}}};
 const env={DB,GEMINI_API_KEY:'test-only',RESEARCH_MODEL:'gemini-3.5-flash-lite',RESEARCH_FREE_TIER_CONFIRMED:'true'};let calls=0;
 const send=async()=>{calls++;return Response.json({candidates:[{content:{parts:[{text:JSON.stringify({title:'Test',claims:[{text:'Reported evidence',sourceIds:['s1'],type:'Reported'}]})}]}}]})};
 for(let i=0;i<20;i++)await modelAnswer('Question',[{id:'s1',text:'Evidence'}],env,send);
 await assert.rejects(()=>modelAnswer('Question',[{id:'s1'}],env,send),/20-call daily/);assert.equal(calls,20);db.close();
});
