const base='https://www.infosys.com/investors/reports-filings/quarterly-results/';
export const sources=[
 {id:'call25q4',company:'INFY',title:'Q4 FY25 earnings call',kind:'transcript',published:'2025-04-17',url:base+'2024-2025/q4/documents/transcripts/earningscall.pdf',page:4,period:'FY26 outlook',summary:'Initial FY26 constant-currency revenue growth guidance was 0–3%. Operating margin guidance was 20–22%. Management described an uncertain environment.'},
 {id:'call26q1',company:'INFY',title:'Q1 FY26 earnings call',kind:'transcript',published:'2025-07-23',url:base+'2025-2026/q1/documents/transcripts/earningscall.pdf',page:4,period:'FY26 outlook',summary:'FY26 constant-currency growth guidance increased to 1–3%; operating margin guidance stayed at 20–22%. The outlook continued to assume lower third-party revenue. The lower end reflected uncertainty; the upper end assumed a stable environment.'},
 {id:'call26q2',company:'INFY',title:'Q2 FY26 earnings call',kind:'transcript',published:'2025-10-16',url:base+'2025-2026/q2/documents/transcripts/earningscall.pdf',page:22,period:'FY26 outlook',summary:'FY26 constant-currency revenue growth guidance increased to 2–3%. Management discussed seasonal weakness in the second half and a stable environment at the upper end of guidance.'},
 {id:'call26q3',company:'INFY',title:'Q3 FY26 earnings call',kind:'transcript',published:'2026-01-14',url:base+'2025-2026/q3/documents/transcripts/earningscall.pdf',page:4,period:'FY26 outlook',summary:'FY26 constant-currency growth guidance increased to 3–3.5%; operating margin guidance remained 20–22%. Q3 reported operating margin was 18.4%, versus 21.2% excluding the labour-code charge. Nine-month growth was 2.8%. These definitions and periods must remain distinct.'},
 {id:'call26q4',company:'INFY',title:'Q4 FY26 earnings call',kind:'transcript',published:'2026-04-23',url:base+'2025-2026/q4/documents/transcripts/earningscall.pdf',page:4,period:'FY26 actual',summary:'FY26 constant-currency revenue growth was 3.1%. Acquisitions contributed approximately 70 basis points. Volumes were broadly flat and realization supported growth. Q4 revenue fell 1.3% sequentially in constant currency; Q4 operating margin was 20.9%. FY26 adjusted operating margin was 21%. Management linked Q4 softness to seasonality and slower March decisions.'},
 {id:'annual25',company:'INFY',title:'FY25 annual report',kind:'annual_report',published:null,url:'https://www.infosys.com/investors/reports-filings/annual-report/annual-reports/ar-2024-25.html',page:null,period:'FY25 actual',summary:'FY25 consolidated revenue was ₹162,990 crore, up 6.1% in rupees and 4.2% in constant currency. Operating margin was 21.1%. Infosys provides technology and consulting services. Free cash flow was ₹34,549 crore. Large-deal contract value was US$11.6 billion.'}
];
export const portfolio=[['INFY','Infosys','Technology'],['TCS','Tata Consultancy Services','Technology'],['HCLTECH','HCL Technologies','Technology'],['RELIANCE','Reliance Industries','Diversified'],['HDFCBANK','HDFC Bank','Banking'],['ICICIBANK','ICICI Bank','Banking'],['BAJFINANCE','Bajaj Finance','NBFC'],['LT','Larsen & Toubro','Industrials'],['TITAN','Titan Company','Consumer'],['ITC','ITC','Consumer'],['SUNPHARMA','Sun Pharmaceutical','Healthcare'],['CIPLA','Cipla','Healthcare'],['MARUTI','Maruti Suzuki','Automotive'],['TATAMOTORS','Tata Motors','Automotive'],['ULTRACEMCO','UltraTech Cement','Materials'],['POWERGRID','Power Grid Corporation','Utilities'],['PERSISTENT','Persistent Systems','Technology'],['APLAPOLLO','APL Apollo Tubes','Materials']].map(([symbol,name,sector])=>({symbol,name,sector}));
const common={company:'INFY',metric:'revenue_growth_cc',currency:'N/A',unit:'percent',scope:'consolidated',definition:'constant-currency revenue growth',periodStart:'2025-04-01',periodEnd:'2026-03-31',duration:'year',kind:'numerical',conditions:'Published scenario range includes macroeconomic uncertainty and acquisition effects; not an organic-growth target.',conditionsVerified:true};
export const guidance=[
 {...common,id:'g0',date:'2025-04-17',low:0,high:3,sourceId:'call25q4',state:'Original'},
 {...common,id:'g1',date:'2025-07-23',low:1,high:3,sourceId:'call26q1',state:'Revised'},
 {...common,id:'g2',date:'2025-10-16',low:2,high:3,sourceId:'call26q2',state:'Revised'},
 {...common,id:'g3',date:'2026-01-14',low:3,high:3.5,sourceId:'call26q3',state:'Final guidance'}
];
export const actual={...common,value:3.1,sourceId:'call26q4',date:'2026-04-23'};
export const events=[{
 id:'infy-fy26',company:'INFY',name:'Infosys',category:'results',published:'2026-04-23',tier:0,label:'Review now',
 title:'Growth met revised guidance. The mix deserves a closer look.',
 summary:'FY26 constant-currency growth finished at 3.1%, inside the final 3–3.5% range. Acquisitions contributed about 0.7 percentage points; volumes were broadly flat.',
 why:'The headline target was met, but reported growth alone does not establish stronger underlying demand.',
 affects:'Revenue quality · operating performance · FY27 expectations',
 next:'Did management deliver on its FY26 guidance?',
 sourceIds:['call26q4','call26q3','call26q2','call26q1','call25q4','annual25'],
 evidence:[{label:'Full-year CC growth',value:'3.1%',note:'FY26 · consolidated',sourceId:'call26q4'},{label:'Final guidance',value:'3–3.5%',note:'FY26 · constant currency',sourceId:'call26q3'},{label:'Acquisition contribution',value:'~0.7 pp',note:'Management-reported',sourceId:'call26q4'}],
 novelty:'New full-year outcome; prior guidance retained for comparison.',
 risks:['Acquisition contribution is part of total growth. Subtracting approximate contributions is not a company-certified organic-growth measure.','One quarter cannot settle full-year guidance. Reported and adjusted margins must remain separate.'],
 rankingReason:'Full-year results close an outstanding management target. Manual editorial priority in this historical case; live filings use category screening until financial magnitude is validated.'
}];
export const replay={asOf:'2026-04-23',title:'FY26 results replay',description:'Verified historical case · 23 April 2026. This is not a live market feed.'};
