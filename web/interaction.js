export const defaultQuestion='What are the business fundamentals, revenue and cash flow?';
export function researchQuestion(value,{followup=false}={}){const q=String(value||'').trim()||(followup?'':defaultQuestion),minimum=followup?2:4;if(q.length<minimum||q.length>700)throw new Error('Use a complete '+(followup?'follow-up':'question')+' between '+minimum+' and 700 characters.');return q;}

export function validCompany(c){return Boolean(c?.resolved&&c.symbol);}
export function preferenceBoost(event,prefs){if(event.tier===0)return 100;return (prefs.performance&&['results','guidance'].includes(event.category)?3:0)+(prefs.management&&event.category==='management_change'?3:0)+(prefs.governance&&['litigation','default','auditor_resignation','fraud','pledging','insider_trading','credit_downgrade'].includes(event.category)?3:0);}
