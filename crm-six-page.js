/* CRM six-page interaction layer. Uses only permission-scoped rows returned by the existing adapter. */
const escapeValue = v => String(v??"").replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const cleanId=v=>escapeValue(v);
const statusText=s=>({"active":"启用","disabled":"停用","prospect":"潜在客户","following":"跟进中","holding":"持仓中","closed":"已结束","archived":"已归档"}[s]||s||"未知");
const number=n=>Number(n||0).toLocaleString("zh-CN");
const EMPTY='<div class="crmEmpty">当前范围暂无记录</div>';
const detailCell=(label,value)=>'<div class="crmDetailCell"><small>'+label+'</small><strong>'+escapeValue(value??"—")+'</strong></div>';
const accountChildren=(state,id)=>state.staff.filter(p=>p.parent_user_id===id&&p.status!=="deleted");
const descendantIds=(state,id)=>{const ids=new Set([id]), queue=[id];while(queue.length){for(const p of accountChildren(state,queue.shift())){if(!ids.has(p.id)){ids.add(p.id);queue.push(p.id);}}}return ids;};
const visibleClients=(state,id)=>{const ids=descendantIds(state,id);return state.customers.filter(c=>ids.has(c.owner_user_id));};
const ownerLabel=(state,id)=>state.staff.find(p=>p.id===id)?.display_name||"未知账户";
const clientTrades=(state,c)=>state.trades.filter(t=>t.customer_id===c.id);
const clientPositions=(state,c)=>state.positions.filter(p=>p.customer_id===c.id&&Number(p.quantity)>0);
const head=(title,sub,tools)=>'<header class="crmSectionHead"><div><h2>'+title+'</h2><p>'+sub+'</p></div><div class="crmHeadTools">'+(tools||"")+'</div></header>';
const metric=(label,val)=>'<div class="crmMiniMetric"><small>'+label+'</small><strong>'+escapeValue(val)+'</strong></div>';
const card=(title,sub,metrics,attrs,extra)=>'<article class="crmDataCard" '+(attrs||"")+'><div class="crmDataCardHead"><div><h3>'+escapeValue(title)+'</h3><p>'+escapeValue(sub)+'</p></div><span class="crmCardArrow" aria-hidden="true">↗</span></div><div class="crmMiniGrid">'+metrics.join("")+'</div>'+(extra||"")+'</article>';
const accountCard=(ctx,p,kind)=>{const cs=visibleClients(ctx.state,p.id);const ids=new Set(cs.map(c=>c.id));const trades=ctx.state.trades.filter(t=>ids.has(t.customer_id));const holds=new Set(ctx.state.positions.filter(x=>ids.has(x.customer_id)&&Number(x.quantity)>0).map(x=>x.customer_id));return card(p.display_name||p.username,p.username+" · "+(p.role==="level1"?"一级人员":"二级人员")+" · "+statusText(p.status),[metric("客户",cs.length),metric("持仓客户",holds.size),metric("交易流水",trades.length)],'role="button" tabindex="0" data-'+kind+'="'+cleanId(p.id)+'"');};
function activateCards(root,selector,callback){root.querySelectorAll(selector).forEach(e=>{const action=()=>callback(e);e.addEventListener("click",action);e.addEventListener("keydown",ev=>{if(ev.key==="Enter"||ev.key===" "){ev.preventDefault();action();}});});}
function customerCard(ctx,c){const active=clientPositions(ctx.state,c);const trades=clientTrades(ctx.state,c);return card(c.name,c.customer_code+" · "+statusText(c.status),[metric("地区",c.region||"—"),metric("当前持仓",active.length),metric("交易记录",trades.length)],'role="button" tabindex="0" data-client-id="'+cleanId(c.id)+'"','<p class="crmCardFooter">负责人：'+escapeValue(ownerLabel(ctx.state,c.owner_user_id))+' · '+escapeValue(ctx.dt(c.created_at))+'</p>');}
function withinScope(ctx,id){return descendantIds(ctx.state,ctx.state.profile.id).has(id);}
export async function renderCrmCustomers(ctx){
 const {state}=ctx,main=ctx.$("#main"),root=state.profile.id;
 let path=[],search="",status="";
 main.innerHTML='<section class="crmSection">'+head("客户列表","先查看直属下属账号，再逐级进入其客户明细。仅展示当前账号有权读取的数据。",'<input id="customerSearch" class="input" type="search" placeholder="搜索客户姓名 / 编号 / 电话"><select id="customerStatus" class="select"><option value="">全部状态</option><option value="prospect">潜在客户</option><option value="following">跟进中</option><option value="holding">持仓中</option><option value="closed">已结束</option><option value="archived">已归档</option></select><button id="newCustomer" class="btn primary">新增客户</button>')+'<div class="crmBreadcrumb" id="customerTrail"></div><div id="customerTable" class="crmCardGrid"></div></section>';
 const area=ctx.$("#customerTable"),trail=ctx.$("#customerTrail");
 function draw(){
  const current=path.length?path[path.length-1]:root;
  const children=accountChildren(state,current).filter(x=>withinScope(ctx,x.id));
  trail.innerHTML='<button type="button" data-depth="-1">我的管理范围</button>'+path.map((id,i)=>'<span aria-hidden="true">›</span><button type="button" data-depth="'+i+'">'+escapeValue(ownerLabel(state,id))+'</button>').join("");
  if(search){
   const allowed=new Set([...descendantIds(state,current)]);
   const rows=state.customers.filter(c=>allowed.has(c.owner_user_id)&&[c.name,c.customer_code,c.phone].some(v=>String(v||"").toLowerCase().includes(search))&&(!status||c.status===status));
   area.innerHTML=rows.map(c=>customerCard(ctx,c)).join("")||EMPTY;
  }else if(children.length){
   area.innerHTML=children.map(p=>accountCard(ctx,p,"child-id")).join("")||EMPTY;
  }else{
   const rows=state.customers.filter(c=>c.owner_user_id===current&&(!status||c.status===status));
   area.innerHTML=rows.map(c=>customerCard(ctx,c)).join("")||EMPTY;
  }
  activateCards(area,"[data-child-id]",e=>{const id=e.dataset.childId;if(!withinScope(ctx,id))return;path.push(id);draw();});
  activateCards(area,"[data-client-id]",e=>{const id=e.dataset.clientId;if(state.customers.some(c=>c.id===id&&withinScope(ctx,c.owner_user_id)))ctx.openCustomer(id);});
  trail.querySelectorAll("[data-depth]").forEach(b=>b.onclick=()=>{const n=Number(b.dataset.depth);path=path.slice(0,n+1);draw();});
 }
 ctx.$("#customerSearch").oninput=e=>{search=e.target.value.trim().toLowerCase();draw();};
 ctx.$("#customerStatus").onchange=e=>{status=e.target.value;draw();};
 ctx.$("#newCustomer").onclick=ctx.openCustomerForm;
 draw();
}
export async function renderCrmPersonnel(ctx){
 const {state}=ctx,main=ctx.$("#main"),root=state.profile.id;
 if(!["admin","level1"].includes(state.profile.role))return;
 let path=[],expanded=null;
 const tools=state.profile.role==="admin"?'<button id="newStaff" class="btn primary">新建人员账户</button>':"";
 main.innerHTML='<section class="crmSection">'+head("人员账户明细","卡片直接显示客户、持仓、交易及账号状态；点击卡片查看详细资料。",tools)+'<div class="crmBreadcrumb" id="staffTrail"></div><div id="staffCards" class="crmCardGrid"></div></section>';
 const area=ctx.$("#staffCards"),trail=ctx.$("#staffTrail");
 function draw(){
  const current=path.length?path[path.length-1]:root;
  trail.innerHTML='<button type="button" data-depth="-1">直属下属</button>'+path.map((id,i)=>'<span>›</span><button type="button" data-depth="'+i+'">'+escapeValue(ownerLabel(state,id))+'</button>').join("");
  const children=accountChildren(state,current).filter(p=>withinScope(ctx,p.id));
  if(children.length){
   area.innerHTML=children.map(p=>accountCard(ctx,p,"staff-id")).join("");
   activateCards(area,"[data-staff-id]",e=>{const id=e.dataset.staffId;path.push(id);expanded=null;draw();});
  }else{
   const p=state.staff.find(s=>s.id===current);
   if(!p||!withinScope(ctx,p.id)){area.innerHTML=EMPTY;return;}
   const owner=state.staff.find(x=>x.id===p.parent_user_id);
   const own=state.customers.filter(c=>c.owner_user_id===p.id);
   const detail='<div class="crmDetails">'+detailCell("登录账号",p.username)+detailCell("人员姓名",p.display_name)+detailCell("账号角色",p.role==="level1"?"一级人员":"二级人员")+detailCell("上级",owner?.display_name||"管理员")+detailCell("状态",statusText(p.status))+detailCell("创建时间",ctx.dt(p.created_at))+detailCell("电话",p.phone||"—")+detailCell("直属客户",own.length)+'</div>';
   const actions=state.profile.role==="admin"?'<div class="crmCardActions"><button data-action="edit">编辑账号</button><button data-action="reset">重置密码</button>'+(p.role==="admin"?"":'<button data-action="toggle">'+(p.status==="active"?"禁用":"启用")+'</button><button data-action="delete" class="danger">删除账号</button>')+'</div>':"";
   area.innerHTML=card(p.display_name,p.username+" · "+statusText(p.status),[metric("客户",own.length),metric("交易",state.trades.filter(t=>own.some(c=>c.id===t.customer_id)).length)],'data-staff-detail="'+cleanId(p.id)+'"',detail+actions);
   area.querySelectorAll("[data-action]").forEach(b=>b.onclick=()=>{
    const a=b.dataset.action;if(a==="edit")ctx.openStaffEdit(p.id);
    if(a==="reset")ctx.resetStaffPassword(p.id);
    if(a==="toggle")ctx.setStaffStatus(p.id,p.status==="active"?"disabled":"active");
    if(a==="delete")ctx.deleteStaffAccount(p.id);
   });
  }
  trail.querySelectorAll("[data-depth]").forEach(b=>b.onclick=()=>{path=path.slice(0,Number(b.dataset.depth)+1);draw();});
 }
 if(ctx.$("#newStaff"))ctx.$("#newStaff").onclick=ctx.openStaffForm;
 draw();
}
const chooseAccount=(ctx,id)=>id==="all"?ctx.state.customers:visibleClients(ctx.state,id);
const accountOptions=ctx=>{
 const accounts=ctx.state.staff.filter(s=>s.id!==ctx.state.profile.id&&s.status!=="deleted"&&["level1","level2"].includes(s.role)&&withinScope(ctx,s.id));
 return '<option value="all">全部可见账户</option>'+accounts.map(p=>'<option value="'+cleanId(p.id)+'">'+escapeValue(p.display_name||p.username)+' · '+(p.role==="level1"?"一级":"二级")+'</option>').join("");
};
function days14(ctx){const base=ctx.romaniaDateKey();const y=Number(base.slice(0,4)),m=Number(base.slice(5,7)),d=Number(base.slice(8,10));return Array.from({length:14},(_,i)=>{const day=new Date(Date.UTC(y,m-1,d-13+i));return day.toISOString().slice(0,10);});}
export async function renderCrmTrades(ctx){
 const main=ctx.$("#main");
 main.innerHTML='<section class="crmSection crmTradingSection">'+head("交易流水","按照账户名下客户交易记录绘制趋势，可展开交易明细；不同币种金额不混合。",'<select class="select" id="crmTradeAccount" aria-label="筛选人员账户">'+accountOptions(ctx)+'</select><input type="search" class="input" id="tradeSearch" placeholder="搜索客户 / 股票">')+'<div class="crmTradeSummary" id="crmTradeSummary"></div><article class="crmSubPanel"><div class="crmSubHead"><h3>近14日交易笔数趋势</h3><small>按罗马尼亚日期统计</small></div><div class="crmTradeChart"><canvas id="crmTradeChart"></canvas></div></article><div id="tradesTable" class="crmCardGrid"></div></section>';
 const redraw=()=>{
  const selected=ctx.$("#crmTradeAccount").value,ids=new Set(chooseAccount(ctx,selected).map(c=>c.id));
  const q=ctx.$("#tradeSearch").value.trim().toLowerCase();
  const all=ctx.state.trades.filter(t=>ids.has(t.customer_id));
  const rows=all.filter(t=>!q||[t.symbol,t.stock_name,t.customers?.name,t.customers?.customer_code].some(v=>String(v||"").toLowerCase().includes(q)));
  ctx.$("#crmTradeSummary").innerHTML=metric("范围内客户",ids.size)+metric("交易总笔数",all.length)+metric("买入笔数",all.filter(t=>t.side==="buy").length)+metric("卖出笔数",all.filter(t=>t.side==="sell").length);
  const keys=days14(ctx),counts=keys.map(k=>all.filter(t=>t.traded_at&&ctx.romaniaDateKey(t.traded_at)===k).length);
  if(ctx.state.charts.tradeAccounts){ctx.state.charts.tradeAccounts.destroy();delete ctx.state.charts.tradeAccounts;}
  if(window.Chart&&ctx.$("#crmTradeChart")){
   const canvas=ctx.$("#crmTradeChart"),g=canvas.getContext("2d"),gradient=g.createLinearGradient(0,0,0,240);
   gradient.addColorStop(0,"rgba(48,132,114,.28)");gradient.addColorStop(1,"rgba(48,132,114,0)");
   ctx.state.charts.tradeAccounts=new window.Chart(canvas,{type:"line",data:{labels:keys.map(s=>s.slice(5)),datasets:[{label:"交易笔数",data:counts,borderColor:"#317d70",backgroundColor:gradient,fill:true,tension:.4,pointRadius:2,pointHoverRadius:5,borderWidth:2}]},options:{...ctx.chartOpts(),scales:{x:{grid:{display:false}},y:{beginAtZero:true,ticks:{precision:0},grid:{display:false}}}}});
  }
  ctx.$("#tradesTable").innerHTML=rows.map(t=>card(t.customers?.name||ctx.state.customers.find(c=>c.id===t.customer_id)?.name||"未知客户",t.symbol+" · "+(t.side==="buy"?"买入":"卖出"),[metric("数量",ctx.num(t.quantity,4)),metric("成交单价",ctx.money(t.price,t.currency)),metric("日期",ctx.dt(t.traded_at))], 'data-transaction-id="'+cleanId(t.id)+'"','<details class="crmDisclosure"><summary>查看完整流水</summary><div class="crmDetails">'+detailCell("股票名称",t.stock_name||t.symbol)+detailCell("交易市场",t.market)+detailCell("交易方向",t.side==="buy"?"买入":"卖出")+detailCell("手续费",ctx.money(t.fees,t.currency))+detailCell("成交金额",ctx.money(Number(t.quantity||0)*Number(t.price||0),t.currency))+detailCell("交易时间",ctx.dt(t.traded_at))+'</div></details>')).join("")||EMPTY;
  ctx.$("#tradesTable").querySelectorAll("details").forEach(d=>d.addEventListener("click",e=>e.stopPropagation()));
 };
 ctx.$("#crmTradeAccount").onchange=redraw;ctx.$("#tradeSearch").oninput=redraw;redraw();
}
export async function renderCrmPositions(ctx){
 const main=ctx.$("#main");
 main.innerHTML='<section class="crmSection">'+head("持仓中心","先选择账户范围，再查看各客户持仓卡片；展开获取完整持仓和最新可用报价。",'<select id="crmPositionAccount" class="select" aria-label="筛选持仓账户">'+accountOptions(ctx)+'</select><button id="refreshPositions" class="btn">刷新报价</button>')+'<div class="crmTradeSummary" id="crmPositionSummary"></div><div id="crmPositionCards" class="crmCardGrid"></div></section>';
 const symbolRows=ctx.state.positions.filter(p=>Number(p.quantity)>0);
 let quotes=await ctx.fetchQuotes([...new Set(symbolRows.map(p=>p.symbol))],{realtimeOnly:false});
 const draw=()=>{
  const cs=chooseAccount(ctx,ctx.$("#crmPositionAccount").value),ids=new Set(cs.map(c=>c.id));
  const positions=symbolRows.filter(p=>ids.has(p.customer_id));
  const holding=new Set(positions.map(p=>p.customer_id));
  ctx.$("#crmPositionSummary").innerHTML=metric("客户数",cs.length)+metric("持仓客户",holding.size)+metric("持仓项目",positions.length);
  ctx.$("#crmPositionCards").innerHTML=cs.filter(c=>holding.has(c.id)).map(c=>{
   const ps=positions.filter(p=>p.customer_id===c.id);
   const extra='<details class="crmDisclosure"><summary>查看全部持仓与报价</summary><div class="crmPositionItems">'+ps.map(p=>{const x=quotes[p.symbol],valid=x&&!x.error&&Number.isFinite(Number(x.price)),price=valid?Number(x.price):null,pnl=valid?(price-Number(p.avg_cost))*Number(p.quantity):null;
   return '<div class="crmPositionItem"><strong>'+escapeValue(p.symbol)+'</strong><div class="crmDetails">'+detailCell("数量",ctx.num(p.quantity,4))+detailCell("平均成本",ctx.money(p.avg_cost,p.currency))+detailCell("行情价格",price==null?"—":ctx.money(price,p.currency))+detailCell("更新时间",valid&&x.lastTradeAt?ctx.dt(x.lastTradeAt):"—")+detailCell("未实现盈亏",pnl==null?"—":ctx.money(pnl,p.currency))+detailCell("已实现盈亏",ctx.money(p.realized_pnl,p.currency))+'</div></div>';}).join("")+'</div></details>';
   return card(c.name,c.customer_code+" · "+ownerLabel(ctx.state,c.owner_user_id),[metric("持仓标的",ps.length),metric("交易记录",clientTrades(ctx.state,c).length)],'',extra);
  }).join("")||EMPTY;
 };
 ctx.$("#crmPositionAccount").onchange=draw;
 ctx.$("#refreshPositions").onclick=async()=>{quotes=await ctx.fetchQuotes([...new Set(symbolRows.map(p=>p.symbol))],{realtimeOnly:false});draw();};
 ctx.state.positionRefreshTimer=setInterval(()=>{if(ctx.state.activeView==="positions")ctx.$("#refreshPositions")?.click();},60000);
 draw();
}
export async function renderCrmReports(ctx){
 const main=ctx.$("#main"),active=ctx.state.staff.filter(s=>s.status==="active"&&s.role!=="admin"&&withinScope(ctx,s.id));
 main.innerHTML='<section class="crmSection crmReportsSection">'+head("统计报表","已移除客户归属分布和买卖结构，剩余统计按当前账号权限均匀排列。","")+'<div class="crmReportsGrid"><article class="crmSubPanel"><div class="crmSubHead"><h3>人员客户统计</h3><small>仅统计当前权限可见资料</small></div><div class="crmCardGrid" id="crmReportPeople"></div></article><article class="crmSubPanel"><div class="crmSubHead"><h3>月度交易数据</h3><div class="crmReportControls"><input id="reportMonth" class="input" type="month"><select id="reportCurrency" class="select"><option>USD</option><option>RON</option><option>EUR</option><option>GBP</option><option>CHF</option><option>PLN</option><option>JPY</option></select></div></div><div class="crmTradeChart"><canvas id="monthlyTradeChart"></canvas></div><div id="monthlyTradeRows" class="crmReportBreakdown"></div></article></div></section>';
 ctx.$("#crmReportPeople").innerHTML=active.map(p=>{const cs=visibleClients(ctx.state,p.id);const ids=new Set(cs.map(c=>c.id));const holding=new Set(ctx.state.positions.filter(t=>ids.has(t.customer_id)&&Number(t.quantity)>0).map(t=>t.customer_id));return card(p.display_name,p.username+" · "+(p.role==="level1"?"一级人员":"二级人员"),[metric("客户",cs.length),metric("持仓客户",holding.size),metric("交易记录",ctx.state.trades.filter(t=>ids.has(t.customer_id)).length)],'');}).join("")||EMPTY;
 const monthly=ctx.monthlyTradeTotals(ctx.state.trades,ctx.state.customers);
 const period=ctx.romaniaDateKey().slice(0,7);ctx.$("#reportMonth").value=period;
 const draw=()=>{const currency=ctx.$("#reportCurrency").value,selected=ctx.$("#reportMonth").value,series=monthly.filter(r=>r.currency===currency);
  const month=series.filter(r=>r.month===selected);
  ctx.$("#monthlyTradeRows").innerHTML=month.length?month.map(r=>'<div class="crmTradeSummary">'+metric("买入成交额",ctx.money(r.buy,r.currency))+metric("卖出成交额",ctx.money(r.sell,r.currency))+metric("交易笔数",r.count)+'</div>').join(""):EMPTY;
  ctx.state.charts.monthly?.destroy();
  if(window.Chart)ctx.state.charts.monthly=new window.Chart(ctx.$("#monthlyTradeChart"),{type:"bar",data:{labels:series.map(r=>r.month),datasets:[{label:"买入 · "+currency,data:series.map(r=>r.buy),backgroundColor:"#8eafd0",borderRadius:4},{label:"卖出 · "+currency,data:series.map(r=>r.sell),backgroundColor:"#d85a70",borderRadius:4}]},options:ctx.chartOpts()});
 };
 ctx.$("#reportMonth").onchange=draw;ctx.$("#reportCurrency").onchange=draw;draw();
}

// Pure helpers exported for isolated hierarchy/permission regression checks.
export const __crmHelpers={accountChildren,descendantIds,visibleClients};
