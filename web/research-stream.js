export async function readResearchStream(response,onProgress=()=>{}){
 if(!response.ok||!response.headers.get('content-type')?.includes('application/x-ndjson')){
  let data;try{data=await response.json()}catch{throw Error('The service could not be reached. Please retry.')}
  if(!response.ok)throw Error(data.error||'Research could not be completed.');return data;
 }
 const reader=response.body.getReader(),decoder=new TextDecoder();let buffer='';
 try{while(true){const {value,done}=await reader.read();buffer+=decoder.decode(value||new Uint8Array(),{stream:!done});if(buffer.length>4000000)throw Error('Research response exceeded the supported size.');
  let end;while((end=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,end);buffer=buffer.slice(end+1);if(!line.trim())continue;let packet;try{packet=JSON.parse(line)}catch{throw Error('The research connection was interrupted. Please retry.')}
   if(packet.type==='progress')onProgress(packet);
   if(packet.type==='error')throw Error(packet.message||'Research could not be completed.');
   if(packet.type==='result')return packet.data;
  }
  if(done)throw Error('The connection ended before the answer arrived. Retry the same question to check for a saved result.');
 }}finally{await reader.cancel().catch(()=>{});reader.releaseLock()}
}
