import test from 'node:test';
import assert from 'node:assert/strict';
import {gaugeFraction,validProject,allocationAccountIds} from '../allocation-projects.js';
test('remaining allocation gauge expands the low range while preserving labelled percentages',()=>{
 assert.equal(gaugeFraction(0),0);assert.equal(gaugeFraction(20),.6);assert.equal(gaugeFraction(100),1);assert.equal(gaugeFraction(-1),0);assert.equal(gaugeFraction(101),1);
 let previous=-1;for(let i=0;i<=100;i++){assert.ok(gaugeFraction(i)>=previous);previous=gaugeFraction(i)}assert.ok(gaugeFraction(5)>.05);
});
test('project quantities reject invalid totals and remaining shares',()=>{const p={name:'Project',currency:'USD',board_date:'2026-10-08',total_shares:100,remaining_shares:5};assert.equal(validProject(p),true);for(const changes of [{name:' '},{total_shares:0},{remaining_shares:101},{remaining_shares:-1},{currency:'usd'},{total_shares:Infinity},{remaining_shares:NaN}])assert.equal(validProject({...p,...changes}),false);});
test('account filter includes descendants and excludes peers or unrelated administrators',()=>{const staff=[{id:'a',role:'admin',status:'active'},{id:'b',parent_user_id:'a',status:'active'},{id:'c',parent_user_id:'b',status:'active'},{id:'d',parent_user_id:'b',status:'active'},{id:'x',status:'active'}];assert.deepEqual([...allocationAccountIds({id:'c'},staff)],['c']);assert.deepEqual([...allocationAccountIds({id:'b'},staff)].sort(),['b','c','d']);assert.deepEqual([...allocationAccountIds({id:'a'},staff)].sort(),['a','b','c','d']);});
