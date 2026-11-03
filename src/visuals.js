const compact=s=>String(s).normalize('NFKC').replace(/,/g,'').replace(/\s+/g,' ').trim().toLowerCase();
export function verifiedMetrics(metrics,evidence){
 const byId=new Map(evidence.map(e=>[e.id,e]));
 return (Array.isArray(metrics)?metrics:[]).filter(m=>{
  const source=byId.get(m.sourceId);if(!source||typeof m.quote!=='string'||m.quote.length<10||m.quote.length>650||typeof m.value!=='string'||m.value.length>45||typeof m.label!=='string'||m.label.length>70||typeof m.context!=='string'||m.context.length>130)return false;
  const quote=compact(m.quote),value=compact(m.value),numbers=value.match(/-?\d+(?:\.\d+)?/g);
  return m.quote.trim().split(/\s+/).length<=60&&compact(source.text).includes(quote)&&quote.includes(value)&&numbers?.length&&numbers.every(n=>new RegExp('(^|[^\\d.])'+n.replace('.','\\.')+'([^\\d.]|$)').test(quote));
 }).slice(0,3).map(m=>({label:m.label,value:m.value,context:m.context,sourceId:m.sourceId,quote:m.quote}));
}
