process.stdin.setRawMode(true);process.stdin.setEncoding('utf8');let input='';
console.log('Ready for credential JSON on hidden stdin.');
process.stdin.on('data',async chunk=>{input+=chunk;if(!/[\r\n]/.test(input))return;process.stdin.removeAllListeners('data');process.stdin.setRawMode(false);process.stdin.pause();const {key}=JSON.parse(input.trim());input='';
 try{const r=await fetch('https://generativelanguage.googleapis.com/v1beta/models',{headers:{'x-goog-api-key':key},signal:AbortSignal.timeout(15000)});const d=await r.json();console.log(JSON.stringify({status:r.status,reason:d.error?.details?.find(x=>x.reason)?.reason,code:d.error?.status,models:d.models?.filter(m=>m.supportedGenerationMethods?.includes('generateContent')).map(m=>m.name),requestedOutputTokens:0}));}catch{console.log(JSON.stringify({error:'Access check could not complete',requestedOutputTokens:0}))}process.exit(0);
});process.stdin.resume();
