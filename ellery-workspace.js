/* ELLERY WESTCOTT: presentation helpers only — no mutations and no invented business data. */
export function ewMetric(label,value,detail="",tone=""){
  return `<div class="ew-metric ${tone}"><span class="ew-metric-label">${label}</span><strong>${value}</strong><small>${detail}</small></div>`;
}
export function ewHeading(title,description,section="CAPITAL MARKETS",action=""){
  return `<header class="ew-page-heading"><div><span class="ew-eyebrow">${section}</span><h1>${title}</h1><p>${description}</p></div>${action}</header>`;
}
export function ewCustomerInsight(customer,{esc,dt,num,customerStatus,owner,positionCount,tradeCount}){
  if(!customer)return `<div class="ew-no-selection"><span class="ew-no-selection-icon">◇</span><h3>暂无客户</h3><p>请调整筛选条件，或通过上方按钮新增客户。</p></div>`;
  const initial=esc(String(customer.name||"?").slice(0,2).toUpperCase());
  return `<div class="ew-person-header"><div class="ew-person-avatar">${initial}</div><div><span class="ew-eyebrow">CLIENT PROFILE</span><h3>${esc(customer.name)}</h3><p>${esc(customer.customer_code||"—")}</p></div></div>
  <div class="ew-profile-fields">
  <div><span>客户状态</span><b>${esc(customerStatus(customer.status))}</b></div>
  <div><span>负责人员</span><b>${esc(owner||"—")}</b></div>
  <div><span>所属地区</span><b>${esc(customer.region||"—")}</b></div>
  <div><span>建立日期</span><b>${dt(customer.created_at)}</b></div>
  </div>
  <div class="ew-profile-bottom"><div>${ewMetric("持仓标的",num(positionCount),"POSITIONS")}</div><div>${ewMetric("交易记录",num(tradeCount),"TRADES")}</div></div>
  <button class="ew-open-customer btn primary" data-id="${esc(customer.id)}" type="button">查看客户完整档案 ↗</button>`;
}
export function ewStaffCard(person,{esc,roleName,parentName,canEdit,dt}){
  const initial=esc(String(person.display_name||person.username||"?").slice(0,2).toUpperCase());
  return `<article class="ew-personnel-card">
   <div class="ew-person-header"><div class="ew-person-avatar">${initial}</div><div class="ew-person-meta"><span class="ew-status-tag ${person.status==="active"?"ew-positive":"ew-neutral"}">${person.status==="active"?"● 正常":"● 已停用"}</span><h3>${esc(person.display_name||person.username)}</h3><p>@${esc(person.username)}</p></div></div>
   <div class="ew-personnel-facts"><div><span>账号角色</span><strong>${esc(roleName(person.role))}</strong></div><div><span>上级管理</span><strong>${esc(parentName)}</strong></div><div><span>建立日期</span><strong>${dt(person.created_at)}</strong></div></div>
   ${canEdit?`<div class="ew-personnel-actions"><button type="button" class="btn editStaff" data-id="${esc(person.id)}">编辑账号</button><button type="button" class="btn resetPwd" data-id="${esc(person.id)}">重置密码</button></div>`:""}
  </article>`;
}
export function ewTradeDetail(item,{esc,dt,money,num}){
 if(!item)return `<div class="ew-no-selection"><h3>暂无交易</h3><p>请修改筛选条件。</p></div>`;
 return `<div class="ew-detail-symbol">${esc(item.symbol||"—")}</div>
 <p class="ew-detail-name">${esc(item.stock_name||item.market||"—")}</p>
 <span class="ew-status-tag ${item.side==="buy"?"ew-positive":"ew-negative"}">${item.side==="buy"?"买入 BUY":"卖出 SELL"}</span>
 <div class="ew-profile-fields">
 <div><span>客户</span><b>${esc(item.customers?.name||"—")}</b></div>
 <div><span>交易市场</span><b>${esc(item.market||"—")}</b></div>
 <div><span>成交时间</span><b>${dt(item.traded_at)}</b></div>
 <div><span>成交数量</span><b>${num(item.quantity,4)}</b></div>
 <div><span>成交价格</span><b>${money(item.price,item.currency)}</b></div>
 <div><span>手续费用</span><b>${money(item.fees,item.currency)}</b></div>
 </div>`;
}
export function ewHoldingDetail(item,quote,{esc,dt,money,num}){
 if(!item)return `<div class="ew-no-selection"><h3>暂无持仓</h3><p>目前没有正数量的持仓记录。</p></div>`;
 const usable=quote&&!quote.error&&Number.isFinite(Number(quote.price));
 const px=usable?Number(quote.price):null;
 const pnl=px===null?null:Number(item.quantity)*(px-Number(item.avg_cost));
 return `<div class="ew-detail-symbol">${esc(item.symbol||"—")}</div>
 <p class="ew-detail-name">${esc(item.customers?.name||"—")} · ${esc(item.market||"—")}</p>
 ${ewMetric("持仓数量",num(item.quantity,4),"UNITS")}
 <div class="ew-profile-fields">
 <div><span>持仓均价</span><b>${money(item.avg_cost,item.currency)}</b></div>
 <div><span>最新报价</span><b>${px===null?"—":money(px,item.currency)}</b></div>
 <div><span>未实现盈亏</span><b class="${pnl===null?"":pnl>=0?"up":"down"}">${pnl===null?"—":money(pnl,item.currency)}</b></div>
 <div><span>数据时间</span><b>${usable&&quote.lastTradeAt?dt(quote.lastTradeAt):"未获取"}</b></div>
 </div>`;
}
