export function classifyEvent(input=''){
 const text=String(input);
 if(/\b(?:auditors?|audit firm)\b[\s\S]{0,100}\bresign|\bresign[\s\S]{0,100}\b(?:auditors?|audit firm)\b/i.test(text))return 'auditor_resignation';
 if(/\bfraud(?:ulent)?\b|\bembez[z]?lement\b|\bfalsif(?:ied|ication)\b/i.test(text))return 'fraud';
 if(/\binsolvency\b|\bbankrupt(?:cy)?\b|\bliquidation\b|\bCIRP\b/i.test(text))return 'insolvency';
 if(/\bdefault(?:ed|s)?\b|\bnon[- ]payment\b|\bfailure to (?:repay|pay)\b/i.test(text))return 'default';
 if(/\bresign|\bdirector|\bappoint|\bchief|\bcfo\b/i.test(text))return 'management_change';
 if(/\bguidance\b|\boutlook\b|\bearnings forecast\b/i.test(text))return 'guidance';
 if(/\bresult|\bfinancial/i.test(text))return 'results';
 if(/\bacqui|\bmerger|\bamalgamation\b/i.test(text))return 'M&A';
 return 'routine';
}
export const category=classifyEvent;
