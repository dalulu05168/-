import test from 'node:test';import assert from 'node:assert/strict';
import {currencyTotals,customerReservations,monthlyTradeTotals} from '../dashboard-data.js';
test('USD and RON are never added together',()=>{assert.deepEqual(currencyTotals([{currency:'USD',v:200000},{currency:'RON',v:1056768}],r=>r.v),[['RON',1056768],['USD',200000]]);});
test('customer reservations rank only confirmed customers belonging to project owner',()=>{
 const p={id:'p',owner_user_id:'a',total_shares:1000},customers=[{id:'c1',owner_user_id:'a',name:'Ana'},{id:'c2',owner_user_id:'a',name:'Mihai'},{id:'c3',owner_user_id:'b',name:'Other'}];
 const base={project_id:'p',owner_user_id:'a',status:'confirmed',confirmed_at:'2026-10-01T10:00:00Z'};
 const records=[{...base,customer_id:'c1',reserved_shares:50},{...base,customer_id:'c1',reserved_shares:60,confirmed_at:'2026-10-02T10:00:00Z'},{...base,customer_id:'c2',reserved_shares:100},{...base,customer_id:'c3',reserved_shares:900},{...base,customer_id:'c2',reserved_shares:800,status:'pending',confirmed_at:null}];
 const s=customerReservations(p,customers,records);assert.equal(s.reserved,210);assert.equal(s.remaining,790);assert.equal(s.participants,2);assert.equal(s.ranking[0].name,'Ana');assert.equal(s.ranking[0].confirmed_at,'2026-10-02T10:00:00Z');
});
test('monthly totals respect Romanian timezone, customer scope and currency',()=>{const rows=monthlyTradeTotals([{customer_id:'c',side:'buy',quantity:2,price:10,currency:'USD',traded_at:'2026-01-31T23:30:00Z'},{customer_id:'c',side:'sell',quantity:2,price:30,currency:'RON',traded_at:'2026-02-01T10:00:00Z'},{customer_id:'other',side:'buy',quantity:999,price:999,traded_at:'2026-02-01T00:00:00Z'}],[{id:'c'}]);assert.deepEqual(rows,[{month:'2026-02',currency:'RON',buy:0,sell:60,count:1},{month:'2026-02',currency:'USD',buy:20,sell:0,count:1}]);});
