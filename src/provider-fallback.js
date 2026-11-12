export function providerCredentials(env){
 let pool=[];
 if(env.GEMINI_API_KEYS){try{pool=Array.isArray(env.GEMINI_API_KEYS)?env.GEMINI_API_KEYS:JSON.parse(env.GEMINI_API_KEYS)}catch{throw new Error('GEMINI_API_KEYS must be a JSON array of credentials.')}}
 if(!Array.isArray(pool)||pool.some(key=>typeof key!=='string'))throw new Error('GEMINI_API_KEYS must be a JSON array of credentials.');
 const keys=[...new Set([...pool,env.GEMINI_API_KEY,env.RESEARCH_API_KEY].filter(key=>typeof key==='string'&&key.trim()).map(key=>key.trim()))];
 if(keys.length>6)throw new Error('Configure at most six research credentials.');return keys;
}
export function createCredentialRouter(){
 const pools=new Map();
 return {state(keys){const id=JSON.stringify(keys);if(!pools.has(id)){if(pools.size>=12)pools.delete(pools.keys().next().value);pools.set(id,{preferred:0,blocked:new Map(),quotaUntil:0})}return pools.get(id)}};
}
const router=createCredentialRouter();
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const transient=new Set([500,502,503,504]);
const authFailure=(status,detail)=>status===401||status===403||(status===400&&(/API[_ ]KEY[_ ](?:INVALID|EXPIRED)|API key (?:not valid|is invalid|has expired)/i.test(JSON.stringify(detail))));
export async function providerRequest(url,payload,env,send,reserve,{now=Date.now,sleep=delay}={}){
 const keys=providerCredentials(env),state=(env.RESEARCH_CREDENTIAL_ROUTER||router).state(keys),started=now(),attempted=new Set();
 if(!keys.length)throw new Error('Research credentials are not configured.');
 if(state.quotaUntil>now())throw new Error('Gemini free quota is temporarily exhausted. Source evidence remains available; no paid fallback is used.');
 let failures=0,lastResponse,lastError;
 const choose=()=>[state.preferred,...keys.map((_,i)=>i)].find((index,at,list)=>list.indexOf(index)===at&&!attempted.has(index)&&(state.blocked.get(index)||0)<=now());
 for(let attempt=0;attempt<keys.length+1;attempt++){
  let index=choose();
  if(index==null&&keys.length===1&&failures===1)index=0;
  if(index==null){if(lastResponse)return lastResponse;throw lastError||new Error('Research connections are cooling down. Please retry shortly; saved answers remain available.')}
  const remaining=75000-(now()-started);if(remaining<1000)throw new Error('Research synthesis timed out. Your source documents are ready; retry the same question.');
  await reserve();
  let response;
  try{response=await send(url,{...payload,headers:{...payload.headers,'x-goog-api-key':keys[index]},signal:AbortSignal.timeout(Math.min(attempt?20000:45000,remaining))})}
  catch(error){
   lastResponse=null;lastError=new Error(error.name==='TimeoutError'||error.name==='AbortError'?'Research synthesis timed out. Your source documents are ready; retry the same question.':'Gemini could not be reached. Your source documents are ready; please retry shortly.');
   state.blocked.set(index,now()+30000);attempted.add(index);failures++;
   if(failures>=2)throw lastError;
   env.RESEARCH_PROGRESS?.('Research service is busy; retrying once');await sleep(1250);continue;
  }
  if(response.ok){state.preferred=index;state.blocked.delete(index);return response}
  if(response.status===429){const seconds=Number(response.headers.get('retry-after'));state.quotaUntil=now()+Math.min(3600000,Math.max(60000,(Number.isFinite(seconds)?seconds:60)*1000));return response}
  let detail;if(response.status===400||response.status===401||response.status===403)try{detail=await response.clone().json()}catch{}
  if(authFailure(response.status,detail)){
   state.blocked.set(index,now()+600000);attempted.add(index);
   if(choose()==null)return response;
   env.RESEARCH_PROGRESS?.('Switching to an available research connection');await response.body?.cancel();lastResponse=null;continue;
  }
  if(!transient.has(response.status))return response;
  state.blocked.set(index,now()+30000);attempted.add(index);failures++;
  if(failures>=2||(choose()==null&&keys.length!==1))return response;
  const retryAfter=Number(response.headers.get('retry-after'));await response.body?.cancel();lastResponse=null;
  env.RESEARCH_PROGRESS?.(keys.length===1?'Research service is busy; retrying once':'Research service is busy; trying a backup connection');
  await sleep(Number.isFinite(retryAfter)&&retryAfter>0?Math.min(3000,Math.max(1000,retryAfter*1000)):1250);
 }
 throw lastError||new Error('No research connection could complete this request. Please retry shortly.');
}
