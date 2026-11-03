// Accept a process-local credential without saving it or placing it in arguments.
process.stdin.setRawMode(true);process.stdin.resume();process.stdout.write('Ready for credential JSON on hidden stdin.\n');
let input='';process.stdin.on('data',async chunk=>{input+=chunk.toString();if(!input.includes('\n')&&!input.includes('\r'))return;process.stdin.removeAllListeners('data');process.stdin.setRawMode(false);process.stdin.pause();let settings;try{settings=JSON.parse(input.trim())}catch{console.error('Invalid input');process.exit(1)}input='';process.env.GEMINI_API_KEY=settings.key;process.env.RESEARCH_FREE_TIER_CONFIRMED='true';process.env.RESEARCH_MODEL='gemini-3.5-flash-lite';settings.key='';
 if(process.argv.includes('--check')){
  try{const response=await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent',{method:'POST',headers:{'x-goog-api-key':process.env.GEMINI_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({contents:[{parts:[{text:'Return the single word OK.'}]}],generationConfig:{maxOutputTokens:20,thinkingConfig:{thinkingLevel:'LOW'}}}),signal:AbortSignal.timeout(20000)});const d=await response.json();console.log(JSON.stringify({status:response.status,accepted:response.ok,code:d.error?.status,reason:d.error?.details?.find(x=>x.reason)?.reason,text:response.ok?d.candidates?.[0]?.content?.parts?.[0]?.text:undefined}));}catch{console.log(JSON.stringify({accepted:false,reason:'Network request failed'}))}
  process.exit(0);
 }else await import('./serve.mjs');
});




