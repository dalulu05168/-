import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
test('demo stays explicitly simulated and contains the requested independent account hierarchy',async()=>{
 const d=JSON.parse(await readFile(new URL('../demo-data.json',import.meta.url),'utf8'));
 assert.equal(d.environment,'test');assert.equal(d.is_simulated,true);
 const parents=d.profiles.filter(p=>p.role==='level1'),children=d.profiles.filter(p=>p.role==='level2');assert.equal(parents.length,2);assert.equal(children.length,20);assert.equal(d.customers.length,200);
 for(const p of parents)assert.equal(children.filter(c=>c.parent_user_id===p.id).length,10);
 for(const c of children)assert.equal(d.customers.filter(x=>x.owner_user_id===c.id).length,10);
 for(const c of d.customers){assert.ok(d.trades.filter(t=>t.customer_id===c.id).length>=5);assert.equal(c.region,'Romania');}
 for(const key of ['profiles','customers','trades','positions','allocation_projects','allocation_customer_reservations'])for(const row of d[key])assert.equal(row.is_simulated,true,key);
 const source=await readFile(new URL('../demo-client.js',import.meta.url),'utf8');assert.ok(!source.includes('supabase.co'));
});
