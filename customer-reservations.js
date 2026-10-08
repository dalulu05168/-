import {customerReservations} from './dashboard-data.js?v=20261008-unified4';
const copy={zh:{title:'客户预定 Top 排行',add:'填写客户预定',customer:'客户',shares:'预定份额',time:'成功预定时间',save:'保存预定',empty:'暂无成功预定',missing:'客户预定数据尚未配置，请执行客户预定设置脚本。',failed:'未能保存，请核查权限与容量',units:'份额'},en:{title:'Customer Reservation Ranking',add:'Add Customer Reservation',customer:'Customer',shares:'Reserved Shares',time:'Confirmed At',save:'Save Reservation',empty:'No Confirmed Reservations',missing:'Customer reservations are not configured. Run the setup SQL.',failed:'Save failed; check permissions and capacity',units:'shares'},ro:{title:'Clasamentul rezervărilor clienților',add:'Adaugă rezervare',customer:'Client',shares:'Acțiuni rezervate',time:'Ora confirmării',save:'Salvează rezervarea',empty:'Nu există rezervări confirmate',missing:'Rezervările clienților nu sunt configurate. Execută scriptul SQL.',failed:'Salvarea a eșuat; verifică permisiunile și capacitatea',units:'acțiuni'}};
const t=(ctx,k)=>copy[ctx.state.lang]?.[k]||copy.zh[k];
export async function loadCustomerReservations(ctx){
 const result=await ctx.fetchPagedRows((a,b)=>ctx.supabase.from('allocation_customer_reservations').select('*').order('confirmed_at',{ascending:true}).order('id',{ascending:true}).range(a,b));
 ctx.state.customerReservations=result.data||[];ctx.state.customerReservationError=result.error||null;
}
export function customerProject(ctx,p){
 if(!p||ctx.state.customerReservationError||!p.customer_ledger_enabled)return p;
 const summary=customerReservations(p,ctx.state.customers,ctx.state.customerReservations||[]);
 return {...p,remaining_shares:summary.remaining,customerSummary:summary};
}
export function attachCustomerRanking(ctx,p){
 const panel=ctx.$('.projectOverviewSummary');if(!panel||!p)return;
 const canEdit=p.owner_user_id===ctx.state.profile.id&&p.customer_ledger_enabled;
 const summary=customerReservations(p,ctx.state.customers,ctx.state.customerReservations||[]);
 panel.querySelector('.projectDetailSummary')?.remove();panel.querySelector('.projectNameEditor')?.remove();
 if(p.customer_ledger_enabled)panel.querySelector('.projectSummaryMetrics strong')?.replaceChildren(document.createTextNode(ctx.num(summary.participants,0)));
 const section=document.createElement('section');section.className='customerRanking';
 section.innerHTML=`<div class="customerRankingHead"><h3>${t(ctx,'title')}</h3>${canEdit&&!ctx.state.customerReservationError?`<button class="btn" id="addCustomerReservation">${t(ctx,'add')}</button>`:''}</div>${ctx.state.customerReservationError?`<p role="alert">${t(ctx,'missing')}</p>`:`<div class="tableWrap"><table class="dataTable" data-managed-pagination="true"><thead><tr><th>Top</th><th>${t(ctx,'customer')}</th><th>${t(ctx,'shares')}</th><th>${t(ctx,'time')}</th></tr></thead><tbody>${summary.ranking.map(r=>`<tr><td>${r.rank}</td><td data-no-i18n>${ctx.esc(r.name)}</td><td>${ctx.num(r.reserved_shares,4)} ${t(ctx,'units')}</td><td>${ctx.dt(r.confirmed_at)}</td></tr>`).join('')||`<tr><td colspan="4">${t(ctx,'empty')}</td></tr>`}</tbody></table></div>`}`;
 if(!ctx.state.customerReservationError&&!p.customer_ledger_enabled)section.insertAdjacentHTML('afterbegin','<p role="status">旧累计快照尚未与客户明细核对，仍保留原剩余量。</p>');
 panel.append(section);
 if(!ctx.state.customerReservationError&&summary.ranking.length){
  const rows=[...section.querySelectorAll('tbody tr')],size=2;let page=0;
  const nav=document.createElement('nav');nav.className='viewportPager';nav.setAttribute('aria-label','Customer ranking pagination');
  const labels={zh:['上一页','下一页','页'],en:['Previous','Next','Page'],ro:['Înapoi','Înainte','Pagina']}[ctx.state.lang]||['Previous','Next','Page'];
  nav.innerHTML='<button class="btn" type="button"></button><span aria-live="polite"></span><button class="btn" type="button"></button>';section.append(nav);
  const buttons=nav.querySelectorAll('button');buttons[0].textContent=labels[0];buttons[1].textContent=labels[1];
  const draw=()=>{rows.forEach((row,i)=>row.hidden=i<page*size||i>=(page+1)*size);buttons[0].disabled=page===0;buttons[1].disabled=(page+1)*size>=rows.length;nav.querySelector('span').textContent=labels[2]+' '+(page+1)+' / '+Math.ceil(rows.length/size);};
  buttons[0].onclick=()=>{page--;draw()};buttons[1].onclick=()=>{page++;draw()};draw();
 }
 ctx.$('#addCustomerReservation')?.addEventListener('click',()=>editCustomerReservation(ctx,p));
}
export function editCustomerReservation(ctx,p){
 const customers=ctx.state.customers.filter(c=>c.owner_user_id===p.owner_user_id);
 ctx.modal(t(ctx,'add'),`<form id="customerReservationForm" class="formGrid"><div class="field full"><label>${t(ctx,'customer')}</label><select class="select" name="customer_id" required>${customers.map(c=>`<option value="${ctx.esc(c.id)}" data-no-i18n>${ctx.esc(c.name)}</option>`).join('')}</select></div><div class="field"><label>${t(ctx,'shares')}</label><input class="input" name="reserved_shares" type="number" min="0.0001" step="0.0001" required></div><div class="field"><label>${t(ctx,'time')}</label><input class="input" name="confirmed_at" type="datetime-local" value="${ctx.romaniaInputNow()}" required></div><div class="field full"><button class="btn primary">${t(ctx,'save')}</button></div></form>`);
 ctx.$('#customerReservationForm').onsubmit=async event=>{event.preventDefault();const form=event.currentTarget,b=Object.fromEntries(new FormData(form));const qty=Number(b.reserved_shares);if(!customers.some(c=>String(c.id)===b.customer_id)||!Number.isFinite(qty)||qty<=0)return;form.querySelector('button').disabled=true;
 try{const customer=customers.find(c=>String(c.id)===b.customer_id);if(!customer)throw new Error('Customer missing');const response=await ctx.supabase.from('allocation_customer_reservations').insert({project_id:p.id,owner_user_id:ctx.state.profile.id,customer_id:customer.id,reserved_shares:qty,status:'confirmed',confirmed_at:ctx.romaniaLocalToISO(b.confirmed_at)}).select('id').single();if(response.error||!response.data)throw response.error||new Error('No saved row');ctx.closeModal();await ctx.refreshAll();ctx.toast(t(ctx,'save'));}catch{ctx.toast(t(ctx,'failed'),true);form.querySelector('button').disabled=false;}};
}
