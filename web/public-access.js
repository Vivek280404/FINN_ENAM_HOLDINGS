export const signInPath='/signin-with-chatgpt?return_to=%2F%23research';
export function signInCard(inDialog=false){
 return `<section class="followup-desk" ${inDialog?'':'id="followupDesk"'}><span class="eyebrow">YOUR PRIVATE RESEARCH WORKSPACE</span><h2>Continue your investigation</h2><p class="followup-help">You can read the briefing and research without signing in. Sign in to save this report and ask follow-up questions. Your history is visible only to your account.</p><a class="primary" href="${signInPath}" target="_top">Sign in with ChatGPT ↗</a><p class="muted">Your current question is kept in this tab so you can continue after signing in.</p></section>`;
}
export function pendingResearch(raw){
 try{const p=JSON.parse(raw||'null');if(!p||typeof p.symbol!=='string'||!/^[A-Z0-9][A-Z0-9&-]{0,24}$/.test(p.symbol)||typeof p.question!=='string'||p.question.length<4||p.question.length>700)return null;return {symbol:p.symbol,question:p.question,followup:typeof p.followup==='string'?p.followup.slice(0,700):''}}catch{return null}
}
