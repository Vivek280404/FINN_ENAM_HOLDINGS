import {normalizeQuestion} from './history.js';
const keyPattern=/^[a-f0-9]{64}$/;
export async function researchContext(env,owner,symbol,parentKey){
 if(!parentKey)return null;
 if(!owner||!env.DB)throw Object.assign(new Error('Sign in to continue your saved research.'),{status:401});
 if(typeof parentKey!=='string'||!keyPattern.test(parentKey))throw Object.assign(new Error('This research reference is invalid.'),{status:400});
 const chain=[],seen=new Set();let key=parentKey;
 while(key&&chain.length<8){
  if(seen.has(key))throw Object.assign(new Error('This research thread could not be resumed.'),{status:409});seen.add(key);
  const row=await env.DB.prepare('SELECT a.payload,a.created,a.expires,h.company,h.question FROM research_history h JOIN research_answers a ON a.key=h.answer_key WHERE h.owner_id=? AND h.answer_key=?').bind(owner,key).first();
  if(!row)throw Object.assign(new Error('Saved research is unavailable for this account. Open a report from your history or start a new investigation.'),{status:404});
  if(row.company!==symbol)throw Object.assign(new Error('A follow-up must stay with the same company. Start new research to switch companies.'),{status:409});
  const answer=JSON.parse(row.payload);chain.push({key,question:row.question,title:answer.title,answer,created:row.created,stale:row.expires<Date.now()});
  key=answer.conversation?.parentKey||null;
 }
 const chronological=[...chain].reverse(),parent=chain[0],root=parent.answer.conversation?.rootKey||chronological[0].key;
 return {owner,parentKey,rootKey:root,rootQuestion:parent.answer.conversation?.rootQuestion||chronological[0].question,turn:(parent.answer.conversation?.turn||0)+1,parent,chain:chronological,truncated:Boolean(key),priorTurns:chronological.slice(-4).map(x=>({question:x.question,title:x.title,researchStance:x.answer.conclusion?.stance||null,conclusion:(x.answer.conclusion?.rationale||[]).slice(0,1).map(c=>c.text).join(' ').slice(0,500),risks:(x.answer.sections||[]).find(s=>/risk|downside|counter/i.test(s.heading))?.paragraphs?.slice(0,1).map(c=>c.text).join(' ').slice(0,500)||'',summary:(x.answer.executiveSummary||x.answer.claims||[]).slice(0,2).map(c=>c.text).join(' ').slice(0,900)}))};
}
export async function contextualAnswerKey(symbol,question,model,context){
 const value=['followup-v1',symbol,normalizeQuestion(question),model,context.owner||'',context.parentKey,context.parent.answer.sourceFingerprint||context.parent.created].join(':');
 return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))].map(x=>x.toString(16).padStart(2,'0')).join('');
}
export function conversationMetadata(context,question){return context?{rootKey:context.rootKey,parentKey:context.parentKey,rootQuestion:context.rootQuestion,question,turn:context.turn,earlierTurnsOmitted:context.truncated}:null}
export function retrievalQuestion(question,context){return context?[context.rootQuestion,...context.priorTurns.slice(-2).map(t=>t.question),question].join('\n').slice(-3500):question}
export function inheritedEvidence(context){return (context?.parent.answer.sources||[]).filter(s=>s.text||s.excerpt).slice(0,8).map(s=>({...s,text:s.text||s.excerpt}))}
export function mergeEvidence(current,previous,max=20){const result=[],seen=new Set();for(const list of [current.slice(0,14),previous,current.slice(14)])for(const item of list)if(!seen.has(item.id)&&result.length<max){result.push(item);seen.add(item.id)}return result}
export function threadView(context,current){return [...(context?.chain||[]).map(t=>({key:t.key,question:t.question,title:t.title,created:t.created,stale:t.stale})),...(current?[current]:[])]}
