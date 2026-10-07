import assert from 'node:assert/strict';
import test from 'node:test';
import handler from '../api/security-info.js';
async function request(chart,quotes){
  const original=globalThis.fetch;
  try{
    globalThis.fetch=async url=>({ok:true,json:async()=>url.includes('/chart/')?{chart:{result:chart?[chart]:[]}}:{quotes}});
    let result;
    await handler({query:{symbol:'PL'}},{status(){return this},setHeader(){},json(value){result=value;return value}});
    return result;
  }finally{globalThis.fetch=original}
}
test('unrelated search results cannot populate the requested security',async()=>{
  const value=await request(null,[{symbol:'AAPL',longname:'Apple Inc',exchange:'ATW',sector:'Wrong'}]);
  assert.equal(value.companyName,'PL');assert.equal(value.industry,null);assert.notEqual(value.exchange,'ATW');assert.equal(value.price,null);
});
test('a chart for a different symbol cannot provide the requested price',async()=>{
  const value=await request({meta:{symbol:'AAPL',longName:'Apple Inc',regularMarketPrice:100},timestamp:[]},[]);
  assert.equal(value.price,null);assert.equal(value.companyName,'PL');assert.deepEqual(value.points,[]);
});
test('an exact symbol match preserves company, price and industry',async()=>{
  const value=await request({meta:{symbol:'PL',longName:'Planet Labs PBC',regularMarketPrice:18.57,currency:'USD',exchangeName:'NYSE'},timestamp:[]},[{symbol:'PL',industry:'Aerospace & Defense'}]);
  assert.equal(value.companyName,'Planet Labs PBC');assert.equal(value.price,18.57);assert.equal(value.industry,'Aerospace & Defense');assert.equal(value.exchange,'NYSE');
});
