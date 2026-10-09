import {customerReservations} from './dashboard-data.js?v=20261009-customer-name';
const copy={zh:{add:'填写参与项目',customer:'客户',shares:'预定份额',time:'成功预定时间',save:'保存预定',empty:'暂无成功预定',missing:'客户预定数据尚未配置，请执行客户预定设置脚本。',failed:'未能保存，请核查权限与容量',units:'份额'},en:{add:'Add Customer Reservation',customer:'Customer',shares:'Reserved Shares',time:'Confirmed At',save:'Save Reservation',empty:'No Confirmed Reservations',missing:'Customer reservations are not configured. Run the setup SQL.',failed:'Save failed; check permissions and capacity',units:'shares'},ro:{add:'Adaugă rezervare',customer:'Client',shares:'Acțiuni rezervate',time:'Ora confirmării',save:'Salvează rezervarea',empty:'Nu există rezervări confirmate',missing:'Rezervările clienților nu sunt configurate. Execută scriptul SQL.',failed:'Salvarea a eșuat; verifică permisiunile și capacitatea',units:'acțiuni'}};
const t=(ctx,k)=>copy[ctx.state.lang]?.[k]||copy.zh[k];
export async function loadCustomerReservations(ctx){
 const result=await ctx.fetchPagedRows((a,b)=>ctx.supabase.from('allocation_customer_reservations').select('*').order('confirmed_at',{ascending:true}).order('id',{ascending:true}).range(a,b));
 ctx.state.customerReservations=result.data||[];ctx.state.customerReservationError=result.error||null;
}
export function customerProject(ctx,p){
 if(!p||ctx.state.customerReservationError)return p;
 const summary=customerReservations(p,ctx.state.customers,ctx.state.customerReservations||[]);
 return {...p,remaining_shares:summary.remaining,customerSummary:summary};
}
export function attachCustomerRanking(ctx,p){
 const panel=ctx.$('.projectOverviewSummary');if(!panel||!p)return;
 const summary=customerReservations(p,ctx.state.customers,ctx.state.customerReservations||[]);
 panel.querySelector('.projectDetailSummary')?.remove();panel.querySelector('.projectNameEditor')?.remove();
 panel.querySelector('.projectSummaryMetrics strong')?.replaceChildren(document.createTextNode(ctx.num(summary.participants,0)));
 const section=document.createElement('section');section.className='customerRanking';
 section.innerHTML=ctx.state.customerReservationError?`<p role="alert">${t(ctx,'missing')}</p>`:`<div class="tableWrap"><table class="dataTable"><thead><tr><th>${t(ctx,'customer')}</th><th>${t(ctx,'shares')}</th><th>${t(ctx,'time')}</th></tr></thead><tbody>${summary.ranking.map(r=>`<tr><td data-no-i18n>${ctx.esc(r.name)}</td><td>${ctx.num(r.reserved_shares,4)} ${t(ctx,'units')}</td><td>${ctx.dt(r.confirmed_at)}</td></tr>`).join('')||`<tr><td colspan="3">${t(ctx,'empty')}</td></tr>`}</tbody></table></div>`;
 panel.append(section);
 requestAnimationFrame(()=>window.dispatchEvent(new Event('crm-layout')));
}
export function editCustomerReservation(ctx,p,options={}){
 const projects=(options.projects||[p]).filter(x=>x&&x.owner_user_id===ctx.state.profile.id);
 if(!projects.length||ctx.state.customerReservationError){ctx.toast(t(ctx,'missing'),true);return;}
 const customers=ctx.state.customers.filter(c=>c.owner_user_id===p.owner_user_id&&(!options.customer||c.id===options.customer.id));
 if(!customers.length)return;
 ctx.modal(t(ctx,'add'),`<form id="customerReservationForm" class="formGrid"><div class="field full"><label>${t(ctx,'customer')}</label><select class="select" name="customer_id" required>${customers.map(c=>`<option value="${ctx.esc(c.id)}" data-no-i18n>${ctx.esc(c.name)}</option>`).join('')}</select></div><div class="field"><label>${t(ctx,'shares')}</label><input class="input" name="reserved_shares" type="number" min="0.0001" step="0.0001" required></div><div class="field"><label>${t(ctx,'time')}</label><input class="input" name="confirmed_at" type="datetime-local" value="${ctx.romaniaInputNow()}" required></div><div class="field full"><button class="btn primary">${t(ctx,'save')}</button></div></form>`);
 const editor=ctx.$('#customerReservationForm');
 if(projects.some(x=>!x.customer_ledger_enabled))editor.insertAdjacentHTML('afterbegin','<p class="field full">未核对项目在此补录历史成功预定；原剩余量保留，核对完成后自动汇总。</p>');
 if(options.customer){editor.insertAdjacentHTML('afterbegin',`<div class="field full"><label>${({zh:'参与项目',en:'Project',ro:'Proiect'}[ctx.state.lang]||'Project')}</label><select class="select" name="project_id" required>${projects.map(project=>`<option value="${ctx.esc(project.id)}" data-no-i18n>${ctx.esc(project.name)}</option>`).join('')}</select></div>`);editor.querySelector('[name="customer_id"]').disabled=true;}
 editor.onsubmit=async event=>{event.preventDefault();const form=event.currentTarget,b=Object.fromEntries(new FormData(form));if(options.customer)b.customer_id=String(options.customer.id);const project=projects.find(x=>x.id===(b.project_id||p.id));const qty=Number(b.reserved_shares);if(!project||!customers.some(c=>String(c.id)===b.customer_id)||!Number.isFinite(qty)||qty<=0)return;form.querySelector('button').disabled=true;
 try{const customer=customers.find(c=>String(c.id)===b.customer_id);if(!customer)throw new Error('Customer missing');const response=await ctx.supabase.from('allocation_customer_reservations').insert({project_id:project.id,owner_user_id:ctx.state.profile.id,customer_id:customer.id,reserved_shares:qty,status:'confirmed',confirmed_at:ctx.romaniaLocalToISO(b.confirmed_at)}).select('id').single();if(response.error||!response.data)throw response.error||new Error('No saved row');ctx.closeModal();await ctx.refreshAll();if(options.onSaved)await options.onSaved();ctx.toast(t(ctx,'save'));}catch{ctx.toast(t(ctx,'failed'),true);form.querySelector('button').disabled=false;}};
}
