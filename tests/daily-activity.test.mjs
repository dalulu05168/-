import test from 'node:test';
import assert from 'node:assert/strict';
import {dailyActivityCounts} from '../dashboard-data.js';
test('daily activity preserves Romanian dates across midnight and DST, zero-fills and ignores invalid dates',()=>{
 const keys=['2026-03-28','2026-03-29','2026-03-30'];
 const actual=dailyActivityCounts([{created_at:'2026-03-28T22:30:00Z'},{created_at:'2026-03-29T21:30:00Z'},{created_at:'invalid'}],[{traded_at:'2026-03-28T20:00:00Z'},{traded_at:'2026-03-29T20:00:00Z'},{traded_at:'2026-01-01T00:00:00Z'}],keys);
 assert.deepEqual(actual,{customers:[0,1,1],trades:[1,1,0]});
});
test('long chart periods read each record timestamp once rather than rescanning records for every day',()=>{
 let reads=0;const customers=Array.from({length:600},()=>({get created_at(){reads++;return '2026-10-01T12:00:00Z'}}));
 const trades=Array.from({length:6000},()=>({get traded_at(){reads++;return '2026-10-01T12:00:00Z'}}));
 const keys=Array.from({length:90},(_,i)=>new Date(Date.UTC(2026,8,1+i,12)).toISOString().slice(0,10));
 const counts=dailyActivityCounts(customers,trades,keys);
 assert.equal(reads,6600);assert.equal(counts.customers.reduce((a,b)=>a+b),600);assert.equal(counts.trades.reduce((a,b)=>a+b),6000);
});
