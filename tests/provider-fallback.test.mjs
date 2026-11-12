import test from 'node:test';import assert from 'node:assert/strict';
import {providerCredentials,providerRequest,createCredentialRouter} from '../src/provider-fallback.js';
const settings=keys=>({GEMINI_API_KEYS:JSON.stringify(keys),RESEARCH_CREDENTIAL_ROUTER:createCredentialRouter()});
const options={sleep:async()=>{}};
const payload={method:'POST',headers:{'Content-Type':'application/json'},body:'{"evidence":"public source"}'};
const request=(env,send,reserve=async()=>{},timing=options)=>providerRequest('https://generativelanguage.googleapis.com/model',payload,env,send,reserve,timing);
test('credential configuration deduplicates legacy keys and bounds the pool',()=>{
 assert.deepEqual(providerCredentials({GEMINI_API_KEYS:'["primary-test"," backup-test ","primary-test"]',GEMINI_API_KEY:'primary-test'}),['primary-test','backup-test']);
 assert.throws(()=>providerCredentials({GEMINI_API_KEYS:'not JSON'}));assert.throws(()=>providerCredentials({GEMINI_API_KEYS:'[1]'}));assert.throws(()=>providerCredentials(settings(['1','2','3','4','5','6','7'])));
});
test('temporary failure uses a backup and prefers the healthy credential next time',async()=>{
 const env=settings(['primary-test','backup-test']),seen=[];let reservations=0;
 const send=async(url,p)=>{assert.ok(!url.includes('primary-test'));seen.push(p.headers['x-goog-api-key']);return new Response('',{status:seen.length===1?503:200})};
 assert.equal((await request(env,send,async()=>reservations++)).status,200);assert.equal((await request(env,send,async()=>reservations++)).status,200);
 assert.deepEqual(seen,['primary-test','backup-test','backup-test']);assert.equal(reservations,3);
});
test('invalid credentials can fall through all five slots without changing the model or payload',async()=>{
 const keys=['invalid-1','invalid-2','invalid-3','invalid-4','valid-5'],env=settings(keys),seen=[];
 const response=await request(env,async(_,p)=>{seen.push(p.headers['x-goog-api-key']);assert.equal(p.body,payload.body);return seen.length<5?Response.json({error:{details:[{reason:'API_KEY_INVALID'}]}},{status:400}):new Response('',{status:200})});
 assert.equal(response.status,200);assert.deepEqual(seen,keys);
});
test('quota exhaustion stops the entire request without rotating credentials',async()=>{
 const env=settings(['one-test','two-test']);let calls=0;const send=async()=>{calls++;return new Response('',{status:429,headers:{'retry-after':'60'}})};
 assert.equal((await request(env,send)).status,429);await assert.rejects(()=>request(env,send),/free quota/);assert.equal(calls,1);
});
test('schema errors do not burn through credentials and persistent overload is bounded',async()=>{
 const env=settings(['one-test','two-test','three-test']);let calls=0;
 assert.equal((await request(env,async()=>{calls++;return Response.json({error:{message:'Invalid schema'}},{status:400})})).status,400);assert.equal(calls,1);
 calls=0;assert.equal((await request(env,async()=>{calls++;return new Response('',{status:503})})).status,503);assert.equal(calls,2);
});
test('network failure can recover through a backup and a local budget rejection makes no request',async()=>{
 const env=settings(['one-test','two-test']);let calls=0;const response=await request(env,async()=>{calls++;if(calls===1)throw new TypeError('network');return new Response('',{status:200})});assert.equal(response.status,200);assert.equal(calls,2);
 calls=0;await assert.rejects(()=>request(settings(['one-test','two-test']),async()=>{calls++;return new Response('')},async()=>{throw Error('20-call daily limit')}),/20-call/);assert.equal(calls,0);
});
test('failed credentials are temporarily skipped and become eligible after cooldown',async()=>{
 const env=settings(['one-test','two-test']);let clock=1000;const timing={now:()=>clock,sleep:async()=>{}};
 await request(env,async()=>new Response('',{status:503}),async()=>{},timing);
 let calls=0;await assert.rejects(()=>request(env,async()=>{calls++;return new Response('')},async()=>{},timing),/cooling down/);assert.equal(calls,0);
 clock+=31000;assert.equal((await request(env,async()=>{calls++;return new Response('')},async()=>{},timing)).status,200);
});
