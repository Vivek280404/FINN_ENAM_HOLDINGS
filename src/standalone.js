import {timingSafeEqual,randomBytes} from 'node:crypto';
function sameSecret(left,right){const a=Buffer.from(left||''),b=Buffer.from(right||'');return a.length===b.length&&timingSafeEqual(a,b)}
export function standaloneConfig(env=process.env){
 const host=env.HOST||'127.0.0.1',port=Number(env.PORT||4173),token=env.APP_ACCESS_TOKEN||'',publicDemo=env.PUBLIC_DEMO==='true';
 if(!Number.isInteger(port)||port<1||port>65535)throw new Error('PORT must be between 1 and 65535.');
 if(publicDemo&&token)throw new Error('Choose PUBLIC_DEMO or APP_ACCESS_TOKEN, not both.');
 if(!publicDemo&&!['127.0.0.1','localhost','::1'].includes(host)&&token.length<24)throw new Error('Set APP_ACCESS_TOKEN to at least 24 characters, or explicitly enable PUBLIC_DEMO.');
 let origin=env.APP_ORIGIN||env.RENDER_EXTERNAL_URL||'';
 if(origin){const u=new URL(origin);if(!['http:','https:'].includes(u.protocol)||u.username||u.password||u.pathname!=='/'||u.search||u.hash)throw new Error('APP_ORIGIN must be the public http(s) origin, without a path.');origin=u.origin}
 if(publicDemo&&!['127.0.0.1','localhost','::1'].includes(host)&&!origin.startsWith('https://'))throw new Error('Public deployments need an HTTPS APP_ORIGIN or RENDER_EXTERNAL_URL.');
 return {host,port,token,origin,publicDemo,dataDir:env.DATA_DIR||'.local'};
}
export function standaloneIdentity(input,token=''){
 const headers=new Headers(input),authorization=headers.get('authorization')||'';
 for(const name of [...headers.keys()])if(name.toLowerCase().startsWith('oai-authenticated-'))headers.delete(name);
 headers.delete('authorization');
 if(token){let supplied='';if(authorization.startsWith('Basic ')){try{const decoded=Buffer.from(authorization.slice(6),'base64').toString('utf8');const index=decoded.indexOf(':');if(index>=0)supplied=decoded.slice(index+1)}catch{}}if(authorization.startsWith('Bearer '))supplied=authorization.slice(7);if(!sameSecret(supplied,token))return null;}
 headers.set('oai-authenticated-user-id','standalone-owner');return headers;
}
export const authenticationResponse=()=>new Response('Sign in to FINN using username finn and your APP_ACCESS_TOKEN as the password.',{status:401,headers:{'WWW-Authenticate':'Basic realm="FINN", charset="UTF-8"','Cache-Control':'no-store','Content-Type':'text/plain; charset=utf-8'}});

// An unguessable first-party cookie keeps browser histories separate without accounts.
export function publicVisitor(input,origin){
 const headers=standaloneIdentity(input),cookies=headers.get('cookie')||'';
 const match=cookies.match(/(?:^|;\s*)finn_visitor=([a-f0-9]{64})(?:;|$)/);
 const id=match?.[1]||randomBytes(32).toString('hex');
 headers.set('oai-authenticated-user-id','visitor:'+id);
 return {headers,cookie:match?null:`finn_visitor=${id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${origin.startsWith('https://')?'; Secure':''}`};
}
