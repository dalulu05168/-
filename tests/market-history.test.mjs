import test from 'node:test';
import assert from 'node:assert/strict';
import handler,{HISTORY_RANGES} from '../api/market.js';
test('every chart period requests its own provider history and preserves dated observations',async()=>{
 const original=globalThis.fetch,urls=[];
 globalThis.fetch=async url=>{urls.push(new URL(url));return {ok:true,json:async()=>({chart:{result:[{meta:{regularMarketPrice:12},timestamp:[1700000000,1700100000],indicators:{quote:[{close:[10,12]}]}}]}})}};
 try{for(const [range,[period,interval]] of Object.entries(HISTORY_RANGES)){
 let result,status;const res={status(n){status=n;return this},setHeader(){},json(x){result=x;return x}};
 await handler({query:{symbols:'BRD.RO',range}},res);
 assert.equal(status,200);assert.equal(urls.at(-1).searchParams.get('range'),period);assert.equal(urls.at(-1).searchParams.get('interval'),interval);assert.equal(result.rows[0].points[1].t,1700100000000);
 }}finally{globalThis.fetch=original}
});
test('unsupported ranges are rejected before contacting provider',async()=>{let status;await handler({query:{symbols:'AAPL',range:'bad'}},{status(n){status=n;return this},json(){}});assert.equal(status,400)});
