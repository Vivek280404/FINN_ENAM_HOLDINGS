import {api} from '../src/service.js';
import {streamResearch} from '../src/research-stream.js';
import html from '../web/index.html';
import css from '../web/style.css';
import mobileCss from '../web/mobile.css';
import goldCss from '../web/gold.css';
import script from '../web/app.js';
const assets={'/':[html,'text/html; charset=utf-8'],'/style.css':[css,'text/css; charset=utf-8'],'/mobile.css':[mobileCss,'text/css; charset=utf-8'],'/gold.css':[goldCss,'text/css; charset=utf-8'],'/app.js':[script,'text/javascript; charset=utf-8']};
export default {async fetch(request,env,ctx){const path=new URL(request.url).pathname;if(path==='/api/research/stream')return streamResearch(request,env,api);if(path.startsWith('/api/'))return api(request,env);const item=assets[path];if(!item)return new Response('Not found',{status:404});return new Response(item[0],{headers:{'Content-Type':item[1],'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','Content-Security-Policy':"default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; script-src 'self'; connect-src 'self'; img-src 'self' data: https://images.unsplash.com; frame-ancestors 'self' https://*.chatgpt.com https://chatgpt.com"}})}};

