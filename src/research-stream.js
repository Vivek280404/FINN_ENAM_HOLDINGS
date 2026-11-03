export async function streamResearch(request,env,handle,{heartbeatMs=8000,deadlineMs=180000}={}){
 if(request.method!=='POST')return Response.json({error:'Use POST for research.'},{status:405});
 const body=await request.text();if(body.length>12000)return Response.json({error:'Request too large'},{status:413});
 const url=new URL(request.url);url.pathname='/api/research';
 const input=new Request(url,{method:'POST',headers:request.headers,body});
 let closed=false,heartbeat,deadline,controller;
 const encoder=new TextEncoder();
 const emit=value=>{if(!closed)controller.enqueue(encoder.encode(JSON.stringify(value)+'\n'))};
 const finish=()=>{if(closed)return;closed=true;clearInterval(heartbeat);clearTimeout(deadline);controller.close()};
 const started=Date.now();let stage='Checking saved research';
 const stream=new ReadableStream({start(target){
  controller=target;emit({type:'progress',message:stage,elapsed:0});
  heartbeat=setInterval(()=>emit({type:'progress',message:stage,elapsed:Math.floor((Date.now()-started)/1000)}),heartbeatMs);
  deadline=setTimeout(()=>{emit({type:'error',message:'This investigation is taking too long. Retry the same question; any completed answer will be reused.'});finish()},deadlineMs);
  Promise.resolve().then(()=>handle(input,{...env,RESEARCH_PROGRESS:message=>{stage=message;emit({type:'progress',message:stage,elapsed:Math.floor((Date.now()-started)/1000)})}})).then(async response=>{const result=await response.json();emit(response.ok?{type:'result',data:result}:{type:'error',message:result.error||'Research could not be completed.'})}).catch(()=>emit({type:'error',message:'The investigation was interrupted. Please retry.'})).finally(finish);
 },cancel(){closed=true;clearInterval(heartbeat);clearTimeout(deadline)}});
 return new Response(stream,{headers:{'Content-Type':'application/x-ndjson; charset=utf-8','Cache-Control':'no-store, no-transform','X-Accel-Buffering':'no','X-Content-Type-Options':'nosniff'}});
}
