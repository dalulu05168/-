
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { getLang,setLang,localeFor,tr,translateUI,languageOptions,roleLabel,customerStatusLabel,renderShareBoard as renderShareBoardFeature,openTimeSettings,openShareBoardConfig,miniCandlesHTML,miniRSIHTML } from "./ui-features.js";

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
  charts:{}, activeView:"dashboard", activeCustomer:null, quotes:{},
  lang:getLang(), appSettings:null, shareBoard:null, shareSlots:[], allocationClockTimer:null
};

let romaniaClockTimer=null;

const $ = (s,root=document)=>root.querySelector(s);
const $$ = (s,root=document)=>[...root.querySelectorAll(s)];
const esc = (v="") => String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const money = (n,c="USD") => new Intl.NumberFormat(localeFor(state.lang),{style:"currency",currency:c||"USD",maximumFractionDigits:2}).format(Number(n||0));
const num = (n,d=2)=>Number(n||0).toLocaleString(localeFor(state.lang),{maximumFractionDigits:d});
const dt = (v)=>v?new Date(v).toLocaleString(localeFor(state.lang),{timeZone:ROMANIA_TZ,hour12:false}):"--";
const romaniaDateKey = (v=new Date()) => new Intl.DateTimeFormat("en-CA",{timeZone:ROMANIA_TZ,year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(v));
const isRomaniaToday = v => romaniaDateKey(v)===romaniaDateKey();
const romaniaClockText = () => new Intl.DateTimeFormat(localeFor(state.lang),{timeZone:ROMANIA_TZ,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false,timeZoneName:"short"}).format(new Date());
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
  Chart.defaults.devicePixelRatio=Math.min(Math.max(window.devicePixelRatio||1,1),2);
  Chart.defaults.animation.duration=180;
}

function toast(msg,error=false){
  let t=$("#toast"); if(!t){t=document.createElement("div");t.id="toast";document.body.appendChild(t)}
  t.className="toast"+(error?" error":""); t.textContent=msg; clearTimeout(t._x); t._x=setTimeout(()=>t.remove(),3200)
}

function roleName(r){return roleLabel(r,state.lang)}
function customerStatus(s){return customerStatusLabel(s,state.lang)}
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
          <div class="loginLangRow"><span>语言</span><select id="loginLang" class="select">${languageOptions(state.lang)}</select></div>
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
  $("#loginLang").onchange=e=>{state.lang=setLang(e.target.value);renderLogin(initialized)};
  translateUI($("#root"),state.lang);
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
    ["positions","持仓中心"],["market","行情中心"],["reports","统计报表"],
    ["shareboard","股票份额看板"],["settings","系统设置"]
  ].filter(x=>(x[0]!=="personnel"||canPersonnel())&&(x[0]!=="shareboard"||state.profile?.role==="admin"));
  $("#root").innerHTML=`
    <div class="app"><div class="shell">
      <header class="topbar">
        <div class="brand"><div class="mark">BV<small>1996</small></div><div class="brandText"><b>BRANTONE VEYLOR</b><span>PRIVATE CAPITAL ADVISORY</span></div></div>
        <div class="navFrame"><nav class="nav">${items.map(([id,label])=>`<button data-view="${id}" class="${id===state.activeView?"active":""}">${tr(label,state.lang)}</button>`).join("")}</nav></div>
        <div class="userArea"><span class="sysok">${tr("系统正常",state.lang)}</span><span class="romaniaClock" id="romaniaClock"></span><select id="globalLang" class="langSwitch">${languageOptions(state.lang)}</select><span class="chip">${roleName(state.profile.role)} · ${esc(state.profile.display_name)}</span><button id="logoutBtn" class="iconBtn">${tr("退出",state.lang)}</button></div>
      </header>
      <main id="main" data-view="${state.activeView}"></main>
    </div></div>
    <div id="modalRoot"></div>
  `;
  $(".nav button").forEach(b=>b.onclick=()=>switchView(b.dataset.view));
  $("#globalLang").onchange=async e=>{state.lang=setLang(e.target.value);renderShell();await renderView(0)};
  $("#logoutBtn").onclick=async()=>{await supabase.auth.signOut();state.profile=null;state.session=null;renderLogin(true)};
  translateUI($("#root"),state.lang);
  startRomaniaClock();
}

let viewSwitchToken=0;

async function switchView(view){
  if(!view)return;
  const token=++viewSwitchToken;
  const main=$("#main");
  if(main){
    main.classList.remove("viewReveal");
    main.classList.add("viewLeaving");
    await new Promise(r=>setTimeout(r,60));
    if(token!==viewSwitchToken)return;
  }
  state.activeView=view;
  $$(".nav button").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
  await renderView(token);
}

async function refreshAll(){
  const q=[
    supabase.from("customers").select("*").order("created_at",{ascending:false}),
    supabase.from("trades").select("*,customers(name,customer_code)").order("traded_at",{ascending:false}).limit(500),
    supabase.from("positions").select("*,customers(name,customer_code,owner_user_id,level_one_user_id)").order("updated_at",{ascending:false}),
    supabase.from("customer_followups").select("*,customers(name,customer_code)").order("created_at",{ascending:false}).limit(500),
    supabase.from("profiles").select("*").order("created_at",{ascending:true}),
    supabase.from("app_settings").select("*").eq("id",1).maybeSingle(),
    state.profile?.role==="admin"?supabase.from("share_boards").select("*").order("board_date",{ascending:false}).order("updated_at",{ascending:false}).limit(1).maybeSingle():Promise.resolve({data:null,error:null})
  ];
  const [c,t,p,f,s,settings,board]=await Promise.all(q);
  if(c.error)toast(c.error.message,true);
  state.customers=c.data||[];
  state.trades=t.data||[];
  state.positions=p.data||[];
  state.followups=f.data||[];
  state.staff=s.data||[];
  state.appSettings=settings.data||state.appSettings||null;
  state.shareBoard=board.data||null;
  if(state.shareBoard?.id){
    const slots=await supabase.from("share_board_slots").select("*").eq("board_id",state.shareBoard.id).order("slot_at",{ascending:true});
    state.shareSlots=slots.data||[];
  }else state.shareSlots=[];
  await renderView(0);
}

function featureCtx(){
  return {state,supabase,$,$,esc,num,money,dt,romaniaClockText,romaniaDateKey,romaniaInputNow,romaniaLocalToISO,ROMANIA_TZ,fetchQuotes,chartOpts,toast,modal,closeModal,switchView,refreshAll};
}
async function renderView(token=0){
  Object.values(state.charts).forEach(x=>{try{x.destroy()}catch{}});
  state.charts={};
  const main=$("#main");
  if(!main)return;
  main.className="viewBusy";
  main.dataset.view=state.activeView;
  const renderer={
    dashboard:renderDashboard,
    customers:renderCustomers,
    personnel:renderPersonnel,
    trades:renderTrades,
    positions:renderPositions,
    market:renderMarket,
    reports:renderReports,
    shareboard:()=>renderShareBoardFeature(featureCtx()),
    settings:renderSettings
  }[state.activeView]||renderDashboard;

  try{
    await renderer();
    translateUI(main,state.lang);
  }catch(err){
    console.error("renderView failed",state.activeView,err);
    main.innerHTML='<div class="empty" style="padding:40px">页面加载失败，请点击顶部导航重新进入。</div>';
    toast("页面加载异常："+(err?.message||"未知错误"),true);
  }finally{
    if(token!==0 && token!==viewSwitchToken)return;
    main.classList.remove("viewBusy","viewLeaving","viewEntering");
    main.classList.add("viewReveal");
    requestAnimationFrame(()=>requestAnimationFrame(()=>main.classList.remove("viewReveal")));
  }
}

function pageHead(title,sub,actions=""){
  return actions ? `<div class="pageActions"><div class="actions">${actions}</div></div>` : "";
}


function renderLevel2Dashboard(){
  $("#main").classList.add("dashboardViewport");
  const customers=state.customers;
  const openPositions=state.positions.filter(p=>Number(p.quantity)>0);
  const buys=state.trades.filter(t=>t.side==="buy");
  const sells=state.trades.filter(t=>t.side==="sell");
  const holdingCustomerIds=new Set(openPositions.map(p=>p.customer_id));
  const realized=state.positions.reduce((sum,p)=>sum+Number(p.realized_pnl||0),0);
  const costBasis=openPositions.reduce((sum,p)=>sum+(Number(p.quantity)*Number(p.avg_cost)),0);
  const recentTrades=state.trades.slice(0,8);

  $("#main").innerHTML=`
    <section class="level2Workspace">
      <div class="level2MetricGrid">
        <article class="level2Metric accent"><div class="metricLabel">MY CLIENTS</div><div class="metricTitle">我的客户</div><div class="metricValue">${customers.length}</div><div class="metricFoot">仅当前二级账户客户</div></article>
        <article class="level2Metric"><div class="metricLabel">HOLDING CLIENTS</div><div class="metricTitle">持仓客户</div><div class="metricValue">${holdingCustomerIds.size}</div><div class="metricFoot">持有至少 1 个标的</div></article>
        <article class="level2Metric"><div class="metricLabel">OPEN POSITIONS</div><div class="metricTitle">当前持仓</div><div class="metricValue">${openPositions.length}</div><div class="metricFoot">客户 × 股票</div></article>
        <article class="level2Metric"><div class="metricLabel">BUY ORDERS</div><div class="metricTitle">累计买进</div><div class="metricValue">${buys.length}</div><div class="metricFoot">完整买入流水</div></article>
        <article class="level2Metric"><div class="metricLabel">SELL ORDERS</div><div class="metricTitle">累计卖出</div><div class="metricValue">${sells.length}</div><div class="metricFoot">完整卖出流水</div></article>
      </div>

      <div class="level2MainGrid">
        <article class="panel level2PositionsPanel">
          <div class="panelHead compact"><div><h2>客户持仓总览</h2><p>CLIENT HOLDINGS · 自动来自买卖流水</p></div><span class="headMeta">${openPositions.length} POSITIONS</span></div>
          <div class="tableWrap">
            <table class="dataTable level2HoldingsTable">
              <thead><tr><th>客户</th><th>股票</th><th>市场</th><th>数量</th><th>平均成本</th><th>成本基准</th><th>已实现盈亏</th><th>操作</th></tr></thead>
              <tbody>
                ${openPositions.map(p=>`<tr>
                  <td class="customerLink link" data-id="${p.customer_id}">${esc(p.customers?.name||"--")}</td>
                  <td class="symbolCell">${esc(p.symbol)}</td>
                  <td>${esc(p.market)}</td>
                  <td class="goldData">${num(p.quantity,4)}</td>
                  <td>${money(p.avg_cost,p.currency)}</td>
                  <td>${money(Number(p.quantity)*Number(p.avg_cost),p.currency)}</td>
                  <td class="${Number(p.realized_pnl)>=0?"up":"down"}">${money(p.realized_pnl,p.currency)}</td>
                  <td><button class="tableAction customerLink" data-id="${p.customer_id}">详情 ↗</button></td>
                </tr>`).join("")}
                ${openPositions.length?"":'<tr><td colspan="8"><div class="empty executiveEmpty">暂无客户持仓</div></td></tr>'}
              </tbody>
            </table>
          </div>
        </article>

        <div class="level2SideStack">
          <article class="panel">
            <div class="panelHead compact"><div><h2>买卖结构</h2><p>ORDER MIX</p></div><span class="headMeta">${state.trades.length} ORDERS</span></div>
            <div class="chartBox level2Chart"><canvas id="level2SideChart"></canvas></div>
          </article>
          <article class="panel level2PnlPanel">
            <div class="panelHead compact"><div><h2>账户业务汇总</h2><p>PORTFOLIO BASIS</p></div></div>
            <div class="level2SummaryList">
              <div><span>持仓成本基准</span><span>${costBasis?num(costBasis,2):"—"}</span></div>
              <div><span>已实现盈亏</span><span class="${realized>=0?"up":"down"}">${num(realized,2)}</span></div>
              <div><span>客户总数</span><span>${customers.length}</span></div>
              <div><span>交易总数</span><span>${state.trades.length}</span></div>
            </div>
          </article>
        </div>
      </div>

      <article class="panel level2OrdersPanel">
        <div class="panelHead compact"><div><h2>最近买进 / 卖出明细</h2><p>RECENT CLIENT ORDERS · 罗马尼亚时间</p></div><span class="headMeta">${recentTrades.length} RECENT</span></div>
        <div class="tableWrap">
          <table class="dataTable level2OrdersTable">
            <thead><tr><th>时间</th><th>客户</th><th>股票</th><th>方向</th><th>数量</th><th>成交价</th><th>成交金额</th><th>手续费</th><th>备注</th></tr></thead>
            <tbody>
              ${recentTrades.map(t=>`<tr>
                <td>${dt(t.traded_at)}</td>
                <td class="customerLink link" data-id="${t.customer_id}">${esc(t.customers?.name||"--")}</td>
                <td class="symbolCell">${esc(t.symbol)}</td>
                <td><span class="sideBadge ${t.side}">${t.side==="buy"?"买进":"卖出"}</span></td>
                <td>${num(t.quantity,4)}</td>
                <td>${money(t.price,t.currency)}</td>
                <td>${money(Number(t.quantity)*Number(t.price),t.currency)}</td>
                <td>${money(t.fees,t.currency)}</td>
                <td>${esc(t.note||"--")}</td>
              </tr>`).join("")}
              ${recentTrades.length?"":'<tr><td colspan="9"><div class="empty executiveEmpty">暂无买卖记录</div></td></tr>'}
            </tbody>
          </table>
        </div>
      </article>
    </section>`;
  drawLevel2Charts(buys,sells);
  bindCustomerLinks();
}

function drawLevel2Charts(buys,sells){
  const el=$("#level2SideChart");
  if(!el)return;
  state.charts.level2Side=new Chart(el,{
    type:"doughnut",
    data:{labels:["买进","卖出"],datasets:[{data:[buys.length,sells.length],backgroundColor:["#2ed3a0","#d93447"],borderColor:["#2ed3a0","#d93447"],borderWidth:1}]},
    options:{...chartOpts(),cutout:"68%"}
  });
}

async function renderDashboard(){
  $("#main").classList.add("dashboardViewport","terminalMain");
  if(state.profile?.role==="level2"){renderLevel2Dashboard();return;}

  const openPositions=state.positions.filter(p=>Number(p.quantity)>0);
  const recentTrades=state.trades.slice(0,6);
  const todayTrades=state.trades.filter(t=>isRomaniaToday(t.traded_at)).length;
  const dueFollowups=state.followups.filter(f=>f.next_followup_at&&new Date(f.next_followup_at)<=new Date()).length;
  const totalCost=openPositions.reduce((sum,p)=>sum+(Number(p.quantity)*Number(p.avg_cost)),0);
  const realized=state.positions.reduce((sum,p)=>sum+Number(p.realized_pnl||0),0);
  const teamCount=state.profile.role==="admin"
    ? state.staff.filter(x=>x.role!=="admin"&&x.status==="active").length
    : state.staff.filter(x=>x.parent_user_id===state.profile.id&&x.status==="active").length;

  $("#main").innerHTML=`
    <section class="tradeflareShell">
      <aside class="tradeflareRail">
        <button class="railBtn active" data-view="dashboard" title="总览">总</button>
        <button class="railBtn" data-view="customers" title="客户">客</button>
        <button class="railBtn" data-view="positions" title="持仓">持</button>
        <button class="railBtn" data-view="trades" title="交易">交</button>
        <button class="railBtn" data-view="reports" title="报表">报</button>
        <div class="railSpacer"></div>
        <button class="railBtn" data-view="settings" title="设置">设</button>
      </aside>

      <div class="tradeflareCanvas">
        <div class="terminalTicker">
          <div class="tickerIdentity">
            <span class="tickerDot"></span>
            <div><span class="tickerSymbol">CRM · PORTFOLIO</span><small>Brantone Veylor</small></div>
          </div>
          <div class="tickerStat"><small>客户</small><span>${state.customers.length}</span></div>
          <div class="tickerStat"><small>当前持仓</small><span>${openPositions.length}</span></div>
          <div class="tickerStat"><small>今日交易</small><span>${todayTrades}</span></div>
          <div class="tickerStat"><small>待跟进</small><span class="${dueFollowups?"terminalRed":""}">${dueFollowups}</span></div>
          <div class="tickerStat"><small>成本基准</small><span>${totalCost?num(totalCost,2):"—"}</span></div>
          <button class="tickerGear" id="terminalRefresh">刷新</button>
        </div>

        <div class="terminalGrid">
          <section class="terminalLeft">
            <article class="terminalChartCard">
              <div class="terminalChartToolbar">
                <div class="terminalTabs">
                  <button class="terminalTab active" data-action="trend">趋势</button>
                  <button class="terminalTab" data-view="positions">持仓</button>
                  <button class="terminalTab" data-view="trades">交易</button>
                  <button class="terminalTab" data-view="customers">客户</button>
                </div>
                <div class="terminalIntervals">
                  <button data-days="1">1D</button><button class="active" data-days="7">7D</button><button data-days="30">1M</button><button data-days="90">3M</button><button data-days="365">1Y</button>
                </div>
              </div>
              <div class="terminalChartWrap"><canvas id="trendChart"></canvas></div>
            </article>

            <div class="terminalPositionList">
              ${recentTrades.slice(0,2).map(t=>`
                <article class="terminalPositionCard">
                  <div class="positionTop">
                    <div><span class="positionSymbol">${esc(t.symbol)}</span><span class="positionBadge ${t.side}">${t.side==="buy"?"买入":"卖出"}</span></div>
                    <span class="positionState">${dt(t.traded_at)}</span>
                  </div>
                  <div class="positionMetrics">
                    <div><small>客户</small><span>${esc(t.customers?.name||"--")}</span></div>
                    <div><small>数量</small><span>${num(t.quantity,4)}</span></div>
                    <div><small>成交价</small><span>${money(t.price,t.currency)}</span></div>
                    <div><small>成交金额</small><span>${money(Number(t.quantity)*Number(t.price),t.currency)}</span></div>
                  </div>
                </article>`).join("")||'<div class="terminalEmpty">暂无近期交易</div>'}
            </div>
          </section>

          <aside class="terminalOrderPanel">
            <div class="terminalSegment"><button class="active" data-view="customers">客户</button><button data-view="positions">持仓</button></div>
            <div class="terminalSegment secondary"><button data-view="dashboard">概览</button><button class="active" data-view="trades">操作</button><button data-view="customers">跟进</button></div>

            <div class="terminalFormCard">
              <div class="terminalFieldRow"><label>当前账户</label><span>${esc(state.profile.display_name)}</span></div>
              <div class="terminalFieldRow"><label>角色</label><span>${roleName(state.profile.role)}</span></div>
              <div class="terminalFieldRow"><label>团队人员</label><span>${teamCount}</span></div>
              <div class="terminalFieldRow"><label>已实现盈亏</label><span class="${realized>=0?"terminalGreen":"terminalRed"}">${num(realized,2)}</span></div>
              <div class="terminalFieldRow"><label>罗马尼亚时间</label><span>${romaniaClockText()}</span></div>
            </div>

            <div class="terminalActionGrid">
              <button class="terminalPrimary" id="terminalNewCustomer">新增客户</button>
              <button class="terminalSecondary" data-view="customers">客户中心</button>
              <button class="terminalSecondary" data-view="positions">持仓中心</button>
              <button class="terminalSecondary" data-view="trades">交易记录</button>
              ${state.profile.role==="admin"?'<button class="terminalSecondary" id="openShareBoardConfig">份额配置</button><button class="terminalSecondary" id="openTimeSettings">交易时段</button><button class="terminalSecondary" data-view="shareboard">份额看板</button>':""}
            </div>

            <div class="terminalUsage">
              <h3>业务使用情况</h3>
              <div class="usageRow"><span>持仓标的</span><span>${openPositions.length}</span></div>
              <div class="usageRow"><span>客户总数</span><span>${state.customers.length}</span></div>
              <div class="usageRow"><span>今日交易</span><span>${todayTrades}</span></div>
              <div class="usageRow"><span>待跟进</span><span class="${dueFollowups?"terminalRed":""}">${dueFollowups}</span></div>
              <div class="usageBar"><i style="width:${Math.min(100,Math.max(8,state.customers.length*8))}%"></i></div>
            </div>
          </aside>
        </div>
      </div>
    </section>`;

  drawDashboardCharts(7);
  $$(".tradeflareRail [data-view], .terminalTab[data-view], .terminalSecondary[data-view], .terminalSegment [data-view]").forEach(b=>b.onclick=()=>switchView(b.dataset.view));
  const trendBtn=$('.terminalTab[data-action="trend"]');
  if(trendBtn)trendBtn.onclick=()=>{drawDashboardCharts(7);toast("已切换业务趋势")};
  $$(".terminalIntervals [data-days]").forEach(b=>b.onclick=()=>{
    $$(".terminalIntervals [data-days]").forEach(x=>x.classList.toggle("active",x===b));
    drawDashboardCharts(Number(b.dataset.days)||7);
  });
  $("#terminalNewCustomer").onclick=openCustomerForm;
  const sbc=$("#openShareBoardConfig");if(sbc)sbc.onclick=()=>openShareBoardConfig(featureCtx());
  const mts=$("#openTimeSettings");if(mts)mts.onclick=()=>openTimeSettings(featureCtx());
  $("#terminalRefresh").onclick=async()=>{toast("正在刷新数据");await refreshAll()};
}
function drawDashboardCharts(days=14){
  const count=Math.max(1,Math.min(365,Number(days)||14));
  const keys=romaniaDayKeys(count);
  const labels=keys.map(k=>k.slice(5).replace("-","/"));
  const newC=keys.map(k=>state.customers.filter(x=>romaniaDateKey(x.created_at)===k).length);
  const tradeC=keys.map(k=>state.trades.filter(x=>romaniaDateKey(x.traded_at)===k).length);
  if(state.charts.trend){try{state.charts.trend.destroy()}catch{};delete state.charts.trend}
  const trendEl=$("#trendChart");
  if(trendEl){
    state.charts.trend=new Chart(trendEl,{type:"line",data:{labels,datasets:[
      {label:"新增客户",data:newC,borderColor:"#14e76d",backgroundColor:"rgba(20,231,109,.10)",tension:.32,fill:true,pointRadius:0,pointHoverRadius:4},
      {label:"交易记录",data:tradeC,borderColor:"#6e7cff",backgroundColor:"rgba(110,124,255,.05)",tension:.32,pointRadius:0,pointHoverRadius:4}
    ]},options:chartOpts()});
  }
  const statusEl=$("#statusChart");
  if(statusEl){
    const statusKeys=["prospect","following","holding","closed","archived"];
    state.charts.status=new Chart(statusEl,{type:"doughnut",data:{labels:statusKeys.map(customerStatus),datasets:[{data:statusKeys.map(k=>state.customers.filter(x=>x.status===k).length),backgroundColor:["#6e7cff","#d5aa51","#14e76d","#8b9bad","#d93447"]}]},options:{...chartOpts(),cutout:"68%"}});
  }
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
  $("#main").innerHTML=`
    <article class="panel modulePanel">
      <div class="panelHead unifiedModuleHead">
        <div><h2>客户列表</h2><p>按当前账户权限管理客户资料、交易与跟进</p></div>
        <div class="toolbar unifiedActions">
          <input id="customerSearch" class="input" placeholder="搜索姓名 / 编号 / 电话">
          <select id="customerStatus" class="select">
            <option value="">全部状态</option><option value="prospect">潜在客户</option><option value="following">跟进中</option><option value="holding">持仓中</option><option value="closed">已结束</option><option value="archived">已归档</option>
          </select>
          <button class="btn primary" id="newCustomer">新增客户</button>
        </div>
      </div>
      <div id="customerTable" class="tableWrap moduleContent"></div>
    </article>`;
  $("#newCustomer").onclick=openCustomerForm;
  const refresh=()=>{
    const q=$("#customerSearch").value.toLowerCase(),s=$("#customerStatus").value;
    const rows=state.customers.filter(c=>(!q||[c.name,c.customer_code,c.phone].some(v=>String(v||"").toLowerCase().includes(q)))&&(!s||c.status===s));
    $("#customerTable").innerHTML=customerTable(rows);bindCustomerLinks();
  };
  $("#customerSearch").oninput=refresh;
  $("#customerStatus").onchange=refresh;
  refresh();
}

function eligibleOwners(){
  if(state.profile.role==="admin")return state.staff.filter(s=>s.status==="active"&&["level1","level2"].includes(s.role));
  if(state.profile.role==="level1")return [state.profile,...state.staff.filter(s=>s.parent_user_id===state.profile.id&&s.status==="active")];
  return [state.profile];
}

function openCustomerForm(){
  const owners=eligibleOwners();
  const isLevel2=state.profile.role==="level2";
  modal("客户资料",`
    <form id="customerForm" class="formGrid">
      <div class="field"><label>客户姓名</label><input class="input" name="name" required></div>
      <div class="field"><label>性别</label><select class="select" name="gender"><option value="unknown">未填写</option><option value="male">男性</option><option value="female">女性</option></select></div>
      <div class="field"><label>年龄（可选）</label><input class="input" type="number" min="18" max="120" name="age"></div>
      <div class="field"><label>地区（可选）</label><input class="input" name="region"></div>
      <div class="field"><label>电话（可选）</label><input class="input" name="phone"></div>
      <div class="field"><label>邮箱（可选）</label><input class="input" type="email" name="email"></div>
      <div class="field"><label>资金规模（可选）</label><input class="input" type="number" min="0" step="0.01" name="capital_amount"></div>
      <div class="field"><label>资金币种</label><select class="select" name="capital_currency"><option>USD</option><option>EUR</option><option>RON</option><option>GBP</option><option>CHF</option><option>PLN</option><option>JPY</option></select></div>
      <div class="field"><label>客户状态</label><select class="select" name="status"><option value="prospect">潜在客户</option><option value="following">服务中</option><option value="holding">持仓中</option></select></div>
      <div class="field"><label>风险级别</label><select class="select" name="risk_level"><option value="low">低</option><option value="normal" selected>普通</option><option value="high">高</option></select></div>
      ${isLevel2
        ? `<input type="hidden" name="owner_user_id" value="${state.profile.id}">`
        : `<div class="field full"><label>归属二级人员</label><select class="select" name="owner_user_id" required>${owners.filter(o=>o.role==="level2").map(o=>`<option value="${o.id}">${esc(o.display_name)}</option>`).join("")}</select></div>`}
      <div class="field full"><label>客户备注（由二级人员填写）</label><textarea class="textarea" name="notes" placeholder="填写客户偏好、重点信息、服务说明等"></textarea></div>
      <div class="field full"><button class="btn primary" type="submit">保存客户资料</button></div>
    </form>`);
  $("#customerForm").onsubmit=saveCustomer;
}

async function saveCustomer(e){
  e.preventDefault();
  const b=Object.fromEntries(new FormData(e.currentTarget).entries());
  const owner=state.staff.find(s=>s.id===b.owner_user_id)||state.profile;
  b.level_one_user_id=owner.role==="level2"?owner.parent_user_id:null;
  if(!b.age)b.age=null; else b.age=Number(b.age);
  if(!b.capital_amount)b.capital_amount=null; else b.capital_amount=Number(b.capital_amount);
  const {error}=await supabase.from("customers").insert(b);
  if(error){toast(error.message,true);return}
  closeModal();toast("客户资料已保存");await refreshAll();
}

function clientAvatar(c){
  const cls=c.gender==="male"?"male":c.gender==="female"?"female":"neutral";
  const initial=esc((c.name||"客").trim().slice(0,1));
  return `<div class="clientAvatar ${cls}"><span>${initial}</span></div>`;
}
function marketStatusBadge(x){
  if(!x||x.error||!Number.isFinite(Number(x.price)))return '<span class="quoteTimeBadge">暂无数据</span>';
  const stamp=x.lastTradeAt?new Date(x.lastTradeAt):null;
  const time=stamp&&!Number.isNaN(stamp.getTime())
    ? new Intl.DateTimeFormat("zh-CN",{timeZone:ROMANIA_TZ,hour:"2-digit",minute:"2-digit",hour12:false}).format(stamp)
    : "--:--";
  return '<span class="quoteTimeBadge">更新 '+esc(time)+'</span>';
}
function marketIndexStrip(rows){
  const names={"^GSPC":"S&P 500","^DJI":"Dow Jones","^IXIC":"Nasdaq","^FCHI":"CAC 40","BET.RO":"BET"};
  return rows.map(x=>{
    const usable=x&&!x.error&&Number.isFinite(Number(x.price));
    const pct=usable&&x.changePct!=null?Number(x.changePct):null;
    return `<div class="shareMarketItem">
      <div class="shareMarketTop"><span>${esc(names[x?.symbol]||x?.symbol||"--")}</span>${marketStatusBadge(x)}</div>
      <div class="shareMarketPrice">${usable?num(x.price,2):"--"}</div>
      <div class="shareMarketMeta"><span class="${pct==null?"":pct>=0?"up":"down"}">${pct==null?"--":(pct>=0?"+":"")+num(pct,2)+"%"}</span><span>${x?.lastTradeAt?dt(x.lastTradeAt):"--"}</span></div>
    </div>`;
  }).join("");
}
function openCustomerNoteForm(c){
  modal("编辑客户备注",`<form id="customerNoteForm"><div class="field"><label>客户备注</label><textarea class="textarea" name="notes" style="min-height:180px">${esc(c.notes||"")}</textarea></div><button class="btn primary" type="submit" style="width:100%">保存备注</button></form>`);
  $("#customerNoteForm").onsubmit=async e=>{
    e.preventDefault();
    const notes=String(new FormData(e.currentTarget).get("notes")||"");
    const {error}=await supabase.from("customers").update({notes}).eq("id",c.id);
    if(error){toast(error.message,true);return}
    closeModal();toast("客户备注已更新");await refreshAll();await openCustomer(c.id);
  };
}


async function openCustomer(id){
  const c=state.customers.find(x=>x.id===id);if(!c)return;state.activeCustomer=c;
  const pos=state.positions.filter(x=>x.customer_id===id);
  const trades=state.trades.filter(x=>x.customer_id===id).sort((a,b)=>new Date(b.traded_at)-new Date(a.traded_at));
  const chartTrades=[...trades].sort((a,b)=>new Date(a.traded_at)-new Date(b.traded_at));
  const follows=state.followups.filter(x=>x.customer_id===id);
  const buys=trades.filter(t=>t.side==="buy");
  const sells=trades.filter(t=>t.side==="sell");
  const openPos=pos.filter(p=>Number(p.quantity)>0);
  const symbols=[...new Set(openPos.map(p=>p.symbol))];
  const [q,indexQ]=await Promise.all([
    fetchQuotes(symbols,{realtimeOnly:false}),
    fetchQuotes(["^GSPC","^DJI","^IXIC","^FCHI","BET.RO"],{realtimeOnly:false})
  ]);
  const indexRows=["^GSPC","^DJI","^IXIC","^FCHI","BET.RO"].map(s=>indexQ[s]||{symbol:s,error:true});
  const livePos=openPos.filter(p=>q[p.symbol]?.realtime===true&&Number.isFinite(Number(q[p.symbol]?.price)));
  const pricedPos=openPos.filter(p=>!q[p.symbol]?.error&&Number.isFinite(Number(q[p.symbol]?.price)));
  const currentValue=pricedPos.reduce((a,p)=>a+Number(p.quantity)*Number(q[p.symbol].price),0);
  const unreal=pricedPos.reduce((a,p)=>a+(Number(p.quantity)*(Number(q[p.symbol].price)-Number(p.avg_cost))),0);
  const realized=pos.reduce((a,p)=>a+Number(p.realized_pnl||0),0);
  const costBasis=openPos.reduce((a,p)=>a+(Number(p.quantity)*Number(p.avg_cost)),0);
  const totalPnl=realized+unreal;
  const returnPct=costBasis?totalPnl/costBasis*100:0;
  const latestTrade=trades[0];
  const primary=openPos.find(p=>q[p.symbol]?.points?.length)||openPos[0]||null;
  const owner=state.staff.find(s=>s.id===c.owner_user_id);
  const serviceRows=follows.slice(0,4);

  $("#modalRoot").innerHTML=`
    <section class="customerDetail clientPortfolioDetail shareReady" id="clientSharePage">
      <div class="shareTopbar">
        <div class="shareBrand">
          <div class="shareBrandMark">BV<small>1996</small></div>
          <div><strong>BRANTONE VEYLOR</strong><span>PRIVATE CAPITAL ADVISORY</span></div>
        </div>
        <div class="shareClientIdentity">
          ${clientAvatar(c)}
          <div><h1>${esc(c.name)}</h1><p>${esc(c.customer_code)} · ${esc(c.region||"地区未填写")} · ${c.age?esc(c.age+"岁"):"年龄未填写"}</p></div>
        </div>
        <div class="shareTimeBlock">
          <span>ROMANIA / BUCHAREST</span>
          <strong>${romaniaClockText()}</strong>
          <small>页面生成：${dt(new Date())}</small>
        </div>
        <div class="shareInternalActions">
          <button class="btn" id="backCustomers">返回</button>
          ${state.profile.role==="level2"?'<button class="btn" id="editNoteBtn">编辑客户备注</button>':""}
          <button class="btn gold screenshotHide" id="addTradeBtn">新增交易</button>
          <button class="btn screenshotHide" id="addFollowBtn">记录跟进</button>
          <button class="btn primary" id="captureModeBtn">截图模式</button>
        </div>
      </div>

      <div class="shareMarketStrip">${marketIndexStrip(indexRows)}</div>

      <div class="shareKpiRow">
        <article><label>持仓成本</label><span>${openPos.length?num(costBasis,2):"—"}</span><small>COST BASIS</small></article>
        <article><label>最新行情市值</label><span>${pricedPos.length?num(currentValue,2):"—"}</span><small>按最新可用行情计算</small></article>
        <article><label>未实现盈亏</label><span class="${unreal>=0?"up":"down"}">${pricedPos.length?num(unreal,2):"—"}</span><small>UNREALIZED P/L</small></article>
        <article><label>已实现盈亏</label><span class="${realized>=0?"up":"down"}">${num(realized,2)}</span><small>REALIZED P/L</small></article>
        <article><label>综合收益率</label><span class="${returnPct>=0?"up":"down"}">${(returnPct>=0?"+":"")+num(returnPct,2)}%</span><small>基于当前可用行情</small></article>
        <article><label>最近交易</label><span>${latestTrade?dt(latestTrade.traded_at):"—"}</span><small>${latestTrade?esc(latestTrade.symbol+" · "+(latestTrade.side==="buy"?"买入":"卖出")):"暂无交易"}</small></article>
      </div>

      <div class="shareMainGrid">
        <article class="panel sharePricePanel">
          <div class="panelHead compact"><div><h2>${primary?esc(primary.symbol)+" 价格走势":"价格走势"}</h2><p>PRICE MOVEMENT · 买入 / 卖出节点 · 罗马尼亚时间</p></div><span class="headMeta">${primary?marketStatusBadge(q[primary.symbol]):""}</span></div>
          <div class="chartBox sharePriceChart"><canvas id="customerPriceChart"></canvas></div>
        </article>
        <article class="panel shareReturnPanel">
          <div class="panelHead compact"><div><h2>持仓收益走势</h2><p>POSITION P/L · 基于当前行情序列</p></div></div>
          <div class="chartBox shareReturnChart"><canvas id="customerReturnChart"></canvas></div>
        </article>
        <article class="panel shareAllocationPanel">
          <div class="panelHead compact"><div><h2>持仓结构 / 收益构成</h2><p>ALLOCATION & P/L MIX</p></div></div>
          <div class="shareDonutGrid">
            <div><canvas id="customerHoldingsChart"></canvas><small>持仓占比</small></div>
            <div><canvas id="customerProfitChart"></canvas><small>收益构成</small></div>
          </div>
          <div class="clientMiniTech">
            ${primary?miniCandlesHTML(q[primary.symbol]?.points||[],primary.symbol):'<div class="miniNoData">--</div>'}
            ${primary?miniRSIHTML(q[primary.symbol]?.points||[]):'<div class="miniIndicator"><span>RSI</span><b>--</b></div>'}
          </div>
        </article>
      </div>

      <div class="shareLowerGrid">
        <article class="panel sharePositions">
          <div class="panelHead compact"><div><h2>客户持仓与买卖记录</h2><p>HOLDINGS & ORDER LEDGER</p></div><span class="headMeta">${openPos.length} POSITIONS · ${trades.length} ORDERS</span></div>
          <div class="tableWrap shareLedgerTable">${positionTable(pos,q)}${tradeTable(trades.slice(0,10))}</div>
        </article>
        <article class="panel shareServicePanel">
          <div class="panelHead compact"><div><h2>客户资料与服务纪要</h2><p>CLIENT PROFILE · SERVICE NOTES</p></div></div>
          <div class="shareProfileGrid">
            <div><span>性别</span><span>${c.gender==="male"?"男性":c.gender==="female"?"女性":"未填写"}</span></div>
            <div><span>风险级别</span><span>${esc(c.risk_level||"--")}</span></div>
            <div><span>资金规模</span><span>${c.capital_amount?money(c.capital_amount,c.capital_currency||"USD"):"未填写"}</span></div>
            <div><span>服务状态</span><span>${customerStatus(c.status)}</span></div>
          </div>
          <div class="shareNote"><span>客户备注</span><p>${esc(c.notes||"暂无客户备注")}</p></div>
          <div class="shareServiceTimeline">
            ${serviceRows.map(f=>`<div><span>${dt(f.created_at)}</span><p>${esc(f.content)}</p></div>`).join("")||'<div><span>—</span><p>暂无服务纪要</p></div>'}
          </div>
          <div class="clientOwnerInternal screenshotHide">内部归属：${esc(owner?.display_name||"--")}</div>
        </article>
      </div>

      <div class="shareFoot">
        <span>BRANTONE VEYLOR · PRIVATE CAPITAL ADVISORY</span>
        <span>行情来自免费公开市场数据源；页面以各行情的最新更新时间为准。</span>
        <span>${romaniaClockText()}</span>
      </div>
    </section>`;

  const back=$("#backCustomers");if(back)back.onclick=()=>{$("#modalRoot").innerHTML="";state.activeCustomer=null};
  const addTrade=$("#addTradeBtn");if(addTrade)addTrade.onclick=()=>openTradeForm(c);
  const addFollow=$("#addFollowBtn");if(addFollow)addFollow.onclick=()=>openFollowForm(c);
  const editNote=$("#editNoteBtn");if(editNote)editNote.onclick=()=>openCustomerNoteForm(c);
  const capture=$("#captureModeBtn");
  if(capture)capture.onclick=()=>{
    const page=$("#clientSharePage");
    const on=page.classList.toggle("screenshotMode");
    capture.textContent=on?tr("恢复显示",state.lang):tr("截图模式",state.lang);
    toast(on?"截图模式：仅隐藏内部归属、新增交易、记录跟进。":"已恢复内部操作按钮。");
  };
  drawCustomerShareCharts(pos,chartTrades,q,primary,realized,unreal);
}

function positionTable(rows,q){
  const visible=rows.filter(p=>Number(p.quantity)>0||Number(p.realized_pnl)!==0);
  return `<table class="dataTable portfolioTable"><thead><tr><th>股票</th><th>市场</th><th>数量</th><th>平均成本</th><th>成本基准</th><th>行情价</th><th>市值</th><th>未实现盈亏</th><th>已实现盈亏</th></tr></thead><tbody>${visible.map(p=>{
    const usable=!q[p.symbol]?.error&&Number.isFinite(Number(q[p.symbol]?.price));
    const last=usable?Number(q[p.symbol].price):null;
    const mv=last==null?null:Number(p.quantity)*last;
    const u=last==null?null:Number(p.quantity)*(last-Number(p.avg_cost));
    const quoteTime=usable&&q[p.symbol]?.lastTradeAt
      ? new Intl.DateTimeFormat("zh-CN",{timeZone:ROMANIA_TZ,hour:"2-digit",minute:"2-digit",hour12:false}).format(new Date(q[p.symbol].lastTradeAt))
      : null;
    return `<tr>
      <td class="symbolCell">${esc(p.symbol)}</td>
      <td>${esc(p.market)}</td>
      <td class="goldData">${num(p.quantity,4)}</td>
      <td>${money(p.avg_cost,p.currency)}</td>
      <td>${money(Number(p.quantity)*Number(p.avg_cost),p.currency)}</td>
      <td>${last==null?"--":money(last,p.currency)+(quoteTime?'<small class="quoteCellTime"> '+esc(quoteTime)+'</small>':"")}</td>
      <td>${mv==null?"--":money(mv,p.currency)}</td>
      <td class="${u==null?"":u>=0?"up":"down"}">${u==null?"--":money(u,p.currency)}</td>
      <td class="${Number(p.realized_pnl)>=0?"up":"down"}">${money(p.realized_pnl,p.currency)}</td>
    </tr>`
  }).join("")}${visible.length?"":'<tr><td colspan="9"><div class="empty">暂无持仓数据</div></td></tr>'}</tbody></table>`
}

function tradeSideTable(rows,side){
  return `<table class="dataTable tradeDetailTable"><thead><tr><th>时间</th><th>股票</th><th>数量</th><th>成交价</th><th>成交金额</th><th>手续费</th></tr></thead><tbody>${rows.map(t=>`<tr>
    <td>${dt(t.traded_at)}</td><td class="symbolCell">${esc(t.symbol)}</td><td>${num(t.quantity,4)}</td><td>${money(t.price,t.currency)}</td><td class="${side==="buy"?"goldData":"up"}">${money(Number(t.quantity)*Number(t.price),t.currency)}</td><td>${money(t.fees,t.currency)}</td>
  </tr>`).join("")}${rows.length?"":`<tr><td colspan="6"><div class="empty">暂无${side==="buy"?"买进":"卖出"}记录</div></td></tr>`}</tbody></table>`
}

function tradeTable(rows){
  return `<table class="dataTable completeTradeTable"><thead><tr><th>时间</th><th>股票</th><th>方向</th><th>数量</th><th>价格</th><th>成交金额</th><th>手续费</th><th>备注</th></tr></thead><tbody>${rows.map(t=>`<tr>
    <td>${dt(t.traded_at)}</td>
    <td class="symbolCell">${esc(t.symbol)}</td>
    <td><span class="sideBadge ${t.side}">${t.side==="buy"?"买进":"卖出"}</span></td>
    <td>${num(t.quantity,4)}</td>
    <td>${money(t.price,t.currency)}</td>
    <td>${money(Number(t.quantity)*Number(t.price),t.currency)}</td>
    <td>${money(t.fees,t.currency)}</td>
    <td>${esc(t.note||"--")}</td>
  </tr>`).join("")}${rows.length?"":'<tr><td colspan="8"><div class="empty">暂无交易记录</div></td></tr>'}</tbody></table>`
}

function drawCustomerCharts(pos,trades,q){
  const h=pos.filter(p=>Number(p.quantity)>0);
  const hEl=$("#customerHoldingsChart");
  if(hEl)state.charts.holdings=new Chart(hEl,{type:"doughnut",data:{labels:h.map(x=>x.symbol),datasets:[{label:"成本结构",data:h.map(x=>Number(x.quantity)*Number(x.avg_cost)),backgroundColor:["#14e76d","#6e7cff","#d5aa51","#2ed3a0","#8b9bad","#8d5ed7"]}]},options:{...chartOpts(),cutout:"65%"}});
  let net=0;const data=trades.map(t=>{net+=t.side==="buy"?(Number(t.price)*Number(t.quantity)+Number(t.fees)):-((Number(t.price)*Number(t.quantity))-Number(t.fees));return{x:new Date(t.traded_at).toLocaleDateString("zh-CN"),y:net}});
  const tEl=$("#customerTradeChart");
  if(tEl)state.charts.trades=new Chart(tEl,{type:"line",data:{labels:data.map(x=>x.x),datasets:[{label:"累计净投入",data:data.map(x=>x.y),borderColor:"#d5aa51",backgroundColor:"rgba(213,170,81,.12)",fill:true,tension:.25}]},options:chartOpts()});
}

function drawCustomerShareCharts(pos,trades,q,primary,realized,unreal){
  const h=pos.filter(p=>Number(p.quantity)>0);
  const hEl=$("#customerHoldingsChart");
  if(hEl)state.charts.holdings=new Chart(hEl,{type:"doughnut",data:{labels:h.map(x=>x.symbol),datasets:[{data:h.map(x=>Number(x.quantity)*Number(x.avg_cost)),backgroundColor:["#14e76d","#5a77ff","#d5aa51","#2ed3a0","#9a68dc","#7e8995"],borderWidth:0}]},options:{...chartOpts(),cutout:"67%",plugins:{...chartOpts().plugins,legend:{display:false}}}});

  const profitEl=$("#customerProfitChart");
  if(profitEl){
    const vals=[Math.abs(Number(realized)||0),Math.abs(Number(unreal)||0)];
    state.charts.profit=new Chart(profitEl,{type:"doughnut",data:{labels:["已实现","未实现"],datasets:[{data:vals.some(v=>v>0)?vals:[1,0],backgroundColor:["#d5aa51","#14e76d"],borderWidth:0}]},options:{...chartOpts(),cutout:"67%",plugins:{...chartOpts().plugins,legend:{display:false}}}});
  }

  const pEl=$("#customerPriceChart"),rEl=$("#customerReturnChart");
  if(!primary||!q[primary.symbol]||q[primary.symbol].error){
    if(pEl)pEl.parentElement.innerHTML='<div class="empty">当前持仓暂无可用价格序列</div>';
    if(rEl)rEl.parentElement.innerHTML='<div class="empty">当前持仓暂无可用收益序列</div>';
    return;
  }
  const quote=q[primary.symbol];
  const pts=(quote.points||[]).filter(p=>p.close!=null);
  const labels=pts.map(p=>new Date(p.t).toLocaleTimeString("zh-CN",{timeZone:ROMANIA_TZ,hour:"2-digit",minute:"2-digit"}));
  const buys=trades.filter(t=>t.symbol===primary.symbol&&t.side==="buy");
  const sells=trades.filter(t=>t.symbol===primary.symbol&&t.side==="sell");
  if(pEl){
    state.charts.customerPrice=new Chart(pEl,{type:"line",data:{labels,datasets:[
      {label:primary.symbol,data:pts.map(p=>p.close),borderColor:"#14e76d",backgroundColor:"rgba(20,231,109,.08)",fill:true,tension:.18,pointRadius:0,pointHoverRadius:4},
      {type:"scatter",label:"买入",data:buys.map(t=>({x:new Date(t.traded_at).toLocaleTimeString("zh-CN",{timeZone:ROMANIA_TZ,hour:"2-digit",minute:"2-digit"}),y:Number(t.price)})),pointRadius:5,pointHoverRadius:7,backgroundColor:"#5a77ff"},
      {type:"scatter",label:"卖出",data:sells.map(t=>({x:new Date(t.traded_at).toLocaleTimeString("zh-CN",{timeZone:ROMANIA_TZ,hour:"2-digit",minute:"2-digit"}),y:Number(t.price)})),pointRadius:5,pointHoverRadius:7,backgroundColor:"#ff626e"}
    ]},options:chartOpts()});
  }
  if(rEl){
    const qty=Number(primary.quantity),avg=Number(primary.avg_cost);
    state.charts.customerReturn=new Chart(rEl,{type:"line",data:{labels,datasets:[{label:"持仓浮动盈亏",data:pts.map(p=>(Number(p.close)-avg)*qty),borderColor:"#d5aa51",backgroundColor:"rgba(213,170,81,.10)",fill:true,tension:.18,pointRadius:0,pointHoverRadius:4}]},options:chartOpts()});
  }
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
  const createButton=state.profile.role==="admin"?'<button class="btn primary" id="newStaff">新建人员账户</button>':"";
  $("#main").innerHTML=`
    <article class="panel modulePanel">
      <div class="panelHead unifiedModuleHead">
        <div><h2>人员账户管理</h2><p>${state.profile.role==="admin"?"管理员可创建一级 / 二级账户；权限由数据库 RLS 强制执行":"查看本人及名下二级人员；权限由数据库 RLS 强制执行"}</p></div>
        <div class="toolbar unifiedActions">${createButton}</div>
      </div>
      <div class="tableWrap moduleContent">
        <table class="dataTable"><thead><tr><th>账号</th><th>姓名</th><th>角色</th><th>上级</th><th>状态</th><th>创建时间</th><th>操作</th></tr></thead><tbody>
        ${rows.map(s=>{const parent=state.staff.find(x=>x.id===s.parent_user_id);return`<tr><td class="link">${esc(s.username)}</td><td>${esc(s.display_name)}</td><td>${roleName(s.role)}</td><td>${esc(parent?.display_name||"--")}</td><td><span class="statusDot ${s.status}"></span>${s.status}</td><td>${dt(s.created_at)}</td><td>${state.profile.role==="admin"&&s.role!=="admin"?`<button class="btn resetPwd" data-id="${s.id}">重置密码</button> <button class="btn danger toggleStaff" data-id="${s.id}" data-status="${s.status==="active"?"disabled":"active"}">${s.status==="active"?"禁用":"启用"}</button>`:"--"}</td></tr>`}).join("")}
        </tbody></table>
      </div>
    </article>`;
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
  $("#main").innerHTML=`
    <article class="panel modulePanel">
      <div class="panelHead unifiedModuleHead">
        <div><h2>交易流水</h2><p>当前权限范围内全部客户买入 / 卖出流水；持仓由此自动计算</p></div>
        <div class="toolbar unifiedActions"><input id="tradeSearch" class="input" placeholder="搜索客户 / 股票"></div>
      </div>
      <div id="tradesTable" class="tableWrap moduleContent"></div>
    </article>`;
  const refresh=()=>{
    const q=$("#tradeSearch").value.toLowerCase();
    const rows=state.trades.filter(t=>!q||[t.symbol,t.stock_name,t.customers?.name,t.customers?.customer_code].some(v=>String(v||"").toLowerCase().includes(q)));
    $("#tradesTable").innerHTML=`<table class="dataTable"><thead><tr><th>时间</th><th>客户</th><th>股票</th><th>市场</th><th>类型</th><th>数量</th><th>价格</th><th>手续费</th></tr></thead><tbody>${rows.map(t=>`<tr><td>${dt(t.traded_at)}</td><td>${esc(t.customers?.name||"--")}</td><td class="link">${esc(t.symbol)}</td><td>${esc(t.market)}</td><td class="${t.side==="buy"?"up":"down"}">${t.side==="buy"?"买入":"卖出"}</td><td>${num(t.quantity,4)}</td><td>${money(t.price,t.currency)}</td><td>${money(t.fees,t.currency)}</td></tr>`).join("")}</tbody></table>`;
  };
  $("#tradeSearch").oninput=refresh;
  refresh();
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
  const rows=state.positions.filter(p=>Number(p.quantity)>0);
  const symbols=[...new Set(rows.map(p=>p.symbol))];
  const q=await fetchQuotes(symbols,{realtimeOnly:false});
  $("#main").innerHTML=`
    <article class="panel modulePanel">
      <div class="panelHead unifiedModuleHead">
        <div><h2>当前持仓明细</h2><p>使用免费公开行情源的最新可用报价，并显示数据更新时间</p></div>
        <div class="toolbar unifiedActions"><button class="btn" id="refreshPositions">刷新持仓</button></div>
      </div>
      <div class="tableWrap moduleContent"><table class="dataTable"><thead><tr><th>客户</th><th>股票</th><th>市场</th><th>数量</th><th>平均成本</th><th>行情价</th><th>更新时间</th><th>市值</th><th>未实现盈亏</th><th>已实现盈亏</th></tr></thead><tbody>${rows.map(p=>{
        const x=q[p.symbol],usable=x&&!x.error&&Number.isFinite(Number(x.price));
        const px=usable?Number(x.price):null,mv=usable?Number(p.quantity)*px:null,u=usable?Number(p.quantity)*(px-Number(p.avg_cost)):null;
        const stamp=usable&&x.lastTradeAt?dt(x.lastTradeAt):"--";
        return`<tr><td>${esc(p.customers?.name||"--")}</td><td class="link">${esc(p.symbol)}</td><td>${esc(p.market)}</td><td>${num(p.quantity,4)}</td><td>${money(p.avg_cost,p.currency)}</td><td>${px==null?"--":money(px,p.currency)}</td><td>${stamp}</td><td>${mv==null?"--":money(mv,p.currency)}</td><td class="${u==null?"":u>=0?"up":"down"}">${u==null?"--":money(u,p.currency)}</td><td class="${Number(p.realized_pnl)>=0?"up":"down"}">${money(p.realized_pnl,p.currency)}</td></tr>`
      }).join("")}</tbody></table></div>
    </article>`;
  $("#refreshPositions").onclick=refreshAll;
}

async function renderMarket(){
  const presetOptions=Object.entries(MARKET_PRESETS).map(([k,v])=>`<option value="${k}" ${k==="RO"?"selected":""}>${v.label}</option>`).join("");
  $("#main").innerHTML=`\n    <section class="grid2 marketUnifiedGrid">
      <article class="panel">
        <div class="panelHead"><div><h2>多国家行情</h2><p>免费公开行情源 · 显示最新报价与罗马尼亚时间</p></div><div class="marketControls"><select id="marketCountry" class="select">${presetOptions}</select><input id="marketSymbols" class="input" value="${MARKET_PRESETS.RO.symbols.join(",")}"></div></div>
        <div class="panelBody"><div class="quoteHeader"><div><span class="link" id="mSymbol">--</span><h3 id="mName">选择股票</h3><p class="muted" id="mExchange">--</p><p class="muted" id="mFresh">--</p></div><div><div id="mPrice" class="quotePrice">--</div><div id="mChange">--</div></div></div></div>
        <div class="chartBox"><canvas id="marketChart"></canvas></div>
      </article>
      <article class="panel">
        <div class="panelHead"><div><h2>股票列表</h2><p>罗马尼亚、美国、法国、德国、英国、意大利、西班牙、荷兰、瑞士、波兰、日本</p></div></div>
        <div class="panelBody marketList" id="marketRows"></div>
      </article>
    </section>`;
  const load=async()=>{
    const syms=$("#marketSymbols").value.split(",").map(x=>x.trim().toUpperCase()).filter(Boolean);
    const q=await fetchQuotes(syms,{realtimeOnly:false});
    const rows=syms.map(s=>q[s]).filter(Boolean);
    $("#marketRows").innerHTML=rows.map(x=>{
      const usable=!x.error&&Number.isFinite(Number(x.price));
      const stamp=usable&&x.lastTradeAt?dt(x.lastTradeAt):"--";
      return `<div class="marketRow marketPick" data-symbol="${x.symbol}"><span class="link">${esc(x.symbol)}</span><span>${esc(x.name||x.symbol)}</span><span>${esc(x.country||"--")}</span><span>${esc(x.exchange||"--")}</span><span>${usable?money(x.price,x.currency||"USD"):"--"}</span><span class="${usable&&Number(x.changePct)>=0?"up":usable?"down":""}">${usable&&x.changePct!=null?((Number(x.changePct)>=0?"+":"")+num(x.changePct)+"%"):"--"}</span><span class="quoteTimeBadge">${esc(stamp)}</span></div>`;
    }).join("")||'<div class="empty">暂无行情数据</div>';
    $$(".marketPick").forEach(r=>r.onclick=()=>drawMarket(q[r.dataset.symbol]));
    const first=rows.find(x=>!x.error&&Number.isFinite(Number(x.price)));
    if(first) drawMarket(first);
    else {
      $("#mSymbol").textContent=syms[0]||"--";
      $("#mName").textContent="当前股票暂无可用行情";
      $("#mExchange").textContent="请更换股票或市场";
      $("#mFresh").textContent="--";
      $("#mPrice").textContent="--";
      $("#mChange").textContent="--";
      if(state.charts.market){state.charts.market.destroy();delete state.charts.market}
    }
  };
  $("#marketCountry").onchange=e=>{$("#marketSymbols").value=MARKET_PRESETS[e.target.value].symbols.join(",");load()};
  $("#marketSymbols").onchange=load;
  await load();
}
function drawMarket(x){
  const usable=x&&!x.error&&Number.isFinite(Number(x.price));
  $("#mSymbol").textContent=x?.symbol||"--";
  $("#mName").textContent=usable?(x.name||x.symbol):"暂无可用行情";
  $("#mExchange").textContent=[x?.country,x?.exchange,x?.currency,x?.source].filter(Boolean).join(" · ");
  $("#mFresh").textContent=usable?"最新数据时间（罗马尼亚）："+dt(x.lastTradeAt||new Date()):"--";
  $("#mPrice").textContent=usable?num(x.price):"--";
  $("#mChange").textContent=usable&&x.changePct!=null?(Number(x.changePct)>=0?"+":"")+num(x.changePct)+"%":"--";
  $("#mChange").className=usable?(Number(x.changePct)>=0?"up":"down"):"";
  if(state.charts.market)state.charts.market.destroy();
  if(!usable)return;
  const pts=(x.points||[]).filter(p=>p.close!=null);
  state.charts.market=new Chart($("#marketChart"),{
    type:"line",
    data:{labels:pts.map(p=>new Date(p.t).toLocaleTimeString("zh-CN",{timeZone:ROMANIA_TZ,hour:"2-digit",minute:"2-digit"})),datasets:[{label:x.symbol+" 行情价",data:pts.map(p=>p.close),borderColor:"#d93447",backgroundColor:"rgba(217,52,71,.14)",fill:true,tension:.22,pointRadius:0,pointHoverRadius:4}]},
    options:chartOpts()
  });
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
  $("#main").classList.add("settingsMain");
  const s=state.appSettings||{};
  $("#main").innerHTML=`
    <section class="grid3 settingsGrid">
      <article class="panel settingsCard"><div class="panelHead"><div><h2>当前账户</h2><p>登录身份</p></div></div><div class="panelBody list settingsList"><div class="listItem"><div class="top"><span>账号</span><span>${esc(state.profile.username)}</span></div></div><div class="listItem"><div class="top"><span>姓名</span><span>${esc(state.profile.display_name)}</span></div></div><div class="listItem"><div class="top"><span>角色</span><span>${roleName(state.profile.role)}</span></div></div><div class="listItem"><div class="top"><span>语言</span><span>${state.lang==="zh"?"中文":state.lang==="en"?"English":"Română"}</span></div></div></div></article>
      <article class="panel settingsCard"><div class="panelHead"><div><h2>交易时段</h2><p>Europe/Bucharest</p></div></div><div class="panelBody list settingsList"><div class="listItem"><div class="top"><span>开盘时间</span><span>${String(s.market_open_time||"09:30").slice(0,5)}</span></div></div><div class="listItem"><div class="top"><span>目标交易时间</span><span>${String(s.target_trade_time||"14:30").slice(0,5)}</span></div></div>${state.profile.role==="admin"?'<button class="btn primary" id="settingsTimeBtn">修改交易时段</button>':""}</div></article>
      <article class="panel settingsCard"><div class="panelHead"><div><h2>行情数据</h2><p>FREE MARKET DATA</p></div></div><div class="panelBody list settingsList"><div class="listItem"><div class="top"><span>覆盖市场</span><span>RO / US / FR / DE / GB / IT / ES / NL / CH / PL / JP</span></div></div><div class="listItem"><div class="top"><span>显示规则</span><span>最新报价 + 罗马尼亚更新时间</span></div></div><div class="listItem"><div class="top"><span>公司信息</span><span>股票名称 / 代码自动搜索</span></div></div></div></article>
    </section>`;
  const b=$("#settingsTimeBtn");if(b)b.onclick=()=>openTimeSettings(featureCtx());
}

function modal(title,html){$("#modalRoot").innerHTML=`<div class="modal"><div class="modalCard"><div class="modalHead"><h2>${esc(tr(title,state.lang))}</h2><button class="close" id="closeModal">×</button></div><div class="modalBody">${html}</div></div></div>`;$("#closeModal").onclick=closeModal;translateUI($("#modalRoot"),state.lang)}
function closeModal(){$("#modalRoot").innerHTML=""}

supabase.auth.onAuthStateChange(async(event,session)=>{if(event==="SIGNED_OUT"){state.session=null;state.profile=null}});
(async()=>{const {data:{session}}=await supabase.auth.getSession();if(session){state.session=session;await loadProfileAndStart()}else renderLogin(await checkBootstrap())})();
