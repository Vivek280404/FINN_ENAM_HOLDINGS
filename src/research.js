import {sources,guidance,actual} from './seed.js';
import {assessGuidance,round} from './finance.js';
export function planQuestion(question){
 const q=question.toLowerCase(),periods=[...new Set([...question.matchAll(/\bFY\s*'?((?:20)?\d{2})\b/gi)].map(m=>'FY'+m[1].slice(-2)))];return {periods,guidance:/guidance|promise|deliver|expectation|target/.test(q),margin:/margin|profitab/.test(q),risk:/risk|concern|quality|organic/.test(q),multiPeriod:/quarter|consisten|history|guidance|promise|deliver/.test(q)};
}
export function retrieve(question,documents){
 const plan=planQuestion(question), words=question.toLowerCase().match(/[a-z]{4,}/g)||[];
 const scored=documents.map(d=>({...d,score:words.reduce((n,w)=>n+(d.summary?.toLowerCase().includes(w)?1:0),0)}));
 const chosen=scored.filter(d=>d.score>0).sort((a,b)=>b.score-a.score);
 if(plan.multiPeriod){const seen=new Set(chosen.map(d=>d.id));for(const d of documents.filter(d=>d.kind==='transcript').sort((a,b)=>a.published.localeCompare(b.published)))if(!seen.has(d.id))chosen.push(d);}
 return chosen.slice(0,10);
}
export function seedResearch(question){
 if(/latest|current|today|ipo|should i|invest in|valuation|price|multiple|compare|20(?:24|27|28)|\bFY\s*'?(?:24|27|28)\b|quarter.{0,12}guidance/i.test(question))return null;
 if(/profitab/i.test(question))return null;
 if(!/guidance|promise|deliver|reported and adjusted margins|growth and what are the risks|acquisition|business|revenue|cash/i.test(question))return null;
 const p=planQuestion(question), cited=(text,ids,type='Interpretation')=>({text,sourceIds:ids,type});
 if(p.guidance)return {title:'Delivered within the final range',status:'Evidence checked',claims:[
 cited('FY26 constant-currency growth of 3.1% was within January’s 3–3.5% guidance. Both refer to the full year ended 31 March 2026.',['call26q3','call26q4'],'Calculated'),
 cited(`Actual growth finished ${round(actual.value-guidance.at(-1).low,1)} percentage points above the final lower bound. It exceeded the original 3% upper bound by 0.1 percentage points.`,['call25q4','call26q3','call26q4'],'Calculated'),
 cited('The lower bound rose from 0% to 1%, then 2%, then 3%. The timeline preserves each revision; it does not judge delivery solely against the initial outlook.',['call25q4','call26q1','call26q2','call26q3'],'Reported'),
 cited('Acquisitions contributed about 70 basis points and volumes were broadly flat. Meeting guidance therefore does not by itself establish a broad recovery in demand.',['call26q4'])
 ],sources,ledger:guidance.map(g=>({...g,assessment:assessGuidance(g,actual)})),next:'How much of the growth was supported by acquisitions?',coverage:'Five consecutive earnings calls plus the FY25 annual report. Historical evidence through 23 April 2026.'};
 if(p.margin)return {title:'Keep reported and adjusted margins separate',claims:[cited('Q3 FY26 operating margin was 18.4% reported and 21.2% excluding the labour-code impact. These are different definitions.',['call26q3'],'Reported'),cited('Q4 operating margin was 20.9%. Management described a 0.3 percentage-point sequential decline against the adjusted Q3 comparison.',['call26q4'],'Reported'),cited('A single quarterly margin cannot prove delivery against a full-year margin target. A fully matched annual reported series is required for that conclusion.',['call26q3','call26q4'])],sources:sources.filter(s=>['call26q3','call26q4'].includes(s.id)),next:'Did management deliver on its FY26 growth guidance?',coverage:'Q3 and Q4 transcripts. No inferred EBITDA comparison.'};
 if(p.risk || /growth|acquisition|volume/.test(question.toLowerCase()))return {title:'Look beyond the headline growth rate',claims:[cited('Full-year constant-currency revenue growth was 3.1%; acquisitions contributed approximately 70 basis points.',['call26q4'],'Reported'),cited('Management described broadly flat volumes and higher realization. Q4 constant-currency revenue fell 1.3% sequentially, with seasonality and slower March decision-making cited.',['call26q4'],'Reported'),cited('Investigate organic demand, deal conversion, and realization durability. The available evidence does not establish that an improvement is broad-based.',['call26q4'])],sources:sources.filter(s=>s.id==='call26q4'),next:'Show management guidance versus the final result.',coverage:'FY26 year-end transcript; interpretation is limited to these disclosures.'};
 if(/business|snapshot|company|revenue|cash/.test(question.toLowerCase()))return {title:'Infosys · business and financial context',claims:[cited('Infosys provides technology and consulting services. FY25 consolidated revenue was ₹162,990 crore, with a 21.1% operating margin.',['annual25'],'Reported'),cited('FY25 revenue growth was 6.1% in rupees and 4.2% in constant currency. Currency bases must not be mixed in a guidance comparison.',['annual25'],'Reported'),cited('FY25 free cash flow was ₹34,549 crore; large-deal contract value was US$11.6 billion. Contract value is not recognized revenue.',['annual25'],'Reported')],sources:sources.filter(s=>s.id==='annual25'),next:'Did management deliver on FY26 growth guidance?',coverage:'FY25 annual report. This is historical, not a current financial snapshot.'};
 return null;
}
export function verifyClaims(claims, evidence){
 const ids=new Set(evidence.map(e=>e.id));return claims.filter(c=>typeof c.text==='string'&&c.text.length<1500&&Array.isArray(c.sourceIds)&&c.sourceIds.length>0&&c.sourceIds.every(id=>ids.has(id)));
}
export function retrievePages(question, documents){
 const stop=new Set(['what','does','about','company','available','financial','their','that','with','have']);
 const query=question.toLowerCase(),expanded=[];
 if(/performance|overview|fundamentals|financial strength/.test(query))expanded.push('revenue','profit','cash flow','working capital','return on','margin');
 if(/risk|headwind/.test(query))expanded.push('risk','headwind','pressure','inflation');
 if(/guidance|promise|deliver|target/.test(query))expanded.push('guidance','outlook','revised','expect');
 const terms=[...new Set([...(query.match(/[a-z]{4,}/g)||[]).filter(t=>!stop.has(t)),...expanded])];
 const budget=planQuestion(question).multiPeriod?18:16;
 const buckets=documents.map(d=>d.pages.map(p=>({id:d.id+'-'+p.page,title:d.title,url:d.url,kind:d.kind,issuer:d.issuer,company:d.company,published:d.published,fetched:d.fetched,page:p.page,text:p.text,score:terms.reduce((n,w)=>n+(p.text.toLowerCase().includes(w)?1:0),0)})).filter(p=>p.score>0).sort((a,b)=>b.score-a.score));
 const selected=[],seen=new Set();const add=p=>{if(p&&!seen.has(p.id)&&selected.length<budget){selected.push(p);seen.add(p.id)}};
 for(let i=0;i<2;i++)for(const pages of buckets)add(pages[i]);
 for(const pages of buckets){
  add(pages.find(p=>/revenue|profit after tax|net profit|EBITDA/i.test(p.text)));
  add(pages.find(p=>/cash flow|working capital|net debt/i.test(p.text)));
  add(pages.find(p=>/risk|headwind|pressure|uncertain|revised|guidance/i.test(p.text)));
 }
 for(const d of documents){const p=d.pages.slice(0,3).find(p=>/consolidated|standalone|year ended|quarter ended/i.test(p.text));if(p)add({id:d.id+'-'+p.page,title:d.title,url:d.url,kind:d.kind,issuer:d.issuer,company:d.company,page:p.page,text:p.text,score:0})}
 for(let i=2;i<5;i++)for(const pages of buckets)add(pages[i]);
 return selected.map(p=>({...p,text:p.text.slice(0,6000)}));
}
