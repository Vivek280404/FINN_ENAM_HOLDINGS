import {verifiedMetrics} from './visuals.js';
import {reportInstruction,reportSchema,normalizeReport} from './report-contract.js';
import {verifiedFacts,financialComparisons} from './financial-report.js';
export const configured=env=>Boolean(env.RESEARCH_FREE_TIER_CONFIRMED==='true'&&(env.GEMINI_API_KEY||env.RESEARCH_API_KEY)&&env.RESEARCH_MODEL);

const dailyCalls=new Map();
async function reserveCall(env){
 const day=new Date().toISOString().slice(0,10),limit=20;
 if(env.DB){const row=await env.DB.prepare("INSERT INTO cache(key,payload,expires) VALUES(?, '1', ?) ON CONFLICT(key) DO UPDATE SET payload=CAST((CAST(cache.payload AS INTEGER)+1) AS TEXT) WHERE CAST(cache.payload AS INTEGER) < ? RETURNING payload").bind('model-budget:'+day,Date.now()+2*86400e3,limit).first();if(!row)throw new Error('The 20-call daily research limit has been reached. Cached answers and source evidence remain available.');}
 else{const count=dailyCalls.get(day)||0;if(count>=limit)throw new Error('The daily research limit has been reached.');dailyCalls.set(day,count+1);if(dailyCalls.size>2)dailyCalls.delete(dailyCalls.keys().next().value)}
}
export async function modelAnswer(question,evidence,env,send=fetch){
 if(!configured(env)||!evidence.length)return null;
 const model=env.RESEARCH_MODEL;
 const backend='https://generativelanguage.googleapis.com/v1beta/models/';
 if(!['gemini-3.5-flash-lite','gemini-3.1-flash-lite','gemini-3.8-flash','gemini-2.5-flash'].includes(model))throw new Error('This model is outside the configured free-tier allowlist.');
 const payload={method:'POST',headers:{'x-goog-api-key':env.GEMINI_API_KEY||env.RESEARCH_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({systemInstruction:{parts:[{text:reportInstruction}]},contents:[{role:'user',parts:[{text:JSON.stringify({question,researchScope:env.RESEARCH_CONTEXT||{},evidence})}]}],generationConfig:{temperature:0,maxOutputTokens:env.RESEARCH_CONTEXT?.conversation?6000:10000,responseMimeType:'application/json',responseSchema:reportSchema,thinkingConfig:model.startsWith('gemini-2.5')?{thinkingBudget:0}:{thinkingLevel:'LOW'}}})};
 let response;
 for(let attempt=0;attempt<2;attempt++){
  await reserveCall(env);
  try{response=await send(`${backend}${encodeURIComponent(model)}:generateContent`,{...payload,signal:AbortSignal.timeout(attempt?25000:50000)})}catch(error){throw new Error(error.name==='TimeoutError'||error.name==='AbortError'?'Research synthesis timed out. Your source documents are ready; retry the same question.':'Gemini could not be reached. Your source documents are ready; please retry shortly.')}
  if(![500,502,503,504].includes(response.status)||attempt)break;
  const retryAfter=Number(response.headers.get('retry-after'));
  await response.body?.cancel();
  env.RESEARCH_PROGRESS?.('Research service is busy; retrying once');
  await new Promise(resolve=>setTimeout(resolve,Number.isFinite(retryAfter)&&retryAfter>0?Math.min(3000,Math.max(1000,retryAfter*1000)):1250));
 }

 if(!response.ok){const status=response.status;let detail;try{detail=await response.json()}catch{}const disabled=detail?.error?.details?.some(d=>d.reason==='SERVICE_DISABLED');throw new Error(disabled?'The Gemini Developer API is disabled for this AI Studio project. Source evidence remains available.':status===400||status===401||status===403?'Gemini rejected the credential or model configuration.':status===429?'Gemini free quota is temporarily exhausted. Source evidence remains available; no paid fallback is used.':`Gemini is unavailable (HTTP ${status}).`)}
 const r=await response.json();const text=(r.candidates?.[0]?.content?.parts||[]).filter(p=>!p.thought).map(p=>p.text||'').join('');
 let result;try{result=JSON.parse(text)}catch{throw new Error('Research response was incomplete; inspect the source evidence.')}
 const report=normalizeReport(result,evidence);
 const validated=verifiedFacts(result.financialFacts,evidence,env.RESEARCH_CONTEXT?.symbol||'UNKNOWN');
 return {...report,financialFacts:validated.facts,comparisons:financialComparisons(validated.facts),factConflicts:validated.conflicts,omittedFacts:validated.rejected,extractionAudit:validated.audit,metrics:verifiedMetrics(result.metrics,evidence),usage:r.usageMetadata};
}
