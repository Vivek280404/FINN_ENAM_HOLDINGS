import {researchContext,contextualAnswerKey,conversationMetadata,retrievalQuestion,inheritedEvidence,mergeEvidence,threadView} from './conversation.js';
import {enrichReviewed} from './reviewed-report.js';
import {classifyEvent as category} from './events.js';
import {factSources} from './financial-report.js';
import {modelAnswer,configured} from './model.js';
import {parseDocument,documentTitle} from './documents.js';
import {answerKey,savedResearch,ownerId,remember,history} from './history.js';
import {sources,portfolio,events,replay,guidance,actual} from './seed.js';
import {seedResearch,planQuestion,retrievePages} from './research.js';
import {materiality,marketSignal} from './finance.js';
const inflight=new Map();
const memory=new Map();
const now=()=>new Date().toISOString();
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export const ticker=s=>{const t=(s||'').toUpperCase().replace(/\.NS$/,'').trim();if(!/^[A-Z0-9][A-Z0-9&-]{0,24}$/.test(t))throw new Error('Enter a valid NSE symbol');return t};
export function allowedSource(url,companyHosts=[]){try{const u=new URL(url);return u.protocol==='https:'&& !u.username&&!u.password&&(!u.port||u.port==='443')&&['nseindia.com','bseindia.com','infosys.com',...companyHosts.filter(h=>typeof h==='string'&&/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(h)&&!/(?:^|\.)(?:localhost|local|internal|test)$/.test(h))].some(d=>u.hostname===d||u.hostname.endsWith('.'+d))}catch{return false}}
async function download(url,{max=8*1024*1024,timeout=15000,headers={},binary=false,redirects=0,companyHosts=[]}={}){
 const response=await fetch(url,{headers:{'User-Agent':'Mozilla/5.0 FINN Research/1.0','Accept':'*/*',...headers},signal:AbortSignal.timeout(timeout),redirect:'manual'});
 if(response.status>=300&&response.status<400){const next=new URL(response.headers.get('location'),url).href;if(redirects>=3||!allowedSource(next,companyHosts))throw new Error('Source redirect could not be followed safely');return download(next,{max,timeout,headers,binary,redirects:redirects+1,companyHosts})}
 if(!response.ok)throw new Error(`Source returned HTTP ${response.status}`);
 if(Number(response.headers.get('content-length'))>max)throw new Error('Document exceeds size limit');
 const reader=response.body.getReader(), chunks=[];let size=0;
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>max){await reader.cancel();throw new Error('Document exceeds size limit')}chunks.push(value)}
 const buffer=new Uint8Array(size);let offset=0;for(const c of chunks){buffer.set(c,offset);offset+=c.length}
 return binary?buffer:new TextDecoder().decode(buffer);
}
async function cached(env,key,ttl,fn){
 let row=memory.get(key);if(row?.expires>Date.now())return row.value;
 if(env.DB){row=await env.DB.prepare('SELECT payload,expires FROM cache WHERE key = ?').bind(key).first();if(row&&row.expires>Date.now()){const value=JSON.parse(row.payload);memory.set(key,{expires:row.expires,value});return value}}
 if(inflight.has(key))return inflight.get(key);
 const p=(async()=>{const value=await fn(),expires=Date.now()+ttl;memory.set(key,{value,expires});if(memory.size>24)memory.delete(memory.keys().next().value);if(env.DB)await env.DB.prepare('INSERT OR REPLACE INTO cache(key,payload,expires) VALUES(?,?,?)').bind(key,JSON.stringify(value),expires).run();return value})();
 inflight.set(key,p);try{return await p}finally{inflight.delete(key)}
}
async function exchange(path){
 const endpoint='https://www.nseindia.com/api/'+path;
 try{return JSON.parse(await download(endpoint,{headers:{Referer:'https://www.nseindia.com/',Accept:'application/json'},max:5e6,timeout:9000}))}catch(first){
  const root=await fetch('https://www.nseindia.com/',{signal:AbortSignal.timeout(6000),headers:{'User-Agent':'Mozilla/5.0'}});
  const cookie=(root.headers.getSetCookie?.()||[]).map(c=>c.split(';')[0]).join('; ');
  return JSON.parse(await download(endpoint,{headers:{Referer:'https://www.nseindia.com/',Accept:'application/json',Cookie:cookie},max:5e6,timeout:9000}));
 }
}
export async function discover(symbol,env,{refresh=false}={}){if(refresh){memory.delete('discover-v8:'+symbol);if(env.DB)await env.DB.prepare('DELETE FROM cache WHERE key=?').bind('discover-v8:'+symbol).run()}return cached(env,'discover-v8:'+symbol,3600e3,async()=>{
 const warnings=[];let name=portfolio.find(c=>c.symbol===symbol)?.name,sector=portfolio.find(c=>c.symbol===symbol)?.sector,links=[], resolved=false;

 try{
  const html=await download('https://www.screener.in/company/'+encodeURIComponent(symbol)+'/consolidated/',{timeout:10000,max:2e6});
  const h=html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);if(h){name=h[1].replace(/<[^>]+>/g,'').trim();resolved=true}
  const linksRaw=[...html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)].map(m=>({url:m[1].replace(/&amp;/g,'&'),website:/icon-link/.test(m[2]),title:m[2].replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim()}));
  const website=linksRaw.find(l=>l.website&&/^https?:\/\//.test(l.url)&&!allowedSource(l.url.replace(/^http:/,'https:'))&&!/screener|twitter|facebook|linkedin/.test(l.url));
  const companyHosts=website?[new URL(website.url).hostname.replace(/^www\./,'')]:[];
  const companyCdn=['blob.core.windows.net','azurefd.net','cloudfront.net'];
  links=linksRaw.filter(l=>(allowedSource(l.url,companyHosts)||(/^transcript$/i.test(l.title)&&allowedSource(l.url,companyCdn)))&&(/\.pdf(?:\?|$)/i.test(l.url))).map(l=>{const u=new URL(l.url);if(/AnnPdfOpen.aspx/i.test(u.pathname)&&/^[\w-]+\.pdf$/.test(u.searchParams.get('Pname')||''))l.url='https://www.bseindia.com/xml-data/corpfiling/AttachHis/'+u.searchParams.get('Pname');return {...l,primaryHost:new URL(l.url).hostname,issuer:name,title:l.title.split(/\b\d{1,2} (?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s*-\s*/)[0].trim(),kind:/^annual report\b/i.test(l.title)?'annual_report':/^transcript$/i.test(l.title)?'transcript':'filing',company:symbol}});
 }catch(e){warnings.push('Document directory unavailable: '+e.message)}
 if(!resolved)try{const q=await exchange('quote-equity?symbol='+encodeURIComponent(symbol));if(q.info?.symbol){resolved=true;name=q.info.companyName;sector=q.industryInfo?.industry||sector}}catch(e){warnings.push('Exchange identity lookup unavailable: '+e.message)}
 if(!links.length)try{const a=await exchange('corporate-announcements?index=equities&symbol='+encodeURIComponent(symbol));if(Array.isArray(a))links.push(...a.filter(a=>a.symbol===symbol&&allowedSource(a.attchmntFile)).slice(0,12).map(a=>({url:a.attchmntFile,title:a.desc||a.attchmntText||'Exchange disclosure',published:a.an_dt,kind:/transcript/i.test(a.desc+' '+a.attchmntText)?'transcript':'filing',company:symbol})))}catch(e){warnings.push('Recent disclosures unavailable: '+e.message)}
 const all=[...new Map(links.map(l=>[l.url,l])).values()];const unique=[...all.filter(d=>d.kind==='transcript'),...all.filter(d=>d.kind==='annual_report'),...all.filter(d=>d.kind==='filing')].slice(0,80);
 return {symbol,name:name||symbol,sector:sector||'Sector not classified',resolved,documents:unique,warnings,checkedAt:now(),coverage:unique.length?`${unique.length} primary-document links discovered; text coverage depends on successful extraction.`:'No primary documents could be retrieved. This does not establish that the company has no disclosures.'};
 })}
async function ingest(doc,env,{refresh=false}={}){if(refresh){memory.delete('doc-v3:'+doc.url);if(env.DB)await env.DB.prepare('DELETE FROM cache WHERE key=?').bind('doc-v3:'+doc.url).run()}return cached(env,'doc-v3:'+doc.url,86400e3,async()=>{
 if(!allowedSource(doc.url,doc.primaryHost?[doc.primaryHost]:[]))throw new Error('Only approved company or exchange disclosures can be processed');
 const bytes=await download(doc.url,{binary:true,max:24*1024*1024,timeout:22000,companyHosts:doc.primaryHost?[doc.primaryHost]:[]});
 const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');
 if(env.DB){const found=await env.DB.prepare('SELECT payload FROM documents WHERE hash = ?').bind(hash).first();if(found){const old=JSON.parse(found.payload);return {...old,title:documentTitle(doc,old.pages),totalPages:old.totalPages||old.pages.length,partial:Boolean(old.partial)}}}
 let pages=[],totalPages=1,partial=false;
 if(new TextDecoder().decode(bytes.slice(0,5))==='%PDF-'){
  ({pages,totalPages,partial}=await parseDocument(bytes));
 }else {const text=new TextDecoder().decode(bytes).replace(/<script\b[\s\S]*?<\/script>/gi,'').replace(/<style\b[\s\S]*?<\/style>/gi,'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ');pages=[{page:null,text:text.slice(0,180000)}]}
 if(pages.reduce((n,p)=>n+p.text.length,0)<100)throw new Error('No usable text; scanned documents require OCR which is unavailable');
 if(doc.issuer){const text=pages.slice(0,3).map(p=>p.text).join(' ').toLowerCase().replace(/[^a-z0-9]/g,'');const words=doc.issuer.toLowerCase().split(/\W+/).filter(w=>w.length>=4&&!['limited','india','company','ltd','corporation','industries'].includes(w));if(words.length&&!words.some(w=>text.includes(w)))throw new Error('Document issuer does not match the requested company');}
 const result={...doc,title:documentTitle(doc,pages),totalPages,partial,id:hash.slice(0,20),hash,pages,fetched:now()};
 if(env.BUCKET)await env.BUCKET.put('documents/'+hash,bytes,{httpMetadata:{contentType:'application/pdf'}});
 if(env.DB)await env.DB.prepare('INSERT OR IGNORE INTO documents(id,company,url,hash,kind,published,fetched,payload) VALUES(?,?,?,?,?,?,?,?)').bind(result.id,doc.company,doc.url,hash,doc.kind,doc.published||null,result.fetched,JSON.stringify(result)).run();
 return result;
 })}
async function research(symbol,question,env,{refresh=false,context=null}={}){
 if(symbol==='INFY'&&!refresh&&!context){const prepared=seedResearch(question);if(prepared&&(!configured(env)||prepared.ledger||/reported and adjusted|growth and what are the risks|acquisition/i.test(question))){const used=new Set(prepared.claims.flatMap(c=>c.sourceIds));return {...enrichReviewed(prepared),sources:prepared.sources.filter(s=>used.has(s.id)),method:'Reviewed historical analysis',asOf:replay.asOf}};}
 const query=retrievalQuestion(question,context),latestPlan=planQuestion(question),planned=planQuestion(query);
 if(latestPlan.periods.length)planned.periods=latestPlan.periods;
 const warnings=[],documents=[];let reusedDocuments=0;
 const newPeriod=latestPlan.periods.some(p=>!(context?.parent.answer.evidenceAssessment?.requestedPeriods||[]).includes(p));
 if(context&&!refresh&&env.DB){
  const urls=[...new Set([...(context.parent.answer.coverageDetail||[]).map(d=>d.url),...(context.parent.answer.sources||[]).map(d=>d.url)])].slice(0,6);
  for(const sourceUrl of urls){const row=await env.DB.prepare('SELECT payload FROM documents WHERE company=? AND url=? ORDER BY fetched DESC LIMIT 1').bind(symbol,sourceUrl).first();if(row){const doc=JSON.parse(row.payload);if(doc.pages?.length){documents.push(doc);reusedDocuments++}}}
 }
 const needDiscovery=!documents.length||refresh||newPeriod||/\b(?:latest|current|today|newest)\b/i.test(question);
 let company={symbol,name:symbol,sector:'Not classified',resolved:true,documents:[]};
 if(needDiscovery){
  company=await discover(symbol,env,{refresh});if(!company.resolved)warnings.push(...company.warnings);
  const currentDocuments=[...company.documents.filter(d=>d.kind==='transcript').slice(0,planned.multiPeriod?4:3),...company.documents.filter(d=>d.kind==='annual_report').slice(0,1)];
  const priorDocuments=(context?.parent.answer.sources||[]).filter(d=>d.url&&['transcript','annual_report'].includes(d.kind)).map(d=>({...d,company:symbol,primaryHost:new URL(d.url).hostname}));
  const ordered=context&&!refresh&&!newPeriod?[...priorDocuments,...currentDocuments.filter(d=>d.kind==='annual_report'),...currentDocuments]:[...currentDocuments,...priorDocuments];
  const candidates=[...new Map(ordered.map(d=>[d.url,d])).values()].slice(0,6);
  for(const d of candidates){if(documents.some(x=>x.url===d.url)&&!refresh)continue;try{const doc=await ingest(d,env,{refresh});const index=documents.findIndex(x=>x.url===d.url);if(index>=0)documents[index]=doc;else documents.push(doc)}catch(e){warnings.push({title:d.title,url:d.url,message:/size limit/.test(e.message)?'Available to read directly; too large for this research session.':/HTTP/.test(e.message)?'The publisher is not accepting automated access. Open the original report directly.':'This document could not be read during this session.'})}}
 }
 const prior=refresh?[]:inheritedEvidence(context),evidence=mergeEvidence(retrievePages(query,documents),prior);

 let answer;try{answer=await modelAnswer(question,evidence,{...env,RESEARCH_CONTEXT:{symbol,name:company.name,sector:company.sector,documentCount:documents.length,documents:documents.map(d=>({title:d.title,totalPages:d.totalPages,pagesRead:d.pages.length,partial:d.partial})),requestedPeriods:planned.periods,conversation:context?{rootQuestion:context.rootQuestion,priorTurns:context.priorTurns,previousAnswersAreEvidence:false}:null}})}catch(e){warnings.push({title:'Research availability',message:e.message})}
 if(answer){const used=new Set([...answer.claims.flatMap(c=>c.sourceIds),...(answer.metrics||[]).map(m=>m.sourceId),...(answer.financialFacts||[]).flatMap(factSources)]);return {...answer,sources:evidence.filter(s=>used.has(s.id)),coverage:`Based on ${documents.length} primary documents and ${evidence.length} retrieved pages.`,coverageDetail:documents.map(d=>({title:d.title,url:d.url,pagesRead:d.pages.length,totalPages:d.totalPages,partial:d.partial})),limitations:[...(documents.some(d=>d.partial)?['Selected sections of the annual report were read; this is not a full-report review.']:[]),'Findings are limited to the documents and periods shown below.'],warnings,continuation:context?{reusedDocuments,evidenceAsOf:context.parent.answer.checkedAt||context.parent.answer.asOf||context.parent.created,priorEvidenceStale:context.parent.stale,expandedSources:needDiscovery}:null,model:env.RESEARCH_MODEL,sourceFingerprint:documents.map(d=>d.hash).sort().join(':'),evidenceAssessment:{documentsRead:documents.length,pagesRetrieved:evidence.length,partialReports:documents.filter(d=>d.partial).length,requestedPeriods:planned.periods,reusedDocuments,followUp:Boolean(context)},method:context?'Follow-up research':'Source-based synthesis',checkedAt:now()};}
 return {availability:evidence.length?'The primary documents are ready, but a complete research note could not be generated. Retry the investigation or review the original sources below.':'The available sources did not support a research conclusion.',title:evidence.length?'Primary documents ready':'Research coverage is incomplete',claims:[],sources:evidence.map(e=>({...e,excerpt:e.text.slice(0,700)})),documents:company.documents,coverage:`${documents.length} annual reports/transcripts parsed. ${evidence.length} matching pages.`,warnings:[...warnings,...(!configured(env)?['Synthesis is not configured. Relevant source passages are available for direct review.']:[])],method:'Document retrieval',checkedAt:now(),next:'Try a question with a specific metric or reporting period.'};
}

export async function api(request,env={}){
 const url=new URL(request.url);let body={};
 if(request.method==='POST'){const origin=request.headers.get('origin');if(origin&&origin!==url.origin)return json({error:'Origin not allowed'},403);if(Number(request.headers.get('content-length'))>12000)return json({error:'Request too large'},413);const text=await request.text();if(text.length>12000)return json({error:'Request too large'},413);try{body=JSON.parse(text)}catch{return json({error:'Invalid JSON'},400)}}
 const started=Date.now();let runStatus='completed';try{
 const owner=ownerId(request,env);
 if(url.pathname.startsWith('/api/history')){
  if(!owner)return json({error:'Sign in to view your research history'},401);
  if(!env.DB)return json({error:'History storage is unavailable'},503);
  if(url.pathname==='/api/history/clear'&&request.method==='POST'){await env.DB.prepare('DELETE FROM research_history WHERE owner_id=?').bind(owner).run();return json({cleared:true})}
  if(url.pathname==='/api/history'&&request.method==='GET')return json({items:await history(env,owner)});
  const key=url.pathname.slice('/api/history/'.length);
  if(request.method!=='GET'||!(/^[a-f0-9]{64}$/).test(key))return json({error:'Not found'},404);
  const row=await env.DB.prepare('SELECT a.payload,a.created,a.expires,h.company,h.question FROM research_history h JOIN research_answers a ON a.key=h.answer_key WHERE h.owner_id=? AND h.answer_key=?').bind(owner,key).first();
  if(!row)return json({error:'Saved research not found'},404);
  const payload=JSON.parse(row.payload),context=await researchContext(env,owner,row.company,payload.conversation?.parentKey);const thread=threadView(context,{key,question:row.question,title:payload.title,created:row.created,stale:row.expires<Date.now()});
  return json({symbol:row.company,question:row.question,answer:{...payload,continuation:context?{...payload.continuation,priorEvidenceStale:context.parent.stale}:payload.continuation,answerKey:key,thread,cache:{reused:true,savedAt:row.created,stale:row.expires<Date.now(),expiresAt:new Date(row.expires).toISOString()}}});
 }
 if(url.pathname==='/api/bootstrap')return json({portfolio,events,sources,replay,guidance,actual,researchConfigured:configured(env),signedIn:Boolean(owner),historyAvailable:Boolean(owner&&env.DB)});
 if(url.pathname==='/api/company')return json(await discover(ticker(url.searchParams.get('symbol')),env));
 if(url.pathname==='/api/research'&&request.method==='POST'){
  const symbol=ticker(body.symbol),question=String(body.question||'').trim()||'What are the business fundamentals, revenue and cash flow?';if((body.parentAnswerKey&&!String(body.question||'').trim())||question.length<(body.parentAnswerKey?2:4)||question.length>700)return json({error:'Enter a complete question of up to 700 characters'},400);
  const context=await researchContext(env,owner,symbol,body.parentAnswerKey);
  const key=context?await contextualAnswerKey(symbol,question,env.RESEARCH_MODEL||'sources',context):await answerKey(symbol,question,env.RESEARCH_MODEL||'sources');
  const result=await savedResearch(env,key,async()=>{const answer=await research(symbol,question,env,{refresh:body.refresh===true,context});return {...answer,conversation:conversationMetadata(context,question)}},{refresh:body.refresh===true});
  let historySaved=false;try{historySaved=await remember(env,owner,key,symbol,question,result)}catch{}
  const thread=threadView(context,result.claims?.length?{key,question,title:result.title,created:result.cache?.savedAt||now(),stale:false}:null);
  return json({...result,continuation:context?{...result.continuation,priorEvidenceStale:context.parent.stale}:result.continuation,thread,historySaved,durationMs:Date.now()-started});
 }
 if(url.pathname==='/api/briefing'){
  const symbols=(url.searchParams.get('symbols')||portfolio.map(p=>p.symbol).join(',')).split(',').slice(0,25).map(ticker);
  const data=await cached(env,'announcements-v2',300e3,()=>exchange('corporate-announcements?index=equities'));
  if(!Array.isArray(data))throw new Error('Exchange response could not be interpreted');
  const rows=data.filter(a=>symbols.includes(a.symbol)&&allowedSource(a.attchmntFile)).map(a=>{const cat=category(a.desc+' '+a.attchmntText);return {id:a.attchmntFile,company:a.symbol,name:a.sm_name||a.symbol,title:a.desc||'Company disclosure',summary:a.attchmntText||'Open the filing to inspect the disclosure.',category:cat,published:a.an_dt,url:a.attchmntFile,...materiality({category:cat}),sourceIds:[],novelty:'Newly retrieved; prior disclosure history has not been checked.'}});
  return json({events:[...new Map(rows.map(e=>[e.id,e])).values()],checkedAt:now(),coverage:'Exchange response window only. An empty result is not proof of no disclosures.',mode:'current'});
 }
 if(url.pathname==='/api/market'){
  const symbol=ticker(url.searchParams.get('symbol'));
  const data=await cached(env,'market-v3:'+symbol,1800e3,async()=>JSON.parse(await download('https://query1.finance.yahoo.com/v8/finance/chart/'+encodeURIComponent(symbol+'.NS')+'?range=3mo&interval=1d&events=splits',{timeout:10000,max:1e6})));
  const c=data.chart?.result?.[0];if(!c)throw new Error('No daily market history available');
  const q=c.indicators.quote[0],ts=c.timestamp||[];
  const indiaDate=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Kolkata'}), hour=Number(new Date().toLocaleTimeString('en-GB',{timeZone:'Asia/Kolkata',hour:'2-digit',hour12:false}));
  const rows=ts.map((t,i)=>{const date=new Date(t*1000).toISOString().slice(0,10);return {date,close:q.close[i],volume:q.volume[i],complete:date<indiaDate||(date===indiaDate&&hour>=17)}});
  return json({symbol,provider:'Yahoo Finance · daily bars',checkedAt:now(),...marketSignal(rows,{volumeMultiple:Math.max(1,Number(url.searchParams.get('volume'))||2),pricePercent:Math.max(.5,Number(url.searchParams.get('price'))||5),corporateAction:Object.keys(c.events?.splits||{}).length>0}),sessions:rows.filter(x=>x.complete).slice(-21)});
 }
 return json({error:'Not found'},404);
 }catch(e){runStatus='failed';return json({error:e.message,checkedAt:now(),partial:true},e.status||502)}finally{if(env.DB&&url.pathname!=='/api/bootstrap')try{await env.DB.prepare('INSERT INTO runs(id,company,operation,status,duration_ms,created,details) VALUES(?,?,?,?,?,?,?)').bind(crypto.randomUUID(),body.symbol||url.searchParams.get('symbol'),url.pathname,runStatus,Date.now()-started,now(),null).run()}catch{}}
}






