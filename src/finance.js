export const round = (n, places = 2) => Math.round((n + Number.EPSILON) * 10 ** places) / 10 ** places;
const scales = {unit: 1, thousand: 1e3, lakh: 1e5, million: 1e6, crore: 1e7, billion: 1e9, percent: 1};
function calendarDate(value) {
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))throw new Error('Reporting dates must use YYYY-MM-DD');
  const date=new Date(value+'T00:00:00Z');
  if(!Number.isFinite(+date)||date.toISOString().slice(0,10)!==value)throw new Error('Invalid calendar reporting date');
  return date;
}
function reportingPeriod(f) {
  const start=calendarDate(f.periodStart),end=calendarDate(f.periodEnd);
  if(start>end)throw new Error('Reporting period starts after it ends');
  return {start,end};
}
function calendarSpan(f) {
  const {start,end}=reportingPeriod(f),nextDay=new Date(+end+86400000);
  if(start.getUTCDate()!==1||nextDay.getUTCDate()!==1)throw new Error('Comparison requires complete calendar reporting months');
  const months=(end.getUTCFullYear()-start.getUTCFullYear())*12+end.getUTCMonth()-start.getUTCMonth()+1;
  if((f.duration==='quarter'&&months!==3)||(f.duration==='year'&&months!==12))throw new Error('Reporting dates do not match the stated duration');
  return months;
}
const monthDistance=(a,b)=>(a.getUTCFullYear()-b.getUTCFullYear())*12+a.getUTCMonth()-b.getUTCMonth();
export function normalize(f) {
  if (!f || f.value === null || f.value === undefined || !Number.isFinite(f.value)) throw new Error('Missing or invalid value');
  if (!(f.unit in scales)) throw new Error('Unknown unit');
  for (const k of ['company','metric','currency','periodStart','periodEnd','scope','definition','duration','sourceId']) if (!f[k]) throw new Error(`Missing ${k}`);
  reportingPeriod(f);
  return {...f, normalizedValue: f.value * scales[f.unit], fiscalYear: Number(f.periodEnd.slice(0,4)) + (Number(f.periodEnd.slice(5,7)) > 3 ? 1 : 0)};
}
export function compare(current, previous, kind = 'yoy') {
  let a,b; try { a=normalize(current); b=normalize(previous); } catch(e) {return {comparable:false,reason:e.message};}
  for (const k of ['company','metric','currency','scope','definition','duration']) if(a[k]!==b[k]) return {comparable:false,reason:`Different ${k}`};
  if ((a.unit==='percent') !== (b.unit==='percent')) return {comparable:false,reason:'Different measurement types'};
  if(!['yoy','qoq'].includes(kind))return {comparable:false,reason:'Unsupported comparison type'};
  try{
    if(calendarSpan(a)!==calendarSpan(b))return {comparable:false,reason:'Reporting periods have different lengths'};
    const pa=reportingPeriod(a),pb=reportingPeriod(b),offset=kind==='yoy'?12:3;
    if(monthDistance(pa.start,pb.start)!==offset||monthDistance(pa.end,pb.end)!==offset||(kind==='qoq'&&a.duration!=='quarter'))return {comparable:false,reason:'Reporting periods do not match the comparison'};
  }catch(e){return {comparable:false,reason:e.message}};
  const delta=a.normalizedValue-b.normalizedValue;
  if(a.unit==='percent') return {comparable:true,delta:round(delta),type:'percentage-points'};
  if(b.normalizedValue<=0) return {comparable:true,delta,percent:null,type:'absolute',reason:b.normalizedValue===0?'Zero base: percentage growth is undefined':'Negative base: show absolute change, not conventional growth'};
  return {comparable:true,delta,percent:round(delta/b.normalizedValue*100),type:'growth'};
}
export function margin(profit, revenue) {
  let a,b;try{a=normalize(profit);b=normalize(revenue)}catch(e){return {comparable:false,reason:e.message}};
  for(const k of ['company','currency','scope','periodStart','periodEnd','duration']) if(a[k]!==b[k])return {comparable:false,reason:`Different ${k}`};
  if(b.normalizedValue<=0 || a.unit==='percent'||b.unit==='percent')return {comparable:false,reason:'Invalid denominator or measurement'};
  return {comparable:true,value:round(a.normalizedValue/b.normalizedValue*100)};
}
export function assessGuidance(g, actual) {
  if(g.kind!=='numerical')return {status:'Not assessable',reason:'Qualitative commentary is not a numerical promise'};
  if(!actual)return {status:'Pending',reason:'Comparable actual result is unavailable'};
  for(const k of ['company','metric','definition','scope','currency','unit'])if(g[k]!==actual[k])return {status:'Not comparable',reason:`Different ${k}`};
  if(g.periodStart!==actual.periodStart || g.periodEnd!==actual.periodEnd)return {status:'Pending',reason:'The actual does not cover the complete target period'};
  if(g.conditions && !g.conditionsVerified)return {status:'Review conditions',reason:g.conditions};
  if(actual.value<g.low)return {status:'Below range',difference:round(actual.value-g.low)};
  if(actual.value>g.high)return {status:'Above range',difference:round(actual.value-g.high)};
  return {status:'Within range',difference:round(actual.value-g.low)};
}
export function materiality(event, denominator) {
  const critical=['insolvency','auditor_resignation','default','fraud','credit_downgrade'];
  if(critical.includes(event.category))return {tier:0,label:'Review now',reason:'Potential governance or solvency risk; preferences do not hide this event'};
  if(event.amount!=null && denominator?.value>0 && event.currency===denominator.currency){
    const ratio=event.amount/denominator.value*100;
    return {tier:ratio>=10?0:ratio>=2?1:2,label:ratio>=10?'Review now':ratio>=2?'Worth reviewing':'Context',ratio:round(ratio),reason:`${round(ratio)}% of ${denominator.label}. Screening heuristic, not a legal materiality threshold.`};
  }
  if(event.category==='results'||event.category==='guidance')return {tier:1,label:'Worth reviewing',reason:'Updates financial performance or management expectations'};
  return {tier:2,label:'Context',reason:event.known?'Previously disclosed; supporting information':'Financial magnitude has not been established'};
}
export function marketSignal(sessions, options={}) {
  const {volumeMultiple=2,pricePercent=5,asOf=Date.now(),corporateAction=false}=options;
  if(corporateAction)return {available:false,reason:'Corporate action detected; review adjusted history before comparing'};
  const rows=sessions.filter(x=>x.complete && Number.isFinite(x.close)&&x.close>0&&Number.isFinite(x.volume)&&x.volume>=0).sort((a,b)=>a.date.localeCompare(b.date));
  if(new Set(rows.map(x=>x.date)).size!==rows.length)return {available:false,reason:'Duplicate trading dates'};
  if(rows.length<21)return {available:false,reason:'Need 21 valid completed trading sessions'};
  const recent=rows.slice(-21), last=recent.at(-1), base=recent.slice(0,-1);
  if(asOf-Date.parse(last.date)>5*864e5)return {available:false,reason:'Market history is stale'};
  if(recent.some((s,i)=>i>0&&Date.parse(s.date)-Date.parse(recent[i-1].date)>5*864e5))return {available:false,reason:'History has an unexplained session gap'};
  const mean=base.reduce((n,s)=>n+s.volume,0)/20;
  if(mean<=0||base.filter(s=>s.volume===0).length>2)return {available:false,reason:'Insufficient liquidity for a reliable baseline'};
  const volumeRatio=last.volume/mean, move=(last.close/base.at(-1).close-1)*100;
  return {available:true,date:last.date,volumeRatio:round(volumeRatio),priceChange:round(move),volumeTriggered:volumeRatio>=volumeMultiple,priceTriggered:Math.abs(move)>=pricePercent,observationOnly:true};
}
