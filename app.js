
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://igcmvzoxminzvcgwimwi.supabase.co";
const SUPABASE_KEY = "sb_publishable_QHLv3UtA1eKEgTAKfQ2ZNg_hWbfRaNx";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const ROMANIA_TZ = "Europe/Bucharest";
const MARKET_PRESETS = {
  RO:{label:"罗马尼亚",symbols:["TLV.RO","SNP.RO","SNG.RO","SNN.RO","H2O.RO","BRD.RO","BVB.RO"]},
  US:{label:"美国",symbols:["AAPL","MSFT","NVDA","AMZN","TSLA"]},
  FR:{label:"法国",symbols:["MC.PA","OR.PA","AIR.PA","BNP.PA","TTE.PA"]},
  DE:{label:"德国",symbols:["SAP.DE","SIE.DE","ALV.DE","BMW.DE","DTE.DE"]},
  GB:{label:"英国",symbols:["SHEL.L","AZN.L","HSBA.L","ULVR.L","BP.L"]},
  IT:{label:"意大利",symbols:["ENI.MI","ISP.MI","ENEL.MI","STLAM.MI"]},
  ES:{label:"西班牙",symbols:["SAN.MC","IBE.MC","ITX.MC","BBVA.MC"]},
  NL:{label:"荷兰",symbols:["ASML.AS","INGA.AS","PHIA.AS","ADYEN.AS"]},
  CH:{label:"瑞士",symbols:["NESN.SW","ROG.SW","NOVN.SW"]},
  PL:{label:"波兰",symbols:["PKO.WA","CDR.WA","PKN.WA"]},
  JP:{label:"日本",symbols:["7203.T","6758.T","9984.T","8306.T"]}
};

const state = {
  session:null, profile:null, staff:[], customers:[], trades:[], positions:[], followups:[],
  charts:{}, activeView:"dashboard", activeCustomer:null, quotes:{}
};

let romaniaClockTimer=null;

const $ = (s,root=document)=>root.querySelector(s);
const $$ = (s,root=document)=>[...root.querySelectorAll(s)];
const esc = (v="") => String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const money = (n,c="USD") => new Intl.NumberFormat("zh-CN",{style:"currency",currency:c||"USD",maximumFractionDigits:2}).format(Number(n||0));
const num = (n,d=2)=>Number(n||0).toLocaleString("zh-CN",{maximumFractionDigits:d});
const dt = (v)=>v?new Date(v).toLocaleString("zh-CN",{timeZone:ROMANIA_TZ,hour12:false}):"--";
const romaniaDateKey = (v=new Date()) => new Intl.DateTimeFormat("en-CA",{timeZone:ROMANIA_TZ,year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(v));
const isRomaniaToday = v => romaniaDateKey(v)===romaniaDateKey();
const romaniaClockText = () => new Intl.DateTimeFormat("zh-CN",{timeZone:ROMANIA_TZ,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false,timeZoneName:"short"}).format(new Date());
function romaniaDayKeys(count){
  const [y,m,d]=romaniaDateKey().split("-").map(Number);
  const base=new Date(Date.UTC(y,m-1,d,12));
  return Array.from({length:count},(_,i)=>{
    const x=new Date(base);x.setUTCDate(x.getUTCDate()-(count-1-i));
    return x.toISOString().slice(0,10);
  });
}
function romaniaInputNow(){
  const p=new Intl.DateTimeFormat("en-CA",{timeZone:ROMANIA_TZ,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(new Date());
  const o=Object.fromEntries(p.map(x=>[x.type,x.value]));
  return `${o.year}-${o.month}-${o.day}T${o.hour}:${o.minute}`;
}
function zoneOffsetMs(ts,timeZone){
  const d=new Date(ts);
  const p=new Intl.DateTimeFormat("en-US",{timeZone,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"}).formatToParts(d);
  const o=Object.fromEntries(p.map(x=>[x.type,x.value]));
  return Date.UTC(+o.year,+o.month-1,+o.day,+o.hour,+o.minute,+o.second)-Math.floor(ts/1000)*1000;
}
function romaniaLocalToISO(value){
  if(!value)return null;
  const base=Date.parse(value+":00Z");
  let utc=base-zoneOffsetMs(base,ROMANIA_TZ);
  utc=base-zoneOffsetMs(utc,ROMANIA_TZ);
  return new Date(utc).toISOString();
}
function startRomaniaClock(){
  clearInterval(romaniaClockTimer);
  const tick=()=>{const el=$("#romaniaClock");if(el)el.textContent=romaniaClockText()};
  tick();romaniaClockTimer=setInterval(tick,1000);
}

const crosshairPlugin={
  id:"bvCrosshair",
  afterDraw(chart){
    const active=chart.tooltip?.getActiveElements?.()||[];
    if(!active.length)return;
    const el=active[0].element;
    if(!el)return;
    const {ctx,chartArea}=chart;
    if(!chartArea)return;
    ctx.save();
    ctx.strokeStyle="rgba(213,170,81,.65)";
    ctx.lineWidth=1;
    ctx.setLineDash([4,4]);
    ctx.beginPath();ctx.moveTo(el.x,chartArea.top);ctx.lineTo(el.x,chartArea.bottom);ctx.stroke();
    ctx.beginPath();ctx.moveTo(chartArea.left,el.y);ctx.lineTo(chartArea.right,el.y);ctx.stroke();
    ctx.restore();
  }
};
if(window.Chart){
  Chart.register(crosshairPlugin);
  Chart.defaults.font.weight="normal";
}

function toast(msg,error=false){
  let t=$("#toast"); if(!t){t=document.createElement("div");t.id="toast";document.body.appendChild(t)}
  t.className="toast"+(error?" error":""); t.textContent=msg; clearTimeout(t._x); t._x=setTimeout(()=>t.remove(),3200)
}

function roleName(r){return r==="admin"?"管理员":r==="level1"?"一级人员":"二级人员"}
function customerStatus(s){return ({prospect:"潜在客户",following:"跟进中",holding:"持仓中",closed:"已结束",archived:"已归档"})[s]||s}
function canPersonnel(){return state.profile?.role==="admin"||state.profile?.role==="level1"}

async function checkBootstrap(){
  try{
    const r=await fetch(SUPABASE_URL+"/functions/v1/bootstrap-status",{headers:{"apikey":SUPABASE_KEY}});
    const j=await r.json();
    if(!r.ok) throw new Error(j.error||"读取失败");
    return !!j.initialized;
  }catch(err){
    toast("初始化状态读取失败："+err.message,true);
    return false;
  }
}

function renderLogin(initialized){
  $("#root").innerHTML=`
    <section class="loginPage">
      <div class="loginHero">
        <div class="heroMark">BV</div>
        <div class="heroRule"></div>
        <h1>客户股票跟踪管理系统</h1>
        <p>Brantone Veylor Private Capital Advisory · 客户、人员、买卖记录、持仓与多市场行情统一管理。</p>
      </div>
      <div class="loginSide">
        <div class="loginCard">
          <h2>${initialized?"登录系统":"首次初始化管理员"}</h2>
          <p>${initialized?"管理员 / 一级人员 / 二级人员统一入口":"系统尚未初始化，请创建第一个管理员账户。"}</p>
          <div class="romaniaClock" id="romaniaClock" style="margin-bottom:14px"></div>
          <form id="${initialized?"loginForm":"bootstrapForm"}">
            ${initialized?"":`<div class="field"><label>管理员姓名</label><input class="input" name="display_name" required></div>`}
            <div class="field"><label>账号</label><input class="input" name="username" autocomplete="username" required></div>
            <div class="field"><label>密码</label><input class="input" type="password" name="password" autocomplete="current-password" required></div>
            ${initialized?"":`<div class="field"><label>一次性初始化码</label><input class="input" type="password" name="bootstrap_code" required></div>`}
            <button class="btn primary" style="width:100%;margin-top:8px" type="submit">${initialized?"登录系统":"创建管理员并进入系统"}</button>
          </form>
          <div class="loginFoot">安全登录 · 数据库权限隔离 · 操作记录审计</div>
        </div>
      </div>
    </section>`;
  const form=$("#"+(initialized?"loginForm":"bootstrapForm"));
  form.addEventListener("submit",initialized?login:bootstrap);
  startRomaniaClock();
}

async function bootstrap(e){
  e.preventDefault(); const f=new FormData(e.currentTarget);
  const body=Object.fromEntries(f.entries());
  const btn=$("button",e.currentTarget);btn.disabled=true;btn.textContent="正在初始化…";
  try{
    const r=await fetch(SUPABASE_URL+"/functions/v1/bootstrap-admin",{method:"POST",headers:{"Content-Type":"application/json","apikey":SUPABASE_KEY},body:JSON.stringify(body)});
    const j=await r.json();if(!r.ok)throw new Error(j.error||"初始化失败");
    toast("管理员创建成功，请登录");
    renderLogin(true);
  }catch(err){toast(err.message,true);btn.disabled=false;btn.textContent="创建管理员并进入系统"}
}

async function login(e){
  e.preventDefault(); const f=new FormData(e.currentTarget);
  const username=String(f.get("username")||"").trim().toLowerCase();
  const password=String(f.get("password")||"");
  const btn=$("button",e.currentTarget);btn.disabled=true;btn.textContent="正在登录…";
  const {data,error}=await supabase.auth.signInWithPassword({email:username+"@crm.nuvexapro.com",password});
  if(error){toast("登录失败："+error.message,true);btn.disabled=false;btn.textContent="登录系统";return}
  state.session=data.session; await loadProfileAndStart();
}

async function loadProfileAndStart(){
  const {data:{session}}=await supabase.auth.getSession();
  if(!session){renderLogin(await checkBootstrap());return}
  state.session=session;
  const {data,error}=await supabase.from("profiles").select("*").eq("id",session.user.id).single();
  if(error||!data||data.status!=="active"){
    await supabase.auth.signOut();toast("账户未启用或无系统权限",true);renderLogin(true);return;
  }
  state.profile=data;
  renderShell();
  await refreshAll();
}

function renderShell(){
  const items=[
    ["dashboard","总览大盘"],["customers","客户中心"],["personnel","人员中心"],["trades","交易记录"],
    ["positions","持仓中心"],["market","行情中心"],["reports","统计报表"],["settings","系统设置"]
  ].filter(x=>x[0]!=="personnel"||canPersonnel());
  $("#root").innerHTML=`
    <div class="app"><div class="shell">
      <header class="topbar">
        <div class="brand"><div class="mark">BV<small>1996</small></div><div class="brandText"><b>BRANTONE VEYLOR</b><span>PRIVATE CAPITAL ADVISORY</span></div></div>
        <nav class="nav">${items.map(([id,label])=>`<button data-view="${id}" class="${id===state.activeView?"active":""}">${label}</button>`).join("")}</nav>
        <div class="userArea"><span class="sysok">● 系统运行正常</span><span class="romaniaClock" id="romaniaClock"></span><span class="chip">${roleName(state.profile.role)} · ${esc(state.profile.display_name)}</span><button id="logoutBtn" class="iconBtn">退出</button></div>
      </header>
      <main id="main"></main>
    </div></div>
    <div id="modalRoot"></div>
  `;
  $(".nav button").forEach(b=>b.onclick=()=>switchView(b.dataset.view));
  $("#logoutBtn").onclick=async()=>{await supabase.auth.signOut();state.profile=null;state.session=null;renderLogin(true)};
  startRomaniaClock();
}

async function switchView(view){
  state.activeView=view; $$(".nav button").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
  await renderView();
}

async function refreshAll(){
  const q=[
    supabase.from("customers").select("*").order("created_at",{ascending:false}),
    supabase.from("trades").select("*,customers(name,customer_code)").order("traded_at",{ascending:false}).limit(500),
    supabase.from("positions").select("*,customers(name,customer_code,owner_user_id,level_one_user_id)").order("updated_at",{ascending:false}),
    supabase.from("customer_followups").select("*,customers(name,customer_code)").order("created_at",{ascending:false}).limit(500),
    supabase.from("profiles").select("*").order("created_at",{ascending:true})
  ];
  const [c,t,p,f,s]=await Promise.all(q);
  if(c.error)toast(c.error.message,true);
  state.customers=c.data||[];state.trades=t.data||[];state.positions=p.data||[];state.followups=f.data||[];state.staff=s.data||[];
  await renderView();
}

async function renderView(){
  Object.values(state.charts).forEach(x=>{try{x.destroy()}catch{}});state.charts={};
  const f={dashboard:renderDashboard,customers:renderCustomers,personnel:renderPersonnel,trades:renderTrades,positions:renderPositions,market:renderMarket,reports:renderReports,settings:renderSettings}[state.activeView]||renderDashboard;
  await f();
}

function pageHead(title,sub,actions=""){
  return `<div class="pageHead"><div><h1>${title}</h1><p>${sub}</p></div><div class="actions">${actions}</div></div>`
}

async function renderDashboard(){
  const holdingIds=new Set(state.positions.filter(p=>Number(p.quantity)>0).map(p=>p.customer_id));
  const todayCustomers=state.customers.filter(c=>isRomaniaToday(c.created_at)).length;
  const todayFollow=state.followups.filter(f=>isRomaniaToday(f.created_at)).length;
  const teamCount=state.profile.role==="admin"?state.staff.filter(s=>s.role!=="admin").length:state.profile.role==="level1"?state.staff.filter(s=>s.parent_user_id===state.profile.id).length:0;
  $("#main").innerHTML=pageHead(
    state.profile.role==="admin"?"管理员总览":state.profile.role==="level1"?"一级人员工作台":"二级人员工作台",
    "所有统计仅来自当前账户权限范围内的真实数据。"
  )+`
    <section class="kpis">
      <article class="kpi"><label>客户总数</label><strong>${state.customers.length}</strong><small>当前可见客户</small></article>
      <article class="kpi"><label>${state.profile.role==="level2"?"今日新增":"团队人员"}</label><strong>${state.profile.role==="level2"?todayCustomers:teamCount}</strong><small>${state.profile.role==="level2"?"今日创建":"当前权限范围"}</small></article>
      <article class="kpi"><label>持仓客户</label><strong>${holdingIds.size}</strong><small>持仓数量大于 0</small></article>
      <article class="kpi"><label>今日新增客户</label><strong>${todayCustomers}</strong><small>按创建时间统计</small></article>
      <article class="kpi"><label>今日跟进</label><strong>${todayFollow}</strong><small>跟进记录</small></article>
      <article class="kpi"><label>持仓标的</label><strong>${state.positions.filter(p=>Number(p.quantity)>0).length}</strong><small>客户 × 股票</small></article>
    </section>
    <section class="grid2">
      <article class="panel"><div class="panelHead"><div><h2>客户与交易趋势</h2><p>最近 14 天</p></div></div><div class="chartBox"><canvas id="trendChart"></canvas></div></article>
      <article class="panel"><div class="panelHead"><div><h2>客户状态分布</h2><p>当前客户阶段</p></div></div><div class="chartBox"><canvas id="statusChart"></canvas></div></article>
    </section>
    <section class="grid2" style="margin-top:13px">
      <article class="panel"><div class="panelHead"><div><h2>最近客户</h2><p>最新创建的客户档案</p></div></div><div class="tableWrap">${customerTable(state.customers.slice(0,8),false)}</div></article>
      <article class="panel"><div class="panelHead"><div><h2>待跟进事项</h2><p>存在下次跟进时间的记录</p></div></div><div class="panelBody list">
        ${state.followups.filter(f=>f.next_followup_at).slice(0,7).map(f=>`<div class="listItem"><div class="top"><span>${esc(f.customers?.name||"客户")}</span><small>${dt(f.next_followup_at)}</small></div><p>${esc(f.content)}</p></div>`).join("")||'<div class="empty">暂无待跟进事项</div>'}
      </div></article>
    </section>`;
  drawDashboardCharts();
  bindCustomerLinks();
}

function drawDashboardCharts(){
  const keys14=romaniaDayKeys(14);
  const labels=keys14.map(k=>k.slice(5).replace("-","/"));
  const newC=keys14.map(k=>state.customers.filter(x=>romaniaDateKey(x.created_at)===k).length);
  const tradeC=keys14.map(k=>state.trades.filter(x=>romaniaDateKey(x.traded_at)===k).length);
  state.charts.trend=new Chart($("#trendChart"),{type:"line",data:{labels,datasets:[{label:"新增客户",data:newC,borderColor:"#d93447",backgroundColor:"rgba(217,52,71,.15)",tension:.35,fill:true},{label:"交易记录",data:tradeC,borderColor:"#5aa2ef",tension:.35}]},options:chartOpts()});
  const keys=["prospect","following","holding","closed","archived"];state.charts.status=new Chart($("#statusChart"),{type:"doughnut",data:{labels:keys.map(customerStatus),datasets:[{data:keys.map(k=>state.customers.filter(x=>x.status===k).length),backgroundColor:["#5aa2ef","#d5aa51","#2ed3a0","#8b9bad","#d93447"]}]},options:{...chartOpts(),cutout:"68%"}});
}
function chartOpts(){return{
  responsive:true,maintainAspectRatio:false,
  interaction:{mode:"index",intersect:false},
  hover:{mode:"index",intersect:false},
  plugins:{
    legend:{labels:{color:"#91a4b4",font:{weight:"normal"}}},
    tooltip:{enabled:true,mode:"index",intersect:false,backgroundColor:"#07131f",borderColor:"#35516a",borderWidth:1,titleFont:{weight:"normal"},bodyFont:{weight:"normal"}}
  },
  scales:{x:{ticks:{color:"#6f8497",font:{weight:"normal"}},grid:{color:"#173047"}},y:{ticks:{color:"#6f8497",font:{weight:"normal"}},grid:{color:"#173047"}}}
}}

function customerTable(rows,full=true){
  return `<table class="dataTable"><thead><tr><th>客户编号</th><th>客户姓名</th>${full?"<th>状态</th><th>地区</th><th>负责人</th>":""}<th>建立时间</th><th>操作</th></tr></thead><tbody>
    ${rows.map(c=>{const owner=state.staff.find(s=>s.id===c.owner_user_id);return`<tr><td>${esc(c.customer_code)}</td><td class="link customerLink" data-id="${c.id}">${esc(c.name)}</td>${full?`<td>${customerStatus(c.status)}</td><td>${esc(c.region||"--")}</td><td>${esc(owner?.display_name||"--")}</td>`:""}<td>${dt(c.created_at)}</td><td><button class="btn customerLink" data-id="${c.id}">查看</button></td></tr>`}).join("")}
    ${rows.length?"":'<tr><td colspan="7"><div class="empty">暂无客户数据</div></td></tr>'}
  </tbody></table>`
}
function bindCustomerLinks(){$$(".customerLink").forEach(x=>x.onclick=()=>openCustomer(Number(x.dataset.id)))}

async function renderCustomers(){
  $("#main").innerHTML=pageHead("客户中心","按当前账户权限管理客户资料、交易与跟进。",'<button class="btn primary" id="newCustomer">新增客户</button>')+`
    <article class="panel"><div class="panelHead"><div><h2>客户列表</h2><p>点击客户姓名进入独立详情页</p></div><div class="toolbar"><input id="customerSearch" class="input" placeholder="搜索姓名 / 编号 / 电话"><select id="customerStatus" class="select"><option value="">全部状态</option><option value="prospect">潜在客户</option><option value="following">跟进中</option><option value="holding">持仓中</option><option value="closed">已结束</option><option value="archived">已归档</option></select></div></div><div id="customerTable" class="tableWrap"></div></article>`;
  $("#newCustomer").onclick=openCustomerForm;
  const refresh=()=>{const q=$("#customerSearch").value.toLowerCase(),s=$("#customerStatus").value;const rows=state.customers.filter(c=>(!q||[c.name,c.customer_code,c.phone].some(v=>String(v||"").toLowerCase().includes(q)))&&(!s||c.status===s));$("#customerTable").innerHTML=customerTable(rows);bindCustomerLinks()};
  $("#customerSearch").oninput=refresh;$("#customerStatus").onchange=refresh;refresh();
}

function eligibleOwners(){
  if(state.profile.role==="admin")return state.staff.filter(s=>s.status==="active"&&["level1","level2"].includes(s.role));
  if(state.profile.role==="level1")return [state.profile,...state.staff.filter(s=>s.parent_user_id===state.profile.id&&s.status==="active")];
  return [state.profile];
}

function openCustomerForm(){
  const owners=eligibleOwners();
  modal("新增客户",`
    <form id="customerForm" class="formGrid">
      <div class="field"><label>客户姓名</label><input class="input" name="name" required></div>
      <div class="field"><label>负责人</label><select class="select" name="owner_user_id" required>${owners.map(o=>`<option value="${o.id}">${esc(o.display_name)} · ${roleName(o.role)}</option>`).join("")}</select></div>
      <div class="field"><label>电话</label><input class="input" name="phone"></div>
      <div class="field"><label>邮箱</label><input class="input" type="email" name="email"></div>
      <div class="field"><label>地区</label><input class="input" name="region"></div>
      <div class="field"><label>客户状态</label><select class="select" name="status"><option value="prospect">潜在客户</option><option value="following">跟进中</option><option value="holding">持仓中</option></select></div>
      <div class="field"><label>风险级别</label><select class="select" name="risk_level"><option value="low">低</option><option value="normal" selected>普通</option><option value="high">高</option></select></div>
      <div class="field full"><label>备注</label><textarea class="textarea" name="notes"></textarea></div>
      <div class="field full"><button class="btn primary" type="submit">保存客户</button></div>
    </form>`);
  $("#customerForm").onsubmit=saveCustomer;
}

async function saveCustomer(e){
  e.preventDefault();const b=Object.fromEntries(new FormData(e.currentTarget).entries());const owner=state.staff.find(s=>s.id===b.owner_user_id)||state.profile;
  b.level_one_user_id=owner.role==="level1"?owner.id:owner.role==="level2"?owner.parent_user_id:null;
  const {error}=await supabase.from("customers").insert(b);if(error){toast(error.message,true);return}closeModal();toast("客户已创建");await refreshAll();
}

async function openCustomer(id){
  const c=state.customers.find(x=>x.id===id);if(!c)return;state.activeCustomer=c;
  const pos=state.positions.filter(x=>x.customer_id===id);const trades=state.trades.filter(x=>x.customer_id===id).sort((a,b)=>new Date(a.traded_at)-new Date(b.traded_at));const follows=state.followups.filter(x=>x.customer_id===id);
  const symbols=[...new Set(pos.filter(p=>Number(p.quantity)>0).map(p=>p.symbol))];const q=await fetchQuotes(symbols,{realtimeOnly:true});
  const livePos=pos.filter(p=>q[p.symbol]?.realtime===true&&Number.isFinite(Number(q[p.symbol]?.price)));
  const currentValue=livePos.reduce((a,p)=>a+Number(p.quantity)*Number(q[p.symbol].price),0);
  const unreal=livePos.reduce((a,p)=>a+(Number(p.quantity)*(Number(q[p.symbol].price)-Number(p.avg_cost))),0);
  $("#modalRoot").innerHTML=`
    <section class="customerDetail">
      <div class="detailTop"><button class="btn" id="backCustomers">← 返回</button><div><h1>${esc(c.name)}</h1><span class="muted">${esc(c.customer_code)} · ${customerStatus(c.status)}</span></div><div style="margin-left:auto" class="actions"><button class="btn gold" id="addTradeBtn">新增交易</button><button class="btn" id="addFollowBtn">记录跟进</button></div></div>
      <div class="detailBody">
        <section class="kpis">
          <article class="kpi"><label>当前持仓市值</label><strong>${livePos.length?money(currentValue,pos[0]?.currency||"USD"):"--"}</strong><small>仅使用已确认实时行情</small></article>
          <article class="kpi"><label>未实现盈亏</label><strong class="${unreal>=0?"up":"down"}">${livePos.length?money(unreal,pos[0]?.currency||"USD"):"--"}</strong><small>非实时数据不参与计算</small></article>
          <article class="kpi"><label>持仓股票</label><strong>${pos.filter(p=>Number(p.quantity)>0).length}</strong><small>当前数量大于 0</small></article>
          <article class="kpi"><label>累计交易</label><strong>${trades.length}</strong><small>买入 + 卖出</small></article>
          <article class="kpi"><label>跟进记录</label><strong>${follows.length}</strong><small>客户沟通历史</small></article>
          <article class="kpi"><label>最近跟进</label><strong style="font-size:14px">${follows[0]?dt(follows[0].created_at):"--"}</strong><small>最近一条记录</small></article>
        </section>
        <div class="grid2">
          <article class="panel"><div class="panelHead"><div><h2>当前持仓</h2><p>买卖记录自动计算，不手工伪造持仓</p></div></div><div class="tableWrap">${positionTable(pos,q)}</div></article>
          <article class="panel"><div class="panelHead"><div><h2>持仓结构</h2><p>鼠标经过图表查看数据</p></div></div><div class="chartBox"><canvas id="customerHoldingsChart"></canvas></div></article>
        </div>
        <div class="grid2" style="margin-top:13px">
          <article class="panel"><div class="panelHead"><div><h2>交易轨迹</h2><p>按时间累计净投入</p></div></div><div class="chartBox"><canvas id="customerTradeChart"></canvas></div></article>
          <article class="panel"><div class="panelHead"><div><h2>客户资料</h2><p>基础信息</p></div></div><div class="panelBody list">
            <div class="listItem"><div class="top"><span>负责人</span><span>${esc(state.staff.find(s=>s.id===c.owner_user_id)?.display_name||"--")}</span></div></div>
            <div class="listItem"><div class="top"><span>电话</span><span>${esc(c.phone||"--")}</span></div></div>
            <div class="listItem"><div class="top"><span>邮箱</span><span>${esc(c.email||"--")}</span></div></div>
            <div class="listItem"><div class="top"><span>地区</span><span>${esc(c.region||"--")}</span></div></div>
            <div class="listItem"><p>${esc(c.notes||"暂无备注")}</p></div>
          </div></article>
        </div>
        <div class="grid2" style="margin-top:13px">
          <article class="panel"><div class="panelHead"><div><h2>买卖记录</h2><p>完整交易流水</p></div></div><div class="tableWrap">${tradeTable(trades)}</div></article>
          <article class="panel"><div class="panelHead"><div><h2>跟进时间轴</h2><p>沟通与下次跟进</p></div></div><div class="panelBody list">${follows.map(f=>`<div class="listItem"><div class="top"><span>${esc(f.channel)}</span><small>${dt(f.created_at)}</small></div><p>${esc(f.content)}</p>${f.next_followup_at?`<small>下次跟进：${dt(f.next_followup_at)}</small>`:""}</div>`).join("")||'<div class="empty">暂无跟进记录</div>'}</div></article>
        </div>
      </div>
    </section>`;
  $("#backCustomers").onclick=()=>{$("#modalRoot").innerHTML="";state.activeCustomer=null};
  $("#addTradeBtn").onclick=()=>openTradeForm(c);
  $("#addFollowBtn").onclick=()=>openFollowForm(c);
  drawCustomerCharts(pos,trades,q);
}

function positionTable(rows,q){
  return `<table class="dataTable"><thead><tr><th>股票</th><th>市场</th><th>数量</th><th>平均成本</th><th>实时价</th><th>未实现盈亏</th><th>已实现盈亏</th></tr></thead><tbody>${rows.filter(p=>Number(p.quantity)>0||Number(p.realized_pnl)!==0).map(p=>{const live=q[p.symbol]?.realtime===true&&Number.isFinite(Number(q[p.symbol]?.price));const last=live?Number(q[p.symbol].price):null,u=live?Number(p.quantity)*(last-Number(p.avg_cost)):null;return`<tr><td class="link">${esc(p.symbol)}</td><td>${esc(p.market)}</td><td>${num(p.quantity,4)}</td><td>${money(p.avg_cost,p.currency)}</td><td>${live?money(last,p.currency):'<span class="delayBadge">实时未确认</span>'}</td><td class="${u==null?"":u>=0?"up":"down"}">${u==null?"--":money(u,p.currency)}</td><td class="${Number(p.realized_pnl)>=0?"up":"down"}">${money(p.realized_pnl,p.currency)}</td></tr>`}).join("")}</tbody></table>`
}
function tradeTable(rows){
  return `<table class="dataTable"><thead><tr><th>时间</th><th>股票</th><th>类型</th><th>数量</th><th>价格</th><th>手续费</th></tr></thead><tbody>${rows.map(t=>`<tr><td>${dt(t.traded_at)}</td><td class="link">${esc(t.symbol)}</td><td class="${t.side==="buy"?"up":"down"}">${t.side==="buy"?"买入":"卖出"}</td><td>${num(t.quantity,4)}</td><td>${money(t.price,t.currency)}</td><td>${money(t.fees,t.currency)}</td></tr>`).join("")}</tbody></table>`
}

function drawCustomerCharts(pos,trades,q){
  const h=pos.filter(p=>Number(p.quantity)>0);state.charts.holdings=new Chart($("#customerHoldingsChart"),{type:"doughnut",data:{labels:h.map(x=>x.symbol),datasets:[{label:"成本结构",data:h.map(x=>Number(x.quantity)*Number(x.avg_cost)),backgroundColor:["#d93447","#5aa2ef","#d5aa51","#2ed3a0","#8b9bad","#8d5ed7"]}]},options:{...chartOpts(),cutout:"65%"}});
  let net=0;const data=trades.map(t=>{net+=t.side==="buy"?(Number(t.price)*Number(t.quantity)+Number(t.fees)):-((Number(t.price)*Number(t.quantity))-Number(t.fees));return{x:new Date(t.traded_at).toLocaleDateString("zh-CN"),y:net}});
  state.charts.trades=new Chart($("#customerTradeChart"),{type:"line",data:{labels:data.map(x=>x.x),datasets:[{label:"累计净投入",data:data.map(x=>x.y),borderColor:"#d5aa51",backgroundColor:"rgba(213,170,81,.12)",fill:true,tension:.25}]},options:chartOpts()});
}

function openTradeForm(c){
  modal("新增交易 · "+c.name,`<form id="tradeForm" class="formGrid">
    <div class="field"><label>股票代码</label><input class="input" name="symbol" placeholder="AAPL / MC.PA" required></div>
    <div class="field"><label>股票名称</label><input class="input" name="stock_name"></div>
    <div class="field"><label>市场</label><select class="select" name="market"><option>Bucharest Stock Exchange</option><option>NASDAQ</option><option>NYSE</option><option>Euronext Paris</option><option>Xetra / Frankfurt</option><option>London Stock Exchange</option><option>Borsa Italiana</option><option>Bolsa de Madrid</option><option>Euronext Amsterdam</option><option>SIX Swiss Exchange</option><option>Warsaw Stock Exchange</option><option>Tokyo Stock Exchange</option><option>其他</option></select></div>
    <div class="field"><label>交易类型</label><select class="select" name="side"><option value="buy">买入</option><option value="sell">卖出</option></select></div>
    <div class="field"><label>数量</label><input class="input" type="number" step="0.000001" min="0.000001" name="quantity" required></div>
    <div class="field"><label>价格</label><input class="input" type="number" step="0.000001" min="0" name="price" required></div>
    <div class="field"><label>币种</label><select class="select" name="currency"><option>RON</option><option>USD</option><option>EUR</option><option>GBP</option><option>CHF</option><option>PLN</option><option>JPY</option></select></div>
    <div class="field"><label>手续费</label><input class="input" type="number" step="0.01" min="0" name="fees" value="0"></div>
    <div class="field"><label>交易时间</label><input class="input" type="datetime-local" name="traded_at" required></div>
    <div class="field full"><label>备注</label><textarea class="textarea" name="note"></textarea></div>
    <div class="field full"><button class="btn primary" type="submit">保存交易</button></div>
  </form>`);
  $("[name=traded_at]").value=romaniaInputNow();
  $("#tradeForm").onsubmit=async e=>{e.preventDefault();const b=Object.fromEntries(new FormData(e.currentTarget).entries());b.customer_id=c.id;b.entered_by=state.profile.id;b.symbol=String(b.symbol).trim().toUpperCase();b.traded_at=romaniaLocalToISO(String(b.traded_at));const {error}=await supabase.from("trades").insert(b);if(error){toast(error.message,true);return}if(b.side==="buy"&&c.status!=="holding")await supabase.from("customers").update({status:"holding"}).eq("id",c.id);closeModal();toast("交易已保存，持仓已自动重算");await refreshAll();await openCustomer(c.id)};
}

function openFollowForm(c){
  modal("记录跟进 · "+c.name,`<form id="followForm" class="formGrid">
    <div class="field"><label>沟通渠道</label><select class="select" name="channel"><option value="whatsapp">WhatsApp</option><option value="phone">电话</option><option value="email">邮件</option><option value="meeting">会议</option><option value="other">其他</option></select></div>
    <div class="field"><label>下次跟进</label><input class="input" type="datetime-local" name="next_followup_at"></div>
    <div class="field full"><label>跟进内容</label><textarea class="textarea" name="content" required></textarea></div>
    <div class="field full"><button class="btn primary" type="submit">保存跟进记录</button></div>
  </form>`);
  $("#followForm").onsubmit=async e=>{e.preventDefault();const b=Object.fromEntries(new FormData(e.currentTarget).entries());b.customer_id=c.id;b.user_id=state.profile.id;if(!b.next_followup_at)b.next_followup_at=null;else b.next_followup_at=romaniaLocalToISO(String(b.next_followup_at));const {error}=await supabase.from("customer_followups").insert(b);if(error){toast(error.message,true);return}closeModal();toast("跟进记录已保存");await refreshAll();await openCustomer(c.id)};
}

async function renderPersonnel(){
  const rows=state.staff.filter(s=>state.profile.role==="admin"||s.id===state.profile.id||s.parent_user_id===state.profile.id);
  $("#main").innerHTML=pageHead("人员中心",state.profile.role==="admin"?"管理员可创建一级 / 二级账户、重置密码与禁用账户。":"查看本人及名下二级人员。",state.profile.role==="admin"?'<button class="btn primary" id="newStaff">新建人员账户</button>':"")+`
    <article class="panel"><div class="panelHead"><div><h2>人员账户管理</h2><p>权限由数据库 RLS 强制执行</p></div></div><div class="tableWrap"><table class="dataTable"><thead><tr><th>账号</th><th>姓名</th><th>角色</th><th>上级</th><th>状态</th><th>创建时间</th><th>操作</th></tr></thead><tbody>
    ${rows.map(s=>{const parent=state.staff.find(x=>x.id===s.parent_user_id);return`<tr><td class="link">${esc(s.username)}</td><td>${esc(s.display_name)}</td><td>${roleName(s.role)}</td><td>${esc(parent?.display_name||"--")}</td><td><span class="statusDot ${s.status}"></span>${s.status}</td><td>${dt(s.created_at)}</td><td>${state.profile.role==="admin"&&s.role!=="admin"?`<button class="btn resetPwd" data-id="${s.id}">重置密码</button> <button class="btn danger toggleStaff" data-id="${s.id}" data-status="${s.status==="active"?"disabled":"active"}">${s.status==="active"?"禁用":"启用"}</button>`:"--"}</td></tr>`}).join("")}
    </tbody></table></div></article>`;
  if($("#newStaff"))$("#newStaff").onclick=openStaffForm;
  $$(".resetPwd").forEach(b=>b.onclick=()=>resetStaffPassword(b.dataset.id));
  $$(".toggleStaff").forEach(b=>b.onclick=()=>setStaffStatus(b.dataset.id,b.dataset.status));
}

function openStaffForm(){
  const level1=state.staff.filter(s=>s.role==="level1"&&s.status==="active");
  modal("新建人员账户",`<form id="staffForm" class="formGrid">
    <div class="field"><label>姓名</label><input class="input" name="display_name" required></div>
    <div class="field"><label>账号</label><input class="input" name="username" required></div>
    <div class="field"><label>密码</label><input class="input" type="password" name="password" minlength="8" required></div>
    <div class="field"><label>角色</label><select class="select" name="role" id="staffRole"><option value="level1">一级人员</option><option value="level2">二级人员</option></select></div>
    <div class="field" id="parentField" style="display:none"><label>所属一级人员</label><select class="select" name="parent_user_id"><option value="">请选择</option>${level1.map(x=>`<option value="${x.id}">${esc(x.display_name)}</option>`).join("")}</select></div>
    <div class="field"><label>电话</label><input class="input" name="phone"></div>
    <div class="field full"><button class="btn primary" type="submit">创建账户</button></div>
  </form>`);
  $("#staffRole").onchange=e=>$("#parentField").style.display=e.target.value==="level2"?"block":"none";
  $("#staffForm").onsubmit=async e=>{e.preventDefault();const b=Object.fromEntries(new FormData(e.currentTarget).entries());b.action="create";if(b.role==="level1")b.parent_user_id=null;const j=await callStaffFn(b);if(j){closeModal();toast("人员账户已创建");await refreshAll();}};
}
async function callStaffFn(body){
  const {data:{session}}=await supabase.auth.getSession();const r=await fetch(SUPABASE_URL+"/functions/v1/staff-admin",{method:"POST",headers:{"Content-Type":"application/json","apikey":SUPABASE_KEY,"Authorization":"Bearer "+session.access_token},body:JSON.stringify(body)});const j=await r.json();if(!r.ok){toast(j.error||"操作失败",true);return null}return j
}
async function resetStaffPassword(id){const p=prompt("请输入新密码（至少 8 位）");if(!p)return;const j=await callStaffFn({action:"reset_password",user_id:id,new_password:p});if(j)toast("密码已重置")}
async function setStaffStatus(id,status){if(!confirm(status==="disabled"?"确认禁用该账户？":"确认启用该账户？"))return;const j=await callStaffFn({action:"set_status",user_id:id,status});if(j){toast("账户状态已更新");await refreshAll()}}

async function renderTrades(){
  $("#main").innerHTML=pageHead("交易记录","当前权限范围内的全部客户买入 / 卖出流水。")+`
    <article class="panel"><div class="panelHead"><div><h2>交易流水</h2><p>持仓由此流水自动计算</p></div><div class="toolbar"><input id="tradeSearch" class="input" placeholder="搜索客户 / 股票"></div></div><div id="tradesTable" class="tableWrap"></div></article>`;
  const refresh=()=>{const q=$("#tradeSearch").value.toLowerCase(),rows=state.trades.filter(t=>!q||[t.symbol,t.stock_name,t.customers?.name,t.customers?.customer_code].some(v=>String(v||"").toLowerCase().includes(q)));$("#tradesTable").innerHTML=`<table class="dataTable"><thead><tr><th>时间</th><th>客户</th><th>股票</th><th>市场</th><th>类型</th><th>数量</th><th>价格</th><th>手续费</th></tr></thead><tbody>${rows.map(t=>`<tr><td>${dt(t.traded_at)}</td><td>${esc(t.customers?.name||"--")}</td><td class="link">${esc(t.symbol)}</td><td>${esc(t.market)}</td><td class="${t.side==="buy"?"up":"down"}">${t.side==="buy"?"买入":"卖出"}</td><td>${num(t.quantity,4)}</td><td>${money(t.price,t.currency)}</td><td>${money(t.fees,t.currency)}</td></tr>`).join("")}</tbody></table>`};$("#tradeSearch").oninput=refresh;refresh();
}

async function fetchQuotes(symbols,{realtimeOnly=false}={}){
  const out={};
  for(let i=0;i<symbols.length;i+=20){
    const batch=symbols.slice(i,i+20);if(!batch.length)continue;
    try{
      const r=await fetch("/api/market?symbols="+encodeURIComponent(batch.join(","))+"&realtimeOnly="+(realtimeOnly?"1":"0"));
      const j=await r.json();
      for(const x of j.rows||[])out[x.symbol]=x;
    }catch{}
  }
  Object.assign(state.quotes,out);
  return out;
}

async function renderPositions(){
  const symbols=[...new Set(state.positions.filter(p=>Number(p.quantity)>0).map(p=>p.symbol))];const q=await fetchQuotes(symbols,{realtimeOnly:true});
  $("#main").innerHTML=pageHead("持仓中心","客户交易流水自动汇总；所有市场价格严格只使用数据源确认的实时行情。")+`
    <article class="panel"><div class="panelHead"><div><h2>当前持仓明细</h2><p>非实时或未授权行情不显示价格，也不参与市值和盈亏计算</p></div></div><div class="tableWrap"><table class="dataTable"><thead><tr><th>客户</th><th>股票</th><th>市场</th><th>数量</th><th>平均成本</th><th>实时价</th><th>市值</th><th>未实现盈亏</th><th>已实现盈亏</th></tr></thead><tbody>${state.positions.filter(p=>Number(p.quantity)>0).map(p=>{const live=q[p.symbol]?.realtime===true&&Number.isFinite(Number(q[p.symbol]?.price)),px=live?Number(q[p.symbol].price):null,mv=live?Number(p.quantity)*px:null,u=live?Number(p.quantity)*(px-Number(p.avg_cost)):null;return`<tr><td>${esc(p.customers?.name||"--")}</td><td class="link">${esc(p.symbol)}</td><td>${esc(p.market)}</td><td>${num(p.quantity,4)}</td><td>${money(p.avg_cost,p.currency)}</td><td>${live?money(px,p.currency):'<span class="delayBadge">实时未确认</span>'}</td><td>${mv==null?"--":money(mv,p.currency)}</td><td class="${u==null?"":u>=0?"up":"down"}">${u==null?"--":money(u,p.currency)}</td><td class="${Number(p.realized_pnl)>=0?"up":"down"}">${money(p.realized_pnl,p.currency)}</td></tr>`}).join("")}</tbody></table></div></article>`;
}

async function renderMarket(){
  const presetOptions=Object.entries(MARKET_PRESETS).map(([k,v])=>`<option value="${k}" ${k==="RO"?"selected":""}>${v.label}</option>`).join("");
  $("#main").innerHTML=pageHead("行情中心","实时严格模式：只有数据源明确确认实时的价格才会展示；罗马尼亚优先接入 BVB 官方 Online 实时服务。")+`
    <div class="marketStatusBar">
      <div class="marketStatus live">页面时区：Europe/Bucharest</div>
      <div class="marketStatus live">罗马尼亚：BVB 官方 Online 优先</div>
      <div class="marketStatus blocked">其他市场：若数据源未确认实时，价格自动隐藏</div>
    </div>
    <section class="grid2">
      <article class="panel"><div class="panelHead"><div><h2>多国家实时行情</h2><p>图表悬停显示数据并呈现十字辅助线</p></div><div class="marketControls"><select id="marketCountry" class="select">${presetOptions}</select><input id="marketSymbols" class="input" value="${MARKET_PRESETS.RO.symbols.join(",")}"></div></div><div class="panelBody"><div class="quoteHeader"><div><span class="link" id="mSymbol">--</span><h3 id="mName">选择股票</h3><p class="muted" id="mExchange">--</p><p class="muted" id="mFresh">--</p></div><div><div id="mPrice" class="quotePrice">--</div><div id="mChange">--</div></div></div></div><div class="chartBox"><canvas id="marketChart"></canvas></div></article>
      <article class="panel"><div class="panelHead"><div><h2>实时股票列表</h2><p>罗马尼亚、美国、法国、德国、英国、意大利、西班牙、荷兰、瑞士、波兰、日本</p></div></div><div class="panelBody marketList" id="marketRows"></div></article>
    </section>`;
  const load=async()=>{
    const syms=$("#marketSymbols").value.split(",").map(x=>x.trim().toUpperCase()).filter(Boolean);
    const q=await fetchQuotes(syms,{realtimeOnly:true});
    const rows=syms.map(s=>q[s]).filter(Boolean);
    $("#marketRows").innerHTML=rows.map(x=>{
      const live=x.realtime===true&&!x.error&&Number.isFinite(Number(x.price));
      return `<div class="marketRow marketPick" data-symbol="${x.symbol}"><span class="link">${esc(x.symbol)}</span><span>${esc(x.name||x.symbol)}</span><span>${esc(x.country||"--")}</span><span>${esc(x.exchange||"--")}</span><span>${live?money(x.price,x.currency||"USD"):"--"}</span><span class="${live&&Number(x.changePct)>=0?"up":live?"down":""}">${live&&x.changePct!=null?((Number(x.changePct)>=0?"+":"")+num(x.changePct)+"%"):"--"}</span><span>${live?'<span class="liveBadge">实时</span>':'<span class="delayBadge">未确认实时</span>'}</span></div>`;
    }).join("")||'<div class="empty">暂无实时行情</div>';
    $$(".marketPick").forEach(r=>r.onclick=()=>drawMarket(q[r.dataset.symbol]));
    const first=rows.find(x=>x.realtime===true&&!x.error);
    if(first)drawMarket(first);else{
      $("#mSymbol").textContent=syms[0]||"--";$("#mName").textContent="当前选择没有已确认实时行情";$("#mExchange").textContent="系统已禁止使用延迟价格";$("#mFresh").textContent="请选择其他市场或接入持牌实时数据源";$("#mPrice").textContent="--";$("#mChange").textContent="--";if(state.charts.market){state.charts.market.destroy();delete state.charts.market}
    }
  };
  $("#marketCountry").onchange=e=>{$("#marketSymbols").value=MARKET_PRESETS[e.target.value].symbols.join(",");load()};
  $("#marketSymbols").onchange=load;
  await load();
}
function drawMarket(x){
  const live=x?.realtime===true&&!x.error&&Number.isFinite(Number(x.price));
  $("#mSymbol").textContent=x?.symbol||"--";
  $("#mName").textContent=live?(x.name||x.symbol):"实时行情未确认";
  $("#mExchange").textContent=[x?.country,x?.exchange,x?.currency,x?.source].filter(Boolean).join(" · ");
  $("#mFresh").textContent=live?"最后成交（罗马尼亚时间）："+dt(x.lastTradeAt||new Date()):"非实时价格已按规则隐藏";
  $("#mPrice").textContent=live?num(x.price):"--";
  $("#mChange").textContent=live&&x.changePct!=null?(Number(x.changePct)>=0?"+":"")+num(x.changePct)+"%":"--";
  $("#mChange").className=live?(Number(x.changePct)>=0?"up":"down"):"";
  if(state.charts.market)state.charts.market.destroy();
  if(!live)return;
  const pts=(x.points||[]).filter(p=>p.close!=null);
  state.charts.market=new Chart($("#marketChart"),{type:"line",data:{labels:pts.map(p=>new Date(p.t).toLocaleTimeString("zh-CN",{timeZone:ROMANIA_TZ,hour:"2-digit",minute:"2-digit"})),datasets:[{label:x.symbol+" 实时价",data:pts.map(p=>p.close),borderColor:"#d93447",backgroundColor:"rgba(217,52,71,.14)",fill:true,tension:.22,pointRadius:0,pointHoverRadius:4}]},options:chartOpts()});
}

async function renderReports(){
  const byOwner={};for(const c of state.customers){const o=state.staff.find(s=>s.id===c.owner_user_id)?.display_name||"未知";byOwner[o]=(byOwner[o]||0)+1}
  $("#main").innerHTML=pageHead("统计报表","按当前权限范围实时汇总，不使用虚拟业务数据。")+`
    <section class="grid2">
      <article class="panel"><div class="panelHead"><div><h2>客户归属分布</h2><p>按负责人统计</p></div></div><div class="chartBox"><canvas id="ownerChart"></canvas></div></article>
      <article class="panel"><div class="panelHead"><div><h2>买卖结构</h2><p>交易记录数量</p></div></div><div class="chartBox"><canvas id="sideChart"></canvas></div></article>
    </section>
    <article class="panel" style="margin-top:13px"><div class="panelHead"><div><h2>人员客户统计</h2><p>可见人员的客户数量</p></div></div><div class="tableWrap"><table class="dataTable"><thead><tr><th>人员</th><th>角色</th><th>客户数量</th><th>持仓客户</th></tr></thead><tbody>${state.staff.filter(s=>s.status==="active").map(s=>{const cs=state.customers.filter(c=>c.owner_user_id===s.id),ids=new Set(state.positions.filter(p=>Number(p.quantity)>0&&cs.some(c=>c.id===p.customer_id)).map(p=>p.customer_id));return`<tr><td>${esc(s.display_name)}</td><td>${roleName(s.role)}</td><td>${cs.length}</td><td>${ids.size}</td></tr>`}).join("")}</tbody></table></div></article>`;
  state.charts.owner=new Chart($("#ownerChart"),{type:"bar",data:{labels:Object.keys(byOwner),datasets:[{label:"客户数量",data:Object.values(byOwner),backgroundColor:"#d5aa51"}]},options:chartOpts()});
  state.charts.side=new Chart($("#sideChart"),{type:"doughnut",data:{labels:["买入","卖出"],datasets:[{data:[state.trades.filter(t=>t.side==="buy").length,state.trades.filter(t=>t.side==="sell").length],backgroundColor:["#2ed3a0","#d93447"]}]},options:{...chartOpts(),cutout:"65%"}});
}

async function renderSettings(){
  $("#main").innerHTML=pageHead("系统设置","当前账户与数据连接状态。")+`
    <section class="grid3">
      <article class="panel"><div class="panelHead"><div><h2>当前账户</h2><p>登录身份</p></div></div><div class="panelBody list"><div class="listItem"><div class="top"><span>账号</span><span>${esc(state.profile.username)}</span></div></div><div class="listItem"><div class="top"><span>姓名</span><span>${esc(state.profile.display_name)}</span></div></div><div class="listItem"><div class="top"><span>角色</span><span>${roleName(state.profile.role)}</span></div></div></div></article>
      <article class="panel"><div class="panelHead"><div><h2>数据库</h2><p>Supabase</p></div></div><div class="panelBody list"><div class="listItem"><div class="top"><span>项目</span><span>brantone-veyor-crm</span></div></div><div class="listItem"><div class="top"><span>区域</span><span>Singapore</span></div></div><div class="listItem"><div class="top"><span>RLS</span><span class="up">已启用</span></div></div></div></article>
      <article class="panel"><div class="panelHead"><div><h2>行情数据</h2><p>当前模式</p></div></div><div class="panelBody list"><div class="listItem"><div class="top"><span>覆盖市场</span><span>RO / US / FR / DE / GB / IT / ES / NL / CH / PL / JP</span></div></div><div class="listItem"><div class="top"><span>数据规则</span><span>严格实时；延迟价格禁止展示</span></div></div><div class="listItem"><div class="top"><span>罗马尼亚</span><span class="up">BVB 官方 Online 优先</span></div></div></div></article>
    </section>`;
}

function modal(title,html){$("#modalRoot").innerHTML=`<div class="modal"><div class="modalCard"><div class="modalHead"><h2>${esc(title)}</h2><button class="close" id="closeModal">×</button></div><div class="modalBody">${html}</div></div></div>`;$("#closeModal").onclick=closeModal}
function closeModal(){$("#modalRoot").innerHTML=""}

supabase.auth.onAuthStateChange(async(event,session)=>{if(event==="SIGNED_OUT"){state.session=null;state.profile=null}});
(async()=>{const {data:{session}}=await supabase.auth.getSession();if(session){state.session=session;await loadProfileAndStart()}else renderLogin(await checkBootstrap())})();
