import {compare,normalize} from './finance.js';
import {metricLabel} from './metric-labels.js';
const norm=s=>String(s||'').normalize('NFKC').toLowerCase().replace(/,/g,'').replace(/\s+/g,' ').trim();
const metricWords={revenue:/\brevenue|\bsales\b/,ebitda:/\bebitda\b/,operating_profit:/\bebit\b|operating profit/,net_profit:/\bpat\b|net profit|profit after tax|profit attributable|profit for the year/,operating_margin:/operating margin|ebit margin/,free_cash_flow:/free cash flow/,operating_cash_flow:/cash flow.*operat|operating cash/,net_debt:/net debt/,roe:/\broe\b|return on equity/,roce:/\broce\b|return on capital employed/,net_interest_margin:/\bnim\b|net interest margin/,gnpa:/\bgnpa\b|gross non.performing/,nnpa:/\bnnpa\b|net non.performing/,capital_adequacy:/capital adequacy|\bcrar\b|\bcet1\b/,loan_growth:/loan|advances/,working_capital_days:/working capital/};
function canonicalMetric(value){const key=String(value||'').toLowerCase().replace(/[^a-z]/g,'');const aliases={sales:'revenue',totalrevenue:'revenue',netprofit:'net_profit',profitaftertax:'net_profit',pat:'net_profit',ebit:'operating_profit',returnonequity:'roe',returnoncapitalemployed:'roce'};return aliases[key]||Object.keys(metricWords).find(m=>m.replace(/_/g,'')===key)||value}
function fiscalPeriod(label){const m=label.match(/^(?:Q([1-4])\s*)?FY\s*'?(\d{2}|20\d{2})$/i);if(!m)return null;const year=Number(m[2])+(m[2].length===2?2000:0),q=Number(m[1]);if(!q)return {start:`${year-1}-04-01`,end:`${year}-03-31`,duration:'year'};return [{start:`${year-1}-04-01`,end:`${year-1}-06-30`},{start:`${year-1}-07-01`,end:`${year-1}-09-30`},{start:`${year-1}-10-01`,end:`${year-1}-12-31`},{start:`${year}-01-01`,end:`${year}-03-31`}].map(x=>({...x,duration:'quarter'}))[q-1]}
function supportsPeriod(f,text){
 const p=fiscalPeriod(f.periodLabel),flat=norm(text).replace(/fy\s*20(\d{2})/g,'fy$1').replace(/fy\s*'?/g,'fy').replace(/q([1-4])\s+/g,'q$1');
 if(p&&(p.start!==f.periodStart||p.end!==f.periodEnd||p.duration!==f.duration))return false;
 if(p&&flat.includes(norm(f.periodLabel).replace(/fy\s*20(\d{2})/g,'fy$1').replace(/\s+/g,'')))return true;
 const end=new Date(f.periodEnd+'T00:00:00Z');if(Number.isNaN(+end)||end.toISOString().slice(0,10)!==f.periodEnd)return false;
 const month=end.toLocaleDateString('en-US',{month:'long',timeZone:'UTC'}).toLowerCase(),day=end.getUTCDate(),year=end.getUTCFullYear();
 return flat.includes(String(year))&&(flat.includes(month)||flat.includes(f.periodEnd))&&(flat.includes(String(day))||flat.includes(f.periodEnd));
}
function localPeriodContext(f,source){
 if(!source||!['year','quarter'].includes(f.duration))return null;
 const sourceText=String(source.text),at=norm(sourceText).indexOf(norm(f.quote));if(at<0)return null;
 const prefix=norm(sourceText).slice(Math.max(0,at-2200),at);
 const headings=[...prefix.matchAll(/\b(?:for\s+)?(?:the\s+)?(?:financial\s+)?(year|quarter)\s+ended\s+(?:[a-z]+\s+\d{1,2},?\s+\d{4}|\d{1,2}\s+[a-z]+\s+\d{4})/g)];
 const last=headings.at(-1);if(!last||last[1]!==f.duration||!supportsPeriod(f,last[0]))return null;
 const quote=norm(f.quote),value=String(Math.abs(f.value)),valueAt=quote.indexOf(value);
 if(valueAt>=0&&/against|compared to|versus|previous|prior|last year/.test(quote.slice(Math.max(0,valueAt-28),valueAt)))return null;
 return last[0];
}
export function verifiedFacts(input,evidence,company){
 const byId=new Map(evidence.map(e=>[e.id,e]));
 const accepted=[],audit=[];let rejected=0;
 for(const raw of (Array.isArray(input)?input:[]).slice(0,16)){
  const f={...raw,metric:canonicalMetric(raw.metric),periodLabel:String(raw.periodLabel||'').replace(/\bFY\s*'?20(\d{2})\b/gi,'FY$1').replace(/\bFY\s*'?(\d{2})\b/gi,'FY$1')};
  const source=byId.get(f.sourceId);let period=byId.get(f.periodSourceId),basis=byId.get(f.basisSourceId);
  if(!supportsPeriod(f,f.periodQuote)){const heading=localPeriodContext(f,source);if(heading){period=source;f.periodSourceId=source.id;f.periodQuote=heading;f.periodContext='Explicit preceding heading on the same PDF page'}}
  const validQuote=(s,q)=>s&&typeof q==='string'&&q.trim().split(/\s+/).length<=80&&q.length>8&&norm(s.text).includes(norm(q));
  const text=norm(f.quote),basisText=norm(f.basisQuote),all=text+' '+basisText;
  const numeric=Number.isFinite(f.value)&&new RegExp('(^|[^\\d.])'+String(Math.abs(f.value)).replace('.','\\.')+'([^\\d.]|$)').test(text);
  const quotedNegative=new RegExp('(?:-|negative\\s*|\\(\\s*)'+String(Math.abs(f.value)).replace('.','\\.')+'(?:[^\\d.]|$)').test(text);
  const negative=f.value===0||((f.value<0)===quotedNegative);
  const units={unit:/\bdays?\b|\bunits?\b/,thousand:/thousand/,lakh:/lakh/,million:/million/,crore:/crore/,billion:/billion/,percent:/%|percent|per cent/};
  const currency=f.currency==='N/A'?f.unit==='percent'||f.metric==='working_capital_days':f.currency==='INR'?/\binr|₹|\brs\.?|rupee/.test(all):f.currency==='USD'?/\busd|us\$|u\.s\.? dollar/.test(all):false;
  const scopeConflict=(f.scope==='consolidated'&&basisText.includes('standalone')&&!basisText.includes('consolidated'))||(f.scope==='standalone'&&basisText.includes('consolidated')&&!basisText.includes('standalone'));
  if(['consolidated','standalone'].includes(f.scope)&&!basisText.includes(f.scope)&&!scopeConflict){f.scope='unknown';f.definition=String(f.definition).replace(/\b(?:consolidated|standalone)\b\s*/gi,'').trim();f.scopeNote='Reporting scope was not explicitly supported by the basis passage'}
  const scope=['consolidated','standalone','unknown'].includes(f.scope)&&!scopeConflict;
  const def=typeof f.definition==='string'&&f.definition.length<=150&&f.definition.length>2&&(!/adjust|excl|exception/i.test(f.definition)||/adjust|excl|exception/.test(all))&&(!/\breported\b/i.test(f.definition)||!/excl|adjusted|before exceptional/.test(text));
  const sameDocument=source?.url&&source.url===period?.url&&source.url===basis?.url;
  const ownPeriod=!/\bfy\s*'?\d{2,4}\b|\b(?:year|quarter) ended\b/.test(text)||supportsPeriod(f,f.quote);
  const checks={sameDocument,numberQuote:validQuote(source,f.quote),periodQuote:validQuote(period,f.periodQuote),basisQuote:validQuote(basis,f.basisQuote),numeric,sign:negative,metric:metricWords[f.metric]?.test(text),unit:units[f.unit]?.test(all),currency,scope,definition:def,localPeriod:ownPeriod,reportingPeriod:supportsPeriod(f,f.periodQuote),duration:['year','quarter','half_year','nine_months','instant'].includes(f.duration)};
  if(Object.values(checks).some(x=>!x)){rejected++;audit.push({metric:f.metric,period:f.periodLabel,failed:Object.keys(checks).filter(k=>!checks[k])});continue}
  try{normalize({...f,company})}catch{rejected++;continue}
  accepted.push({...f,company,label:metricLabel(f),verification:'Number, metric, unit, period and basis linked to quoted evidence'});
 }
 const unique=[...new Map(accepted.map(f=>[[f.metric,f.periodStart,f.periodEnd,f.scope,f.definition,f.currency,f.unit,f.value].join('|'),f])).values()];
 const conflicts=[];
 for(const f of unique){const peers=unique.filter(x=>x.metric===f.metric&&x.periodStart===f.periodStart&&x.periodEnd===f.periodEnd&&x.scope===f.scope&&norm(x.definition)===norm(f.definition)&&x.currency===f.currency&&normalize(x).normalizedValue!==normalize(f).normalizedValue);if(peers.length){f.conflict=true;conflicts.push(`${f.label} has differing reported values for ${f.periodLabel}; inspect both sources.`)}}
 return {facts:unique,rejected,audit,conflicts:[...new Set(conflicts)]};
}
export function financialComparisons(facts){
 const results=[];
 for(const current of facts){if(current.scope==='unknown'||current.conflict)continue;
  for(const previous of facts){if(previous.scope==='unknown'||previous.conflict||previous.periodEnd>=current.periodEnd)continue;
   const year=compare(current,previous,'yoy');if(!year.comparable)continue;
   results.push({metric:current.metric,label:current.label,current,previous,...year,kind:'yoy'});
  }
 }
 return results.slice(0,8);
}
export const factSources=f=>[f.sourceId,f.periodSourceId,f.basisSourceId].filter(Boolean);
