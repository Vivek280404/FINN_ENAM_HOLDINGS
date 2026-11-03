const pending=new Map();
export const normalizeQuestion=q=>q.normalize('NFKC').trim().replace(/\s+/g,' ').replace(/[?.!]+$/,'').toLowerCase();
export async function answerKey(symbol,question,model='sources'){
 const bytes=new TextEncoder().encode('research-v14:'+symbol+':'+normalizeQuestion(question)+':'+model);
 return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');
}
export function ownerId(request,env){return request.headers.get('oai-authenticated-user-id')||(env.LOCAL_PREVIEW==='true'?'local-preview':null)}
export async function savedResearch(env,key,produce,{refresh=false}={}){
 if(env.DB&&!refresh){const row=await env.DB.prepare('SELECT payload,created,expires FROM research_answers WHERE key = ?').bind(key).first();if(row&&row.expires>Date.now())return {...JSON.parse(row.payload),cache:{reused:true,savedAt:row.created,expiresAt:new Date(row.expires).toISOString()},answerKey:key}}
 if(pending.has(key))return {...await pending.get(key),cache:{reused:true},answerKey:key};
 const job=(async()=>{const result=await produce(),created=new Date().toISOString(),expires=Date.now()+86400e3;
  if(result.claims?.length&&env.DB)await env.DB.prepare('INSERT INTO research_answers(key,payload,created,expires) VALUES(?,?,?,?) ON CONFLICT(key) DO UPDATE SET payload=excluded.payload,created=excluded.created,expires=excluded.expires').bind(key,JSON.stringify(result),created,expires).run();
  return {...result,answerKey:key,cache:{reused:false,savedAt:created,expiresAt:new Date(expires).toISOString()}};
 })();pending.set(key,job);try{return await job}finally{pending.delete(key)}
}
export async function remember(env,owner,key,symbol,question,result){
 if(!env.DB||!owner||!result.claims?.length)return false;
 const at=new Date().toISOString();
 await env.DB.prepare('INSERT INTO research_history(owner_id,answer_key,company,question,created,viewed) VALUES(?,?,?,?,?,?) ON CONFLICT(owner_id,answer_key) DO UPDATE SET viewed=excluded.viewed').bind(owner,key,symbol,question,at,at).run();return true;
}
export async function history(env,owner){
 const result=await env.DB.prepare('SELECT h.answer_key AS id,h.company,h.question,h.created,h.viewed,a.payload,a.expires FROM research_history h JOIN research_answers a ON a.key=h.answer_key WHERE h.owner_id=? ORDER BY h.viewed DESC LIMIT 50').bind(owner).all();
 const seen=new Set();return result.results.map(({payload,...row})=>{const answer=JSON.parse(payload);return {...row,title:answer.title,rootQuestion:answer.conversation?.rootQuestion||null,turn:answer.conversation?.turn||0,rootKey:answer.conversation?.rootKey||null,stale:row.expires<Date.now()}}).filter(row=>{const key=row.company+':'+(row.rootKey||'root')+':'+normalizeQuestion(row.question);if(seen.has(key))return false;seen.add(key);return true});
}
