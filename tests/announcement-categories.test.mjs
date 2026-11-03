import test from 'node:test';import assert from 'node:assert/strict';
import {classifyEvent} from '../src/events.js';import {materiality} from '../src/finance.js';
test('material disclosure types are surfaced rather than collapsed as routine',()=>{
 for(const [text,category] of [['Credit rating downgraded by CRISIL','credit_downgrade'],['ICRA credit rating reaffirmed','credit_rating'],['Regulatory penalty imposed','litigation'],['Qualified institutional placement approved','fund_raise'],['Board approves capital expenditure for new plant','capex'],['Promoter pledge of shares','pledging'],['Interim dividend declared','dividend'],['Stock split approved','bonus_split'],['Joint venture approved','M&A'],['Earnings call transcript','earnings_call']])assert.equal(classifyEvent(text),category,text);
 assert.equal(classifyEvent('Quarterly financial results approved by Board of Directors'),'results');
 assert.equal(classifyEvent('Compliance certificate submitted'),'routine');
 assert.equal(materiality({category:'credit_downgrade'}).tier,0);
});
