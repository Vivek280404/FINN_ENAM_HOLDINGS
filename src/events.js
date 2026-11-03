export function classifyEvent(input=''){
 const text=String(input);
 if(/\b(?:auditors?|audit firm)\b[\s\S]{0,100}\bresign|\bresign[\s\S]{0,100}\b(?:auditors?|audit firm)\b/i.test(text))return 'auditor_resignation';
 if(/\bfraud(?:ulent)?\b|\bembez[z]?lement\b|\bfalsif(?:ied|ication)\b/i.test(text))return 'fraud';
 if(/\binsolvency\b|\bbankrupt(?:cy)?\b|\bliquidation\b|\bCIRP\b/i.test(text))return 'insolvency';
 if(/\bdefault(?:ed|s)?\b|\bnon[- ]payment\b|\bfailure to (?:repay|pay)\b/i.test(text))return 'default';
 if(/\b(?:ceo|cfo|chief|managing director)\b[\s\S]{0,100}\b(?:resign|appoint|retir)|\b(?:resign|appoint|retir)[\s\S]{0,100}\b(?:ceo|cfo|chief|managing director)\b/i.test(text))return 'management_change';
 if(/\bguidance\b|\boutlook\b|\bearnings forecast\b/i.test(text))return 'guidance';
 if(/\bresult|\bfinancial/i.test(text))return 'results';
 if(/\bacqui|\bmerger|\bamalgamation\b/i.test(text))return 'M&A';
 if(/\b(?:credit|debt|bank facility|instrument) rating\b|\b(?:CRISIL|ICRA|CARE Ratings)\b/i.test(text))return /\bdowngrad|\bnegative outlook\b/i.test(text)?'credit_downgrade':'credit_rating';
 if(/\blitigation\b|\blawsuit\b|\bregulatory (?:order|penalty)\b|\bpenalt(?:y|ies)\b|\bfine imposed\b/i.test(text))return 'litigation';
 if(/\b(?:fund rais|rights issue|qualified institutional|QIP|preferential allot|buyback|buy.back|debt issu)/i.test(text))return 'fund_raise';
 if(/\b(?:joint venture|demerger|divestment)\b/i.test(text))return 'M&A';
 if(/\b(?:capex|capital expenditure|capacity expansion|new plant)\b/i.test(text))return 'capex';
 if(/\b(?:pledging|pledge|encumbrance)\b/i.test(text))return 'pledging';
 if(/\bdividend\b/i.test(text))return 'dividend';
 if(/\b(?:bonus issue|stock split|share split|sub.division of (?:equity )?shares)\b/i.test(text))return 'bonus_split';
 if(/\b(?:insider trading|promoter (?:purchase|sale)|disposal of shares)\b/i.test(text))return 'insider_trading';
 if(/\bresign|\bdirector|\bappoint|\bchief|\bcfo\b/i.test(text))return 'management_change';
 if(/\b(?:earnings|conference) call\b|\btranscript\b/i.test(text))return 'earnings_call';
 if(/\border (?:win|received)|\bnew product\b|\bpartnership\b/i.test(text))return 'press_release';
 return 'routine';
}
export const category=classifyEvent;
