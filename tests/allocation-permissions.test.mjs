import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';

const id=n=>`00000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
test('allocation migration enforces ownership, ancestor reads and atomic reservation updates',async()=>{
 const db=new PGlite();
 try{
 await db.exec(`create role anon;create role authenticated;create schema auth;grant usage on schema auth,public to authenticated,anon;
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant execute on function auth.uid() to authenticated,anon;
 create table public.profiles(id uuid primary key,parent_user_id uuid,role text,status text);
 create table public.share_boards(id uuid primary key,created_by uuid,company_name text,symbol text,currency text,total_shares numeric,remaining_shares numeric,board_date date,updated_at timestamptz);
 insert into profiles values('${id(1)}',null,'admin','active'),('${id(2)}','${id(1)}','level1','active'),('${id(3)}','${id(2)}','level2','active'),('${id(4)}','${id(2)}','level2','active'),('${id(5)}',null,'admin','active'),('${id(6)}','${id(1)}','level1','active'),('${id(7)}','${id(6)}','level2','active'),('${id(8)}','${id(2)}','level2','disabled');`);
 const migration=await readFile(new URL('../migrations/20261008_allocation_projects.sql',import.meta.url),'utf8');await db.exec(migration);await db.exec(migration);
 const as=async(n,sql)=>{await db.exec(`reset role;set role authenticated;select set_config('request.jwt.claim.sub','${id(n)}',false);`);return db.query(sql);};
 const create=async(n,name='Own Project')=>(await as(n,`insert into allocation_projects(owner_user_id,project_number,name,total_shares,remaining_shares,board_date) values('${id(n)}',1,'${name}',100,5,'2026-10-08') returning id`)).rows[0].id;
 const p3=await create(3),p4=await create(4),p7=await create(7);
 for(const [n,count] of [[1,3],[2,2],[3,1],[4,1],[5,0],[6,1],[7,1],[8,0]])assert.equal((await as(n,'select id from allocation_projects')).rows.length,count,'visible projects for user '+n);
 await assert.rejects(()=>as(3,`insert into allocation_projects(owner_user_id,project_number,name,total_shares,remaining_shares) values('${id(4)}',2,'Spoof',100,5)`));
 assert.equal((await as(2,`update allocation_projects set name='Changed' where id='${p3}' returning id`)).rows.length,0,'supervisor is read-only');
 assert.equal((await as(4,`update allocation_projects set name='Changed' where id='${p3}' returning id`)).rows.length,0,'peer cannot update');
 await assert.rejects(()=>as(3,`update allocation_projects set owner_user_id='${id(4)}' where id='${p3}'`));
 await assert.rejects(()=>as(3,`insert into allocation_reservations(project_id,owner_user_id,slot_at,reserved_shares) values('${p3}','${id(3)}','2026-10-08T10:00:00Z',999)`));
 const reserve=async(n,p,amount,record='null',at='2026-10-08T10:00:00Z')=>as(n,`select save_allocation_reservation('${p}','${at}',${amount},2,'Test',${record}) as id`);
 const record=(await reserve(3,p3,97)).rows[0].id;
 assert.equal(Number((await as(3,`select remaining_shares from allocation_projects where id='${p3}'`)).rows[0].remaining_shares),3);
 await reserve(3,p3,96,`'${record}'`);assert.equal(Number((await as(3,`select remaining_shares from allocation_projects where id='${p3}'`)).rows[0].remaining_shares),4);
 await reserve(3,p3,98,'null','2026-10-08T11:00:00Z');await reserve(3,p3,90,`'${record}'`);assert.equal(Number((await as(3,`select remaining_shares from allocation_projects where id='${p3}'`)).rows[0].remaining_shares),2,'editing an earlier snapshot keeps the latest remaining value');
 for(const [n,p,amount,recordId,date] of [[4,p3,50],[2,p3,50],[3,p3,101],[3,p3,-1],[3,p3,50,'null','2026-10-09T10:00:00Z'],[3,p4,50],[8,p3,50],[3,p3,50,`'${id(999)}'`]])await assert.rejects(()=>reserve(n,p,amount,recordId,date));
 for(const [n,count] of [[1,2],[2,2],[3,2],[4,0],[5,0],[7,0],[8,0]])assert.equal((await as(n,'select id from allocation_reservations')).rows.length,count,'visible records for user '+n);
 await assert.rejects(()=>as(3,`update allocation_reservations set reserved_shares=0 where id='${record}'`));
 await assert.rejects(()=>as(3,`delete from allocation_projects where id='${p3}'`));
 await db.exec('reset role;set role anon;');await assert.rejects(()=>db.query('select * from allocation_projects'));
 }finally{await db.close();}
});
