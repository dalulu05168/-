export function currencyTotals(rows, value) {
 const totals=new Map();
 for(const row of rows){const currency=row.currency||'USD',n=Number(value(row));if(Number.isFinite(n))totals.set(currency,(totals.get(currency)||0)+n);}
 return [...totals].sort(([a],[b])=>a.localeCompare(b));
}
export function customerReservations(project, customers, records) {
 const eligible=new Map(customers.filter(c=>c.owner_user_id===project.owner_user_id).map(c=>[c.id,c]));
 const rows=records.filter(r=>r.project_id===project.id&&r.owner_user_id===project.owner_user_id&&eligible.has(r.customer_id)&&r.status==='confirmed'&&r.confirmed_at);
 const groups=new Map();
 for(const row of rows){const qty=Number(row.reserved_shares);if(!Number.isFinite(qty)||qty<=0)continue;const item=groups.get(row.customer_id)||{customer_id:row.customer_id,name:eligible.get(row.customer_id).name,reserved_shares:0,confirmed_at:row.confirmed_at};item.reserved_shares+=qty;if(row.confirmed_at>item.confirmed_at)item.confirmed_at=row.confirmed_at;groups.set(row.customer_id,item);}
 const ranking=[...groups.values()].sort((a,b)=>b.reserved_shares-a.reserved_shares||String(a.customer_id).localeCompare(String(b.customer_id))).map((r,i)=>({...r,rank:i+1}));
 const reserved=ranking.reduce((n,r)=>n+r.reserved_shares,0);
 return {reserved,remaining:Number(project.total_shares)-reserved,participants:ranking.length,ranking,rows};
}
export function monthlyTradeTotals(trades,customers,timeZone='Europe/Bucharest') {
 const visible=new Set(customers.map(c=>c.id)),groups=new Map();
 const fmt=new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit'});
 for(const t of trades){if(!visible.has(t.customer_id))continue;const date=new Date(t.traded_at);if(!Number.isFinite(+date)||!['buy','sell'].includes(t.side))continue;const parts=Object.fromEntries(fmt.formatToParts(date).map(p=>[p.type,p.value]));const month=parts.year+'-'+parts.month,currency=t.currency||'USD',key=month+'|'+currency;
 const amount=Number(t.quantity)*Number(t.price);if(!Number.isFinite(amount))continue;const row=groups.get(key)||{month,currency,buy:0,sell:0,count:0};row[t.side]+=amount;row.count++;groups.set(key,row);}
 return [...groups.values()].sort((a,b)=>(a.month+a.currency).localeCompare(b.month+b.currency));
}
