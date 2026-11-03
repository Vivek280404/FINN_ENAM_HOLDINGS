import {getDocumentProxy} from 'unpdf';
export async function parseDocument(bytes){
 const pdf=await getDocumentProxy(bytes.slice(),{isEvalSupported:false,useSystemFonts:false});
 try{
  if(pdf.numPages>1200)throw new Error('This report is too long to process in one request');
  const totalPages=pdf.numPages,chosen=new Set();
  if(totalPages<=90)for(let p=1;p<=totalPages;p++)chosen.add(p);
  else{
   for(let p=1;p<=Math.min(12,totalPages);p++)chosen.add(p);
   const outline=await pdf.getOutline().catch(()=>null);
   async function visit(items){for(const item of items||[]){if(/financial|management|discussion|analysis|business|risk|cash flow|consolidated/i.test(item.title||'')){
    try{const dest=typeof item.dest==='string'?await pdf.getDestination(item.dest):item.dest;const index=dest?.[0];const start=typeof index==='number'?index:await pdf.getPageIndex(index);for(let p=start+1;p<=Math.min(totalPages,start+9)&&chosen.size<70;p++)chosen.add(p)}catch{}
   }await visit(item.items)}}await visit(outline);
   for(let p=Math.max(1,totalPages-24);p<=totalPages&&chosen.size<90;p++)chosen.add(p);
  }
  const pages=[];
  for(const page of [...chosen].sort((a,b)=>a-b)){
   const p=await pdf.getPage(page),content=await p.getTextContent();
   const text=content.items.map(i=>i.str+(i.hasEOL?'\n':' ')).join('').slice(0,18000);pages.push({page,text});p.cleanup();
  }
  return {pages,totalPages,partial:chosen.size<totalPages};
 }finally{await pdf.destroy()}
}
export function documentTitle(doc,pages){
 const issuer=doc.issuer||doc.company||'',raw=pages.slice(0,3).map(p=>p.text).join(' ');
 const quarter=raw.match(/\b(Q[1-4])\s*[-–]?\s*(?:FY\s*)?['’]?(20\d{2}|\d{2})\b/i);
 const period=quarter?`${quarter[1].toUpperCase()} FY${quarter[2].slice(-2)}`:'';
 const base=/^transcript$/i.test(doc.title||'')?`${period?period+' ':''}Earnings call transcript`:doc.title;
 return `${issuer}${issuer?' · ':''}${base||'Company disclosure'}`;
}
