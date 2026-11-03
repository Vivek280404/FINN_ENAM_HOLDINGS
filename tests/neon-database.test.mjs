import test from 'node:test';import assert from 'node:assert/strict';
import {neonDatabase,migrateNeon,postgresParameters,normalizePostgresRow} from '../src/neon-database.js';
const url='postgresql://test:test@ep-example.us-west-2.aws.neon.tech/finn?sslmode=require';
test('PostgreSQL parameters preserve literals and comments and keep values bound',async()=>{
 assert.deepEqual(postgresParameters("SELECT '?' AS literal, \"?\" FROM cache WHERE key=? -- ?\n AND payload=? /* ? */"),{text:"SELECT '?' AS literal, \"?\" FROM cache WHERE key=$1 -- ?\n AND payload=$2 /* ? */",count:2});
 let call;const DB=neonDatabase(url,()=>({query:async(...args)=>{call=args;return {rows:[{payload:'saved'}],rowCount:1}}}));
 const hostile="'); DROP TABLE cache;--";assert.equal((await DB.prepare('SELECT payload FROM cache WHERE key=?').bind(hostile).first()).payload,'saved');
 assert.equal(call[0],'SELECT payload FROM cache WHERE key=$1');assert.deepEqual(call[1],[hostile]);assert.ok(call[2].fetchOptions.signal);
});
test('Neon configuration fails closed and database failures hide credentials and SQL',async()=>{
 for(const bad of ['', 'https://example.com', 'postgresql://user:pass@evil.example/finn','postgresql://user@host.neon.tech/finn'])assert.throws(()=>neonDatabase(bad),/DATABASE_URL/);
 const DB=neonDatabase(url,()=>({query:async()=>{throw Error('private SQL '+url)}}));await assert.rejects(DB.prepare('SELECT ?').bind(1).first(),{message:'The persistent database is temporarily unavailable. Please retry.'});
});
test('PostgreSQL BIGINT millisecond timestamps become safe numbers for cache expiry dates',()=>{
 const expiry=Date.now()+86400000,row=normalizePostgresRow({expires:String(expiry),payload:'text'});assert.equal(row.expires,expiry);assert.ok(new Date(row.expires).toISOString());assert.equal(row.payload,'text');
 assert.throws(()=>normalizePostgresRow({expires:'9007199254740993'}),/supported range/);assert.deepEqual(normalizePostgresRow({payload:'text'}),{payload:'text'});
});
test('Neon migrations use BIGINT for millisecond expiry and transactional version tracking',async()=>{
 const calls=[];let transaction;
 const DB=neonDatabase(url,()=>({query:(text,args,options)=>{calls.push({text,args});return options?Promise.resolve({rows:[],rowCount:0}):{text,args}},transaction:async(statements)=>{transaction=statements;return statements.map(()=>({rows:[],rowCount:0}))}}));
 await migrateNeon(DB,[{name:'initial',sql:'CREATE TABLE cache(key TEXT PRIMARY KEY, expires INTEGER NOT NULL);\n--> statement-breakpoint\nCREATE INDEX expiry ON cache(expires);'}]);
 assert.match(transaction[0].text,/CREATE TABLE IF NOT EXISTS.*BIGINT/);assert.match(transaction[1].text,/CREATE INDEX IF NOT EXISTS/);assert.match(transaction[2].text,/ON CONFLICT\(name\) DO NOTHING/);assert.equal(transaction[2].args[0],'initial');assert.ok(calls.some(c=>c.text.includes('WHERE name=$1')));
});
test('Neon bounds concurrent database requests and releases slots after failure',async()=>{
 let active=0,peak=0,calls=0;const DB=neonDatabase(url,()=>({async query(){active++;peak=Math.max(peak,active);const id=++calls;await new Promise(resolve=>setTimeout(resolve,5));active--;if(id===1)throw Error('temporary');return {rows:[],rowCount:0}}}));
 const results=await Promise.allSettled(Array.from({length:12},()=>DB.prepare('SELECT 1').bind().all()));assert.equal(peak,4);assert.equal(results.filter(r=>r.status==='fulfilled').length,12);assert.equal(calls,13);assert.equal(active,0);
});
test('ambiguous writes and SQL errors are never retried',async()=>{
 let calls=0;const DB=neonDatabase(url,()=>({async query(){calls++;throw Error('network interrupted')}}));await assert.rejects(()=>DB.prepare('INSERT INTO cache VALUES(?,?,?)').bind('test','1',123).run());assert.equal(calls,1);
 calls=0;const invalid=neonDatabase(url,()=>({async query(){calls++;throw Object.assign(Error('syntax'),{code:'42601'})}}));await assert.rejects(()=>invalid.prepare('SELECT missing').bind().all());assert.equal(calls,1);
});
