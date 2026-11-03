import {build} from 'esbuild';
import {mkdir,copyFile,cp} from 'node:fs/promises';
await mkdir('dist/server',{recursive:true});await mkdir('dist/.openai',{recursive:true});
const client=await build({entryPoints:['web/app.js'],bundle:true,write:false,format:'esm',platform:'browser',target:'es2022',minify:true});
await build({entryPoints:['worker/index.js'],outfile:'dist/server/index.js',bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true,loader:{'.html':'text','.css':'text'},plugins:[{name:'browser-script',setup(b){b.onLoad({filter:/web[\\/]app\.js$/},async()=>({contents:client.outputFiles[0].text,loader:'text'}))}}]});
await copyFile('.openai/hosting.json','dist/.openai/hosting.json');await cp('drizzle','dist/.openai/drizzle',{recursive:true});
console.log('Built FINN worker and database migrations.');
