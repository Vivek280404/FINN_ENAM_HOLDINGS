const connectionLost=cause=>Object.assign(new Error('The research connection was interrupted. Retry the same question to recover a saved answer.',{cause}),{code:'RESEARCH_CONNECTION_LOST'});
export async function researchRequest(body,{signal,onProgress=()=>{},send=fetch}={}){
 const deadline=AbortSignal.timeout(240000),bounded=signal?AbortSignal.any([signal,deadline]):deadline,started=Date.now();
 for(let attempt=0;attempt<2;attempt++){
  bounded.throwIfAborted();
  try{
   let response;try{response=await send('/api/research/stream',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(attempt?{...body,refresh:false}:body),signal:bounded})}catch(error){if(bounded.aborted||error.name==='AbortError')throw error;throw connectionLost(error)}
   return await readResearchStream(response,onProgress);
  }catch(error){
   if(attempt||bounded.aborted||error.code!=='RESEARCH_CONNECTION_LOST')throw error;
   onProgress({type:'progress',message:'Connection interrupted; recovering saved research',elapsed:Math.floor((Date.now()-started)/1000)});
   await new Promise(resolve=>setTimeout(resolve,500));
  }
 }
}
export async function readResearchStream(response,onProgress=()=>{}){
 if(!response.ok||!response.headers.get('content-type')?.includes('application/x-ndjson')){
  let data;try{data=await response.json()}catch(error){if(response.status>=500)throw connectionLost(error);throw Error('The service could not be reached. Please retry.')}
  if(!response.ok)throw Error(data.error||'Research could not be completed.');return data;
 }
 const reader=response.body.getReader(),decoder=new TextDecoder();let buffer='';
 try{while(true){let chunk;try{chunk=await reader.read()}catch(error){if(error.name==='AbortError'||error.name==='TimeoutError')throw error;throw connectionLost(error)}const {value,done}=chunk;buffer+=decoder.decode(value||new Uint8Array(),{stream:!done});if(buffer.length>4000000)throw Error('Research response exceeded the supported size.');
  let end;while((end=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,end);buffer=buffer.slice(end+1);if(!line.trim())continue;let packet;try{packet=JSON.parse(line)}catch{throw Error('The research connection was interrupted. Please retry.')}
   if(packet.type==='progress')onProgress(packet);
   if(packet.type==='error')throw Error(packet.message||'Research could not be completed.');
   if(packet.type==='result')return packet.data;
  }
  if(done)throw Object.assign(new Error('The connection ended before the answer arrived. Retry the same question to check for a saved result.'),{code:'RESEARCH_CONNECTION_LOST'});
 }}finally{await reader.cancel().catch(()=>{});reader.releaseLock()}
}
