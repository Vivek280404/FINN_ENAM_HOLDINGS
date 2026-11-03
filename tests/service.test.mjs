import test from 'node:test';import assert from 'node:assert/strict';import {api,ticker,allowedSource} from '../src/service.js';
test('ticker resolution is not limited to portfolio',()=>assert.equal(ticker('DIXON.NS'),'DIXON'));
test('invalid ticker rejected',()=>assert.throws(()=>ticker('../etc/passwd')));
test('private addresses are not source URLs',()=>{for(const u of ['http://localhost','https://127.0.0.1','https://nseindia.com.evil.test','https://user:pass@www.infosys.com/x','https://www.infosys.com:8080/x'])assert.equal(allowedSource(u),false)});
test('official disclosure accepted',()=>assert.equal(allowedSource('https://nsearchives.nseindia.com/a.pdf'),true));
test('cross-origin research POST rejected',async()=>assert.equal((await api(new Request('https://finn.test/api/research',{method:'POST',headers:{Origin:'https://evil.test'},body:'{}'}))).status,403));
test('malformed JSON gives controlled error',async()=>assert.equal((await api(new Request('https://finn.test/api/research',{method:'POST',body:'{' }))).status,400));
test('empty question runs the actual business overview',async()=>{const r=await api(new Request('https://finn.test/api/research',{method:'POST',body:JSON.stringify({symbol:'INFY',question:''})}));assert.equal(r.status,200);assert.equal((await r.json()).title,'Infosys · business and financial context')});
test('twenty concurrent prepared research requests complete',async()=>{const start=Date.now();const rs=await Promise.all(Array.from({length:20},()=>api(new Request('https://finn.test/api/research',{method:'POST',body:JSON.stringify({symbol:'INFY',question:'Did management deliver on guidance?'})}))));assert.ok(rs.every(r=>r.status===200));assert.ok(Date.now()-start<2000);const r=await rs[0].json();assert.equal(r.ledger.length,4);assert.equal(r.method,'Reviewed historical analysis')});

