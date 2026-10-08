// Browser-only test adapter. It has no production credentials or remote writes.
const STORE='bv-explicit-demo-v2';let tables;
export async function createDemoClient(){
 const seed=await (await fetch('/demo-data.json?v=20261009-no-footer')).json();if(seed.environment!=='test'||seed.is_simulated!==true)throw new Error('Invalid test fixture');
 try{tables=JSON.parse(localStorage.getItem(STORE))||seed;}catch{tables=seed;}
 for(const [key,rows] of Object.entries(seed)){if(!Array.isArray(rows))continue;const existing=tables[key]||[];const ids=new Set(existing.map(row=>row.id));tables[key]=[...existing,...rows.filter(row=>!ids.has(row.id))];}
 let userId=new URLSearchParams(location.search).get('account')||tables.profiles.find(p=>p.role==='level2').id;
 if(!tables.profiles.some(p=>p.id===userId))userId=tables.profiles.find(p=>p.role==='level2').id;
 const actor=()=>tables.profiles.find(p=>p.id===userId);
 const scope=()=>{const ids=new Set([userId]);let changed=true;while(changed){changed=false;for(const p of tables.profiles)if(ids.has(p.parent_user_id)&&!ids.has(p.id)){ids.add(p.id);changed=true;}}return ids;};
 const visibleCustomers=()=>new Set(tables.customers.filter(c=>scope().has(c.owner_user_id)).map(c=>c.id));
 function visible(table,row){if(table==='profiles')return scope().has(row.id);if(table==='customers')return visibleCustomers().has(row.id);if(['trades','positions','customer_followups'].includes(table))return visibleCustomers().has(row.customer_id);if(table.startsWith('allocation_'))return scope().has(row.owner_user_id);return true;}
 const save=()=>localStorage.setItem(STORE,JSON.stringify(tables));
 function from(table){const filters=[],sort=[];let range=null,operation='select',payload,one=false;
 const query={select(){return query},eq(k,v){filters.push(r=>r[k]===v);return query},order(k,o={}){sort.push([k,o.ascending!==false]);return query},range(a,b){range=[a,b];return query},limit(n){range=[0,n-1];return query},maybeSingle(){one=true;return query},single(){one=true;return query},insert(v){operation='insert';payload=v;return query},update(v){operation='update';payload=v;return query},then(resolve,reject){return Promise.resolve().then(()=>{
  if(!tables[table])return {data:null,error:{message:'Unknown demo table'}};
  let rows=tables[table].filter(r=>visible(table,r)&&filters.every(f=>f(r)));
  if(operation==='insert'){
   const v={...payload,id:crypto.randomUUID(),created_at:new Date().toISOString(),is_simulated:true};
   if(v.customer_id&&!visibleCustomers().has(v.customer_id))throw new Error('Unauthorized customer');
   if(table==='allocation_customer_reservations'){
    const p=tables.allocation_projects.find(x=>x.id===v.project_id),c=tables.customers.find(x=>x.id===v.customer_id);
    if(!p||!c||p.owner_user_id!==userId||c.owner_user_id!==userId||v.owner_user_id!==userId)throw new Error('Unauthorized reservation');
    const reserved=tables[table].filter(x=>x.project_id===p.id&&x.status==='confirmed').reduce((n,x)=>n+Number(x.reserved_shares),0);
    if(!(Number(v.reserved_shares)>0)||reserved+Number(v.reserved_shares)>p.total_shares)throw new Error('Capacity exceeded');
   }
   tables[table].push(v);rows=[v];save();
  }else if(operation==='update'){
   if(table==='profiles'&&(rows.some(r=>r.id!==userId)||Object.keys(payload).some(k=>k!=='display_name')))throw new Error('Name-only self update');
   if(table==='allocation_projects'&&rows.some(r=>r.owner_user_id!==userId))throw new Error('Read-only project');
   rows.forEach(r=>Object.assign(r,payload));save();
  }
  for(let i=sort.length-1;i>=0;i--){const [key,asc]=sort[i];rows.sort((a,b)=>String(a[key]??'').localeCompare(String(b[key]??''))*(asc?1:-1));}
  if(range)rows=rows.slice(range[0],range[1]+1);
  rows=rows.map(r=>({...r,...(r.customer_id?{customers:tables.customers.find(c=>c.id===r.customer_id)}:{})}));
  return {data:one?(rows[0]||null):rows,error:one&&!rows.length?{message:'No matching row'}:null};
 }).catch(error=>({data:null,error:{message:error.message}})).then(resolve,reject)}};return query;}
 const session=()=>({user:{id:userId}});
 return {from,previewAccounts:()=>tables.profiles.map(p=>({id:p.id,name:p.display_name})),selectPreviewAccount:id=>{if(tables.profiles.some(p=>p.id===id))location.href='/?demo=1&account='+encodeURIComponent(id);},auth:{getSession:async()=>({data:{session:session()}}),onAuthStateChange(){},signOut:async()=>{location.href='/?demo=1';}}};
}
export function demoQuotes(symbols){return Object.fromEntries(symbols.map((symbol,i)=>{const price=symbol.includes('RON')?45:120;return [symbol,{symbol,name:symbol,companyName:symbol,currency:symbol.includes('RON')?'RON':'USD',exchange:'',country:'RO',source:'',price,changePct:0.5,realtime:false,timestamp:new Date().toISOString(),points:Array.from({length:30},(_,j)=>({t:Date.now()-(29-j)*60000,close:price+Math.sin(j/4)*2})),open:price,high:price+2,low:price-2,previousClose:price-1,volume:5000}] }));}
