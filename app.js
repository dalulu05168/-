import {publishUIData} from './ui-feedback.js?v=2.3.8';
import {exportPagePNG} from './page-export.js?v=2.3.10';
import {installViewportLayout} from './viewport-layout.js?v=20261018-remediation-17';

import {currencyTotals,monthlyTradeTotals,dailyActivityCounts} from "./dashboard-data.js?v=20261009-brighter";
import {loadCustomerReservations,editCustomerReservation} from "./customer-reservations.js?v=20261018-remediation-17";
const demoMode=new URLSearchParams(location.search).get("demo")==="1";
import { getLang,setLang,localeFor,tr,translateUI,languageOptions,roleLabel,customerStatusLabel,renderShareBoard as renderShareBoardFeature,openTimeSettings,openShareBoardConfig,miniCandlesHTML,miniRSIHTML } from "./ui-features.js?v=20261009-brighter";
import {loadAllocationProjects,attachProjectLauncher,renderProjectPresentation,exitProjectPresentation,editProject} from "./allocation-projects.js?v=20261018-remediation-17";

import {backendConfig,validateBackend} from './backend-config.js';
const desktopBackend=validateBackend(backendConfig);
const SUPABASE_URL=desktopBackend.ready?desktopBackend.url:'';
const SUPABASE_KEY=desktopBackend.ready?desktopBackend.publishableKey:'';
const supabase=demoMode?await(await import('./demo-client.js?v=20261009-brighter')).createDemoClient():desktopBackend.ready?(await import('./vendor-supabase.js')).createClient(SUPABASE_URL,SUPABASE_KEY):null;

const ROMANIA_TZ = "Europe/Bucharest";
// Share one header legend placement across chart panels, outside the plot area.
Chart.register({id:"sharedHeaderLegend",beforeInit(chart){
 if(chart.options.plugins?.legend?.display===false)return;
 const head=chart.canvas.closest('.panel,.projectPanel')?.querySelector('.panelHead,.projectPanelHeading');
 if(!head)return;
 chart.options.plugins.legend.display=false;
 if(head.querySelector('.inlineLegend,.headerChartLegend,.projectTrendLegend'))return;
 const legend=document.createElement('span');legend.className='headerChartLegend';head.append(legend);chart.headerLegendElement=legend;
},afterUpdate(chart){
 const legend=chart.headerLegendElement;if(!legend)return;legend.replaceChildren();
 for(const dataset of chart.data.datasets){if(!dataset.label)continue;const item=document.createElement('span'),swatch=document.createElement('i');const color=dataset.borderColor||dataset.backgroundColor;swatch.style.background=typeof color==='string'?color:'#8eafd0';item.append(swatch,document.createTextNode(dataset.label));legend.append(item);}
},afterDestroy(chart){chart.headerLegendElement?.remove();}});
const MARKET_PRESETS = {
  RO:{label:"罗马尼亚",symbols:["BRD.RO","TLV.RO","SNP.RO","SNG.RO","SNN.RO","H2O.RO","BVB.RO"]},
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
  lang:getLang(), appSettings:null, shareBoard:null, shareSlots:[], allocationClockTimer:null,
  allocationProjects:[],allocationRecords:[],allocationOwnerId:null,activeProjectNumber:1,projectLoadError:null,
  marketRefreshTimer:null, positionRefreshTimer:null, customerMarketTimer:null, shareBoardRefreshTimer:null,
  systemHealth:"loading"
};

let romaniaClockTimer=null;

const $ = (s,root=document)=>root.querySelector(s);
const $$ = (s,root=document)=>[...root.querySelectorAll(s)];
const esc = (v="") => String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const money = (n,c="USD") => new Intl.NumberFormat(localeFor(state.lang),{style:"currency",currencyDisplay:"code",currency:c||"USD",maximumFractionDigits:2}).format(Number(n||0));
const num = (n,d=2)=>Number(n||0).toLocaleString(localeFor(state.lang),{maximumFractionDigits:d});
const dt = (v)=>v?new Date(v).toLocaleString(localeFor(state.lang),{timeZone:ROMANIA_TZ,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false}):"--";
const romaniaDateFormatter=new Intl.DateTimeFormat("en-CA",{timeZone:ROMANIA_TZ,year:"numeric",month:"2-digit",day:"2-digit"});
const romaniaDateKey = (v=new Date()) => romaniaDateFormatter.format(new Date(v));
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
function romaniaInputNow(timestamp=Date.now()){
  const p=new Intl.DateTimeFormat("en-CA",{timeZone:ROMANIA_TZ,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(new Date(timestamp));
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
  const tick=()=>{
    const value=romaniaClockText();
    $$(".romaniaClock,[data-romania-clock]").forEach(el=>el.textContent=value);
  };
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
    ctx.strokeStyle="rgba(142,175,208,.65)";
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
  Chart.defaults.font.family="Segoe UI, Microsoft YaHei, Arial, sans-serif";
  Chart.defaults.color="#c9cdd4";
  Chart.defaults.elements.arc.borderWidth=0;
  Chart.defaults.devicePixelRatio=Math.min(Math.max(window.devicePixelRatio||1,1),2);
  Chart.defaults.animation.duration=180;
  Chart.defaults.interaction.mode="nearest";
  Chart.defaults.interaction.intersect=false;
  Chart.defaults.plugins.tooltip.enabled=true;
}

function localizeMessage(msg){
  const raw=String(msg??"");
  const exact=tr(raw,state.lang);
  if(exact!==raw)return exact;
  const colon=raw.indexOf("：");
  if(colon>0){
    const head=raw.slice(0,colon);
    const translated=tr(head,state.lang);
    if(translated!==head)return translated+":"+raw.slice(colon+1);
  }
  return raw;
}
function toast(msg,error=false){
  let t=$("#toast"); if(!t){t=document.createElement("div");t.id="toast";document.body.appendChild(t)}
  t.className="toast"+(error?" error":""); t.textContent=localizeMessage(msg); clearTimeout(t._x); t._x=setTimeout(()=>t.remove(),3200)
}

function roleName(r){return roleLabel(r,state.lang)}
function customerStatus(s){return customerStatusLabel(s,state.lang)}
function canPersonnel(){return state.profile?.role==="admin"}

async function checkBootstrap(){
  if(demoMode)return true;
  try{
    const r=await fetch(SUPABASE_URL+"/functions/v1/bootstrap-status",{headers:{"apikey":SUPABASE_KEY},signal:AbortSignal.timeout(15000)});
    const j=await r.json();
    if(!r.ok) throw new Error(j.error||"读取失败");
    return !!j.initialized;
  }catch(err){
    toast("网络连接失败，请检查网络后重试登录",true);
    return true;
  }
}

function renderLogin(initialized){
  $("#root").innerHTML=`
    <section class="loginPage" aria-label="Ellery Westcott 系统登录">
      <div class="loginHero">
        <div class="heroMark"><span class="brandLogoFrame"><img class="brandLogo" src="/assets/ellery-westcott-transparent.png?v=1" alt="Ellery Westcott · Capital Markets"><img class="brandLettering" src="/assets/ellery-westcott-transparent.png?v=1" alt="" aria-hidden="true"></span></div>
        <div class="heroRule" aria-hidden="true"></div>
        <div class="loginEyebrow">PRIVATE CLIENT WORKSPACE · 私人客户工作台</div>
        <h1>客户管理<br>清晰而有序</h1>
        <p>Ellery Westcott 专属管理工作台。客户档案、持仓、交易记录及项目进度，在同一个入口安全访问。</p>
        <div class="loginHeroModules" aria-label="系统业务模块"><span>客户管理</span><span>持仓与交易</span><span>项目预留份额</span></div>
      </div>
      <div class="loginSide">
        <div class="loginCard">
          <div class="loginCardKicker"><span class="loginCardStatus" aria-hidden="true"></span> SECURE ACCESS</div>
          <h2>${initialized?"欢迎回来":"初始化管理员"}</h2>
          <p class="loginCardDescription">${initialized?"请使用已获授权的 CRM 账号登录":"首次启用时，请创建系统管理员账号。"}</p>
          <form class="loginFields" id="${initialized?"loginForm":"bootstrapForm"}">
            ${initialized?"":`<div class="field loginField"><label for="loginDisplayName">管理员姓名</label><input id="loginDisplayName" class="input" name="display_name" autocomplete="name" required></div>`}
            <div class="field loginField"><label for="loginUsername">登录账号</label><input id="loginUsername" class="input" name="username" autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="请输入账号名称" required><small>无需输入邮箱后缀</small></div>
            <div class="field loginField"><label for="loginPassword">登录密码</label><div class="loginPasswordWrap"><input id="loginPassword" class="input" type="password" name="password" autocomplete="${initialized?"current-password":"new-password"}" placeholder="请输入登录密码" required><button type="button" class="loginPasswordToggle" aria-label="显示密码" aria-pressed="false">显示</button></div></div>
            ${initialized?"":`<div class="field loginField"><label for="loginBootstrapCode">一次性初始化码</label><input id="loginBootstrapCode" class="input" type="password" name="bootstrap_code" autocomplete="off" required></div>`}
            <div id="loginError" class="loginError" role="alert" hidden></div>
            <button class="btn primary loginSubmit" type="submit">${initialized?"登录工作台":"创建管理员并进入系统"} <span aria-hidden="true">↗</span></button>
          </form>
          <div class="loginUtilities">
          <div class="loginLangRow"><label for="loginLang">界面语言</label><select id="loginLang" class="select">${languageOptions(state.lang)}</select></div>
          <div class="loginClockRow"><span>罗马尼亚时间</span><span class="romaniaClock" id="romaniaClock"></span></div>
          </div>
          <div class="loginFoot"><span aria-hidden="true">●</span> 独立系统 · 数据独立保存</div>
        </div>
      </div>
    </section>`;
  const form=$("#"+(initialized?"loginForm":"bootstrapForm"));
  const toggle=form.querySelector(".loginPasswordToggle");
  const passwordField=form.querySelector('input[name="password"]');
  if(toggle&&passwordField)toggle.onclick=()=>{const visible=passwordField.type==="password";passwordField.type=visible?"text":"password";toggle.textContent=visible?"隐藏":"显示";toggle.setAttribute("aria-pressed",String(visible));toggle.setAttribute("aria-label",visible?"隐藏密码":"显示密码");};
  form.addEventListener("submit",initialized?login:bootstrap);
  $("#loginLang").onchange=e=>{state.lang=setLang(e.target.value);renderLogin(initialized)};
  translateUI($("#root"),state.lang);
  startRomaniaClock();
}

async function bootstrap(e){
  e.preventDefault(); const f=new FormData(e.currentTarget);
  const body=Object.fromEntries(f.entries());
  const btn=e.currentTarget.querySelector('button[type="submit"]');btn.disabled=true;btn.textContent="正在初始化…";
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
  const btn=e.currentTarget.querySelector('button[type="submit"]');
  const errorBox=e.currentTarget.querySelector("#loginError");
  if(errorBox){errorBox.hidden=true;errorBox.textContent="";}
  btn.disabled=true;btn.textContent="正在验证…";
  try{
    const {data,error}=await supabase.auth.signInWithPassword({email:username+"@ellery-desktop.invalid",password});
    if(error)throw error;
    state.session=data.session;
    await loadProfileAndStart();
  }catch(err){
    const message="登录失败："+(err?.message||"请检查账号或网络连接");
    if(errorBox){errorBox.textContent=message;errorBox.hidden=false;}
    toast(message,true);
    btn.disabled=false;btn.innerHTML='登录工作台 <span aria-hidden="true">↗</span>';
  }
}

async function loadProfileAndStart(){
  const {data:{session}}=await supabase.auth.getSession();
  if(!session){renderLogin(await checkBootstrap());return}
  state.session=session;
  const {data,error}=await supabase.from("profiles").select("*").eq("id",session.user.id).single();
  if(error||!data||data.status!=="active"||!["admin","level2"].includes(data.role)){
    await supabase.auth.signOut();toast("账户未启用或无系统权限",true);renderLogin(true);return;
  }
  if(state.profile?.id!==data.id){state.allocationOwnerId=data.id;state.allocationProjects=[];state.allocationRecords=[];}
  state.profile=data;
  if((state.activeView==="personnel"&&!canPersonnel()))state.activeView="dashboard";
  const projectRoute=location.hash.match(/^#allocation\/([123])$/);
  if(projectRoute){state.activeProjectNumber=Number(projectRoute[1]);state.activeView="shareboard";}
  renderShell();
  await refreshAll();
}

function renderShell(){
  // Labels remain visible on desktop; the theme adapts navigation on smaller screens.
  document.body.classList.add("navigationCompact");
  const iconPaths={dashboard:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',customers:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M16 3a4 4 0 0 1 0 8 M22 21v-2a4 4 0 0 0-3-3.87 M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',personnel:'M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11 M9 12l2 2 4-4',trades:'M3 7h17 M16 3l4 4-4 4 M21 17H4 M8 13l-4 4 4 4',positions:'M4 21V10h4v11 M10 21V3h4v18 M16 21V7h4v14',market:'M3 3v18h18 M6 15l4-5 4 3 6-8',reports:'M6 3h9l4 4v14H6z M14 3v5h5 M9 12h7 M9 16h7',shareboard:'M12 2l10 6-10 6L2 8z M2 12l10 6 10-6 M2 16l10 6 10-6',settings:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1z'};
  const navigationIcons=Object.fromEntries(Object.entries(iconPaths).map(([id,d])=>[id,`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`]));
  document.body.classList.remove("navigationHidden");
  const items=[
    ["dashboard","总览大盘"],["customers","客户中心"],["personnel","人员中心"],["trades","交易记录"],
    ["positions","持仓中心"],["market","行情中心"],["reports","统计报表"],
    ["shareboard","项目预留份额"],["settings","系统设置"]
  ].filter(x=>x[0]!=="personnel"||canPersonnel());
  $("#root").innerHTML=`
    <div class="app"><div class="shell studioShell">
      <header class="topbar studioTopbar"><div class="studioBreadcrumb"><span>工作台</span><span aria-hidden="true">/</span><strong id="appBreadcrumb">业务总览</strong></div>
        <div class="brand"><span class="brandLogoFrame"><img class="brandLogo" src="/assets/ellery-westcott-transparent.png?v=1" alt="Ellery Westcott · Capital Markets"><img class="brandLettering" src="/assets/ellery-westcott-transparent.png?v=1" alt="" aria-hidden="true"></span></div>
        <div class="navFrame" id="sideNavigation"><div class="sidebarIdentity"><span class="brandLogoFrame"><img src="/assets/ellery-westcott-transparent.png?v=1" alt="Ellery Westcott Capital Markets"><img class="brandLettering" src="/assets/ellery-westcott-transparent.png?v=1" alt="" aria-hidden="true"></span></div><div class="sidebarSection">工作空间</div><nav class="nav">${items.map(([id,label])=>`<button data-view="${id}" class="${id===state.activeView?"active":""}" title="${tr(label,state.lang)}" aria-label="${tr(label,state.lang)}"><span class="navGlyph" aria-hidden="true">${navigationIcons[id]||"•"}</span><span class="navLabel">${tr(label,state.lang)}</span></button>`).join("")}</nav><div class="studioSidebarFoot"><span class="studioSidebarRole">${roleName(state.profile.role)}工作台</span><span class="romaniaClock" id="romaniaClock"></span><small>EUROPE / BUCHAREST</small></div></div>
        <div id="pageActionsSlot" class="studioPageActions"></div><form id="globalSearchForm" class="globalSearch" role="search"><span aria-hidden="true">⌕</span><input id="globalSearchInput" type="search" autocomplete="off" placeholder="搜索客户、项目或股票…" aria-label="搜索客户、项目或股票"><button type="submit" aria-label="搜索">↵</button></form><div class="userArea"><button id="projectCaptureButton" class="btn projectCaptureControl" aria-label="${tr("截图模式",state.lang)}">${tr("截图模式",state.lang)}</button><span class="sysok ${state.systemHealth==="error"?"syserror":""}" id="systemHealth">${state.systemHealth==="ok"?"":tr(state.systemHealth==="error"?"数据异常":"连接中",state.lang)}</span><select id="globalLang" class="langSwitch">${languageOptions(state.lang)}</select><button class="chip" id="editAccountName" title="修改账号名称"><span class="studioAvatar" aria-hidden="true">${esc(String(state.profile.display_name||"U").slice(0,1))}</span><span class="studioUserName">${esc(state.profile.display_name)}</span></button><button id="logoutBtn" class="iconBtn">${tr("退出",state.lang)}</button></div>
      </header>
      ${demoMode?'<div class="previewNotice" role="status">隔离验收预览 · 全部数据为模拟数据 · 不连接生产写入</div>':''}<main id="main" data-view="${state.activeView}"></main>
    </div></div>
    <div id="modalRoot"></div>
  `;
  $$(".nav button").forEach(b=>b.onclick=()=>switchView(b.dataset.view));
  $("#globalSearchForm").onsubmit=async event=>{
    event.preventDefault();
    const query=$("#globalSearchInput").value.trim();
    if(!query)return;
    const lower=query.toLowerCase();
    const customer=state.customers.find(row=>[row.name,row.customer_code,row.phone].some(x=>String(x||"").toLowerCase().includes(lower)));
    if(customer){
      await switchView("customers");
      const field=$("#customerSearch");
      if(field){field.value=query;field.dispatchEvent(new Event("input",{bubbles:true}));}
      return;
    }
    const ownerId=state.allocationOwnerId||state.profile.id;
    const project=state.allocationProjects.find(row=>row.owner_user_id===ownerId&&[row.name,row.symbol].some(x=>String(x||"").toLowerCase().includes(lower)));
    if(project){state.activeProjectNumber=project.project_number;await switchView("shareboard");return;}
    if(!/^[A-Za-z][A-Za-z0-9.\\-]{0,19}$/.test(query)){
      await switchView("customers");
      const field=$("#customerSearch");
      if(field){field.value=query;field.dispatchEvent(new Event("input",{bubbles:true}));}
      return;
    }
    await switchView("market");
    const field=$("#marketSymbols");
    if(field){field.value=query.toUpperCase();field.dispatchEvent(new Event("change",{bubbles:true}));}
  };
  $("#editAccountName").onclick=openAccountNameForm;
  $("#globalLang").onchange=async e=>{state.lang=setLang(e.target.value);renderShell();await switchView(state.activeView)};
  $("#logoutBtn").onclick=async()=>{exitProjectPresentation(featureCtx());clearMarketRefreshTimers();await supabase.auth.signOut();state.profile=null;state.session=null;state.allocationProjects=[];state.allocationRecords=[];state.allocationOwnerId=null;state.activeCustomer=null;state.activeView="dashboard";renderLogin(true)};
  translateUI($("#root"),state.lang);
  startRomaniaClock();
}

let viewSwitchToken=0;
let viewRenderQueue=Promise.resolve();

async function switchView(view){
  if(!view)return;
  if($("#clientSharePage"))closeModal(true);
  const token=++viewSwitchToken;
  const main=$("#main");
  if(main){
    main.classList.remove("viewReveal");
    void main.offsetWidth;
    main.classList.add("viewLeaving");
    if(!matchMedia("(prefers-reduced-motion: reduce)").matches)await new Promise(r=>setTimeout(r,200));
  }
  // Serialize asynchronous renderers so an older response cannot replace the latest page.
  const task=async()=>{
    if(token!==viewSwitchToken)return;
    state.activeView=view;
    const projectHash=view==="shareboard"?"#allocation/"+(state.activeProjectNumber||1):"";
    if((view==="shareboard"||location.hash.startsWith("#allocation/"))&&location.hash!==projectHash)history.pushState(null,"",location.pathname+location.search+projectHash);
    $$(".nav button").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
    await renderView(token);
  };
  viewRenderQueue=viewRenderQueue.then(task,task);
  await viewRenderQueue;
}

async function fetchPagedRows(makeQuery,{pageSize=1000,maxPages=25}={}){
  const rows=[];
  for(let page=0;page<maxPages;page++){
    const from=page*pageSize,to=from+pageSize-1;
    const res=await makeQuery(from,to);
    if(res.error)return {data:rows,error:res.error};
    const batch=res.data||[];
    rows.push(...batch);
    if(batch.length<pageSize)return {data:rows,error:null};
  }
  return {data:rows,error:null,truncated:true};
}

async function refreshAll(){
  publishUIData("business",{status:"loading"});
  try{
  const q=[
    fetchPagedRows((from,to)=>supabase.from("customers").select("*").order("created_at",{ascending:false}).range(from,to)),
    fetchPagedRows((from,to)=>supabase.from("trades").select("*,customers(name,customer_code)").order("traded_at",{ascending:false}).range(from,to)),
    fetchPagedRows((from,to)=>supabase.from("positions").select("*,customers(name,customer_code,owner_user_id,level_one_user_id)").order("updated_at",{ascending:false}).range(from,to)),
    fetchPagedRows((from,to)=>supabase.from("customer_followups").select("*,customers(name,customer_code)").order("created_at",{ascending:false}).range(from,to)),
    fetchPagedRows((from,to)=>supabase.from("profiles").select("*").order("created_at",{ascending:true}).range(from,to)),
    supabase.from("app_settings").select("*").eq("id",1).maybeSingle(),
    state.profile?.role==="admin"?supabase.from("share_boards").select("*").order("board_date",{ascending:false}).order("updated_at",{ascending:false}).limit(1).maybeSingle():Promise.resolve({data:null,error:null})
  ];
  const [c,t,p,f,s,settings,board]=await Promise.all(q);
  const loadError=[c,t,p,f,s,settings,board].find(x=>x?.error)?.error;
  state.systemHealth=loadError?"error":"ok";
  publishUIData("business",{status:loadError?"error":"ok"});
  const health=$("#systemHealth");
  if(health){
    health.textContent=loadError?tr("数据异常",state.lang):"";health.setAttribute("aria-label",tr(loadError?"数据异常":"系统正常",state.lang));
    health.classList.toggle("syserror",!!loadError);
  }
  if(loadError)toast("数据读取失败："+loadError.message,true);
  if([c,t,p,f,s].some(x=>x?.truncated))toast("数据量已超过当前单次加载上限，请使用筛选缩小范围。",true);
  state.customers=c.data||[];
  state.trades=t.data||[];
  state.positions=p.data||[];
  state.followups=f.data||[];
  state.staff=s.data||[];
  state.appSettings=settings.data||state.appSettings||null;
  state.shareBoard=board.data||null;
  if(state.shareBoard?.id){
    const slots=await fetchPagedRows((from,to)=>supabase.from("share_board_slots").select("*").eq("board_id",state.shareBoard.id).order("slot_at",{ascending:true}).range(from,to));
    if(slots.error)toast("数据读取失败："+slots.error.message,true);
    state.shareSlots=slots.data||[];
  }else state.shareSlots=[];
  await loadAllocationProjects(featureCtx());
  await loadCustomerReservations(featureCtx());
  if(state.customerReservationError)publishUIData("projects",{status:"error"});
  await renderView(0);
  }catch(error){publishUIData("business",{status:"error"});throw error;}
}

function featureCtx(){
  return {state,supabase,$,$$,esc,num,money,dt,romaniaClockText,romaniaDateKey,romaniaInputNow,romaniaLocalToISO,ROMANIA_TZ,fetchQuotes,chartOpts,toast,modal,closeModal,switchView,refreshAll,fetchPagedRows};
}
function clearMarketRefreshTimers(){
  for(const k of ["marketRefreshTimer","positionRefreshTimer","customerMarketTimer","shareBoardRefreshTimer"]){if(state[k]){clearInterval(state[k]);state[k]=null}}
  if(state.allocationClockTimer){clearInterval(state.allocationClockTimer);state.allocationClockTimer=null}
}
async function renderView(token=0){
  clearMarketRefreshTimers();
  $$(".exportStatus").forEach(el=>el.remove());
  if(state.projectResizeObserver){state.projectResizeObserver.disconnect();state.projectResizeObserver=null;}
  if(state.activeView!=="shareboard")exitProjectPresentation(featureCtx());
  Object.values(state.charts).forEach(x=>{try{x.destroy()}catch{}});
  state.charts={};
  const main=$("#main");
  if(!main)return;
  $("#pageActionsSlot")?.replaceChildren();
  main.className="viewBusy";
  main.dataset.view=state.activeView;
  const captureButton=$("#projectCaptureButton");if(captureButton)captureButton.style.setProperty("display",state.activeView==="shareboard"?"inline-flex":"none","important");
  const crumb=$("#appBreadcrumb");if(crumb)crumb.textContent=tr(({dashboard:"业务总览",customers:"客户中心",personnel:"人员中心",trades:"交易记录",positions:"持仓中心",market:"行情中心",reports:"统计报表",shareboard:"项目预留份额",settings:"系统设置"})[state.activeView]||"业务总览",state.lang);
  const accountSlot=$("#dashboardAccountSlot");if(accountSlot){accountSlot.replaceChildren();accountSlot.hidden=true;}
  const renderer={
    dashboard:renderDashboard,
    customers:renderCustomers,
    personnel:renderPersonnel,
    trades:renderTrades,
    positions:renderPositions,
    market:renderMarket,
    reports:renderReports,
    shareboard:()=>renderProjectPresentation(featureCtx()),
    settings:renderSettings
  }[state.activeView]||renderDashboard;

  try{
    await renderer();
    if(state.activeView==="dashboard")attachProjectLauncher(featureCtx());
    const actions=main.querySelector(".studioHeadingActions, .unifiedActions, .marketControls");
    if(actions&&$("#pageActionsSlot"))$("#pageActionsSlot").append(actions);
    translateUI(main,state.lang);
    if($("#pageActionsSlot"))translateUI($("#pageActionsSlot"),state.lang);
  }catch(err){
    console.error("renderView failed",state.activeView,err);
    main.innerHTML='<div class="empty" style="padding:40px">页面加载失败，请点击顶部导航重新进入。</div>';
    toast("页面加载异常："+(err?.message||"未知错误"),true);
  }finally{
    if(token!==0 && token!==viewSwitchToken)return;
    main.classList.remove("viewBusy","viewLeaving","viewEntering");
    main.classList.add("viewReveal");
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      for(const chart of Object.values(state.charts)){if(chart.canvas?.isConnected){chart.resize();chart.update("none")}}
      window.dispatchEvent(new Event("crm-layout"));
    }));
  }
}

function pageHead(title,sub,actions=""){
  return actions ? `<div class="pageActions"><div class="actions">${actions}</div></div>` : "";
}


function formattedTotals(rows,value){return currencyTotals(rows,value).map(([c,n])=>money(n,c)).join(" / ")||"—";}

function renderLevel2Dashboard(){
  $("#main").classList.add("dashboardViewport");
  const customers=state.customers;
  const openPositions=state.positions.filter(p=>Number(p.quantity)>0);
  const buys=state.trades.filter(t=>t.side==="buy");
  const sells=state.trades.filter(t=>t.side==="sell");
  const holdingCustomerIds=new Set(openPositions.map(p=>p.customer_id));
  const realized=state.positions.reduce((sum,p)=>sum+Number(p.realized_pnl||0),0);
  const costBasis=currencyTotals(openPositions,p=>Number(p.quantity)*Number(p.avg_cost)).map(([c,n])=>money(n,c)).join(" / ");
  const realizedByCurrency=currencyTotals(state.positions,p=>Number(p.realized_pnl||0)).map(([c,n])=>money(n,c)).join(" / ");
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
          <div class="panelHead compact"><div><h2>客户持仓总览</h2></div><span class="headMeta">${openPositions.length} POSITIONS</span></div>
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
            <div class="panelHead compact"><div><h2>买卖结构</h2><div class="panelSubtitleRow"><span class="inlineLegend up">买进 · ${buys.length}</span><span class="inlineLegend down">卖出 · ${sells.length}</span></div></div></div>
            <div class="chartBox level2Chart"><canvas id="level2SideChart"></canvas></div>
          </article>
          <article class="panel level2PnlPanel">
            <div class="panelHead compact"><div><h2>账户业务汇总</h2></div></div>
            <div class="level2SummaryList">
              <div><span>持仓成本基准</span><span>${costBasis||"—"}</span></div>
              <div><span>已实现盈亏</span><span class="${realized>=0?"up":"down"}">${formattedTotals(state.positions,p=>Number(p.realized_pnl||0))}</span></div>
              <div><span>客户总数</span><span>${customers.length}</span></div>
              <div><span>交易总数</span><span>${state.trades.length}</span></div>
            </div>
          </article>
        </div>
      </div>

      <article class="panel level2OrdersPanel">
        <div class="panelHead compact"><div><h2>最近买进 / 卖出明细</h2></div><span class="headMeta">${recentTrades.length} RECENT</span></div>
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
    data:{labels:[tr("买进",state.lang),tr("卖出",state.lang)],datasets:[{data:[buys.length,sells.length],backgroundColor:["#00d59b","#ef3456"],borderColor:["#00d59b","#ef3456"],borderWidth:1}]},
    options:{responsive:true,maintainAspectRatio:false,animation:false,cutout:"70%",plugins:{...chartOpts().plugins,legend:{display:false}}}
  });
}

async function renderDashboard(){
  $("#main").classList.add("studioDashboard");
  const openPositions=state.positions.filter(p=>Number(p.quantity)>0);
  const recentTrades=state.trades.slice(0,4);
  const todayTrades=state.trades.filter(t=>isRomaniaToday(t.traded_at)).length;
  const scheduled=state.followups.filter(f=>f.next_followup_at).sort((a,b)=>new Date(a.next_followup_at)-new Date(b.next_followup_at));
  const due=scheduled.filter(f=>new Date(f.next_followup_at)<=new Date());
  const metrics=[["客户总数",state.customers.length,"当前权限内的客户档案","customers"],["当前持仓",openPositions.length,"客户 × 持仓标的","positions"],["今日交易",todayTrades,"罗马尼亚当地日期","trades"],["待跟进",due.length,"已到期的客户跟进","customers"]];
  $("#main").innerHTML=`
    <div class="studioPageHeading"><div><div class="studioEyebrow">WORKSPACE OVERVIEW</div><h1>业务总览</h1><p>客户、持仓与业务进展，清晰呈现。</p></div><div class="studioHeadingActions"><div id="dashboardAccountSlot" hidden></div><button class="btn" id="terminalRefresh" aria-label="刷新业务数据">刷新数据</button><button class="btn primary" id="terminalNewCustomer"><span aria-hidden="true">＋</span> 新增客户</button></div></div>
    <section class="studioMetrics" aria-label="业务关键指标">${metrics.map(([label,value,detail,view],i)=>`<button class="studioMetric" data-studio-view="${view}"><span class="studioMetricTop"><span>${label}</span><span class="studioMetricIndex">0${i+1}</span></span><strong>${num(value,0)}</strong><span class="studioMetricBottom">${detail}<span aria-hidden="true">↗</span></span></button>`).join("")}</section>
    <div class="studioAnalytics">
      <article class="panel studioTrend"><div class="panelHead"><div><h2>业务趋势</h2><p>新增客户与交易笔数</p></div><div class="studioIntervals"><button data-days="7">近 7 日</button><button data-days="30" class="active">近 30 日</button><button data-days="90">近 90 日</button></div></div><div class="studioChartLegend"><span><i></i>新增客户</span><span><i></i>交易记录</span></div><div class="studioChart"><canvas id="trendChart" aria-label="新增客户与交易笔数趋势" role="img"></canvas></div></article>
      <article class="panel studioFollowups"><div class="panelHead"><div><h2>跟进日程</h2><p>${due.length} 项已到期</p></div><span class="studioCount">${scheduled.length}</span></div><div class="studioTaskList">${scheduled.slice(0,4).map(f=>`<button class="studioTask customerLink" data-id="${f.customer_id}"><span class="studioTaskDot ${new Date(f.next_followup_at)<=new Date()?"isDue":""}"></span><span><strong>${esc(f.customers?.name||state.customers.find(c=>String(c.id)===String(f.customer_id))?.name||"客户跟进")}</strong><small>${esc(f.content||f.notes||f.note||"查看客户跟进记录")}</small></span><time>${dt(f.next_followup_at)}</time></button>`).join("")||'<div class="studioQuiet"><span aria-hidden="true">✓</span><strong>暂无待办跟进</strong><p>在客户档案中添加下次跟进时间</p></div>'}</div><button class="studioPanelLink" data-studio-view="customers">前往客户中心 <span aria-hidden="true">→</span></button></article>
    </div>
    <article class="panel studioRecent"><div class="panelHead"><div><h2>近期交易</h2><p>最近 ${recentTrades.length} 笔交易 · 金额按原币种显示</p></div><button class="studioTextButton" data-studio-view="trades">全部交易 <span aria-hidden="true">↗</span></button></div><div class="tableWrap"><table class="dataTable studioTrades"><thead><tr><th>交易时间</th><th>客户</th><th>股票代码</th><th>方向</th><th class="numeric">数量</th><th class="numeric">成交价</th><th class="numeric">成交金额</th></tr></thead><tbody>${recentTrades.map(t=>`<tr><td class="studioDate">${dt(t.traded_at)}</td><td><button class="customerLink studioCustomer" data-id="${t.customer_id}">${esc(t.customers?.name||"--")}</button></td><td><span class="studioSymbol">${esc(t.symbol)}</span></td><td><span class="sideBadge ${t.side}">${t.side==="buy"?"买入":"卖出"}</span></td><td class="numeric">${num(t.quantity,4)}</td><td class="numeric">${money(t.price,t.currency)}</td><td class="numeric">${money(Number(t.quantity)*Number(t.price),t.currency)}</td></tr>`).join("")||'<tr><td colspan="7"><div class="empty">暂无交易记录</div></td></tr>'}</tbody></table></div></article>
    <section class="studioBottomGrid"><article class="panel studioCost"><div class="panelHead"><div><h2>持仓成本基准</h2><p>按币种独立统计</p></div><button class="studioTextButton" data-studio-view="positions">查看持仓 ↗</button></div><div class="studioCostValue">${formattedTotals(openPositions,p=>Number(p.quantity)*Number(p.avg_cost))||"—"}</div></article><div class="studioProjects" id="studioProjects"></div></section>`;
  drawDashboardCharts(30);
  $$("[data-studio-view]").forEach(b=>b.onclick=()=>switchView(b.dataset.studioView));
  $$(".studioIntervals [data-days]").forEach(b=>b.onclick=()=>{$$(".studioIntervals button").forEach(x=>x.classList.toggle("active",x===b));drawDashboardCharts(Number(b.dataset.days));});
  $("#terminalNewCustomer").onclick=openCustomerForm;
  $("#terminalRefresh").onclick=async()=>{toast("正在刷新数据");await refreshAll()};
  bindCustomerLinks();
}

function drawDashboardCharts(days=14){
  const count=Math.max(1,Math.min(365,Number(days)||14));
  const keys=romaniaDayKeys(count);
  const labels=keys.map(k=>k.slice(5).replace("-","/"));
  const counts=dailyActivityCounts(state.customers,state.trades,keys,ROMANIA_TZ);
  const newC=counts.customers,tradeC=counts.trades;
  if(state.charts.trend){try{state.charts.trend.destroy()}catch{};delete state.charts.trend}
  const trendEl=$("#trendChart");
  if(trendEl){
    state.charts.trend=new Chart(trendEl,{type:"line",data:{labels,datasets:[
      {label:tr("新增客户数",state.lang),data:newC,borderColor:"#86b9f1",backgroundColor:"rgba(103,160,225,.12)",tension:.32,fill:true,pointRadius:0,pointHoverRadius:4},
      {label:tr("交易记录",state.lang),data:tradeC,borderColor:"#6e8ba7",backgroundColor:"rgba(110,124,255,.05)",tension:.32,pointRadius:0,pointHoverRadius:4}
    ]},options:{...chartOpts(),scales:{...chartOpts().scales,y:{...chartOpts().scales.y,beginAtZero:true,min:0,suggestedMax:Math.max(1,...newC,...tradeC),ticks:{...chartOpts().scales.y.ticks,precision:0}}},plugins:{...chartOpts().plugins,legend:{display:false}}}});
  }
  const statusEl=$("#statusChart");
  if(statusEl){
    const statusKeys=["prospect","following","holding","closed","archived"];
    state.charts.status=new Chart(statusEl,{type:"doughnut",data:{labels:statusKeys.map(customerStatus),datasets:[{data:statusKeys.map(k=>state.customers.filter(x=>x.status===k).length),backgroundColor:["#6e8ba7","#8eafd0","#00d59b","#8b9bad","#d93447"]}]},options:{...chartOpts(),cutout:"68%"}});
  }
}
function chartOpts(){return{
  responsive:true,maintainAspectRatio:false,
  layout:{padding:8},
  interaction:{mode:"index",intersect:false},
  hover:{mode:"index",intersect:false},
  plugins:{
    legend:{position:"top",align:"end",labels:{color:"#c9cdd4",font:{size:12,weight:"normal"},boxWidth:12,boxHeight:4,padding:8}},
    tooltip:{enabled:true,mode:"index",intersect:false,backgroundColor:"#252524",borderColor:"#53595f",borderWidth:1,titleFont:{weight:"normal"},bodyFont:{weight:"normal"}}
  },
  scales:{x:{ticks:{color:"#c9cdd4",font:{weight:"normal",size:12},maxTicksLimit:7,maxRotation:0,autoSkip:true},grid:{color:"rgba(141,174,210,.12)"}},y:{ticks:{color:"#c9cdd4",font:{weight:"normal",size:12}},grid:{color:"rgba(141,174,210,.12)"}}}
}}

function customerTable(rows,full=true){
  return `<table class="dataTable"><thead><tr><th>客户编号</th><th>客户姓名</th>${full?"<th>状态</th><th>地区</th><th>负责人</th>":""}<th>建立时间</th><th>操作</th></tr></thead><tbody>
    ${rows.map(c=>{const owner=state.staff.find(s=>s.id===c.owner_user_id);return`<tr><td>${esc(c.customer_code)}</td><td class="link customerLink" data-id="${c.id}">${esc(c.name)}</td>${full?`<td>${customerStatus(c.status)}</td><td>${esc(c.region||"--")}</td><td>${esc(owner?.display_name||"--")}</td>`:""}<td>${dt(c.created_at)}</td><td><button class="btn customerLink" data-id="${c.id}">查看</button></td></tr>`}).join("")}
    ${rows.length?"":'<tr><td colspan="7"><div class="empty">暂无客户数据</div></td></tr>'}
  </tbody></table>`
}
function bindCustomerLinks(){$$(".customerLink").forEach(x=>x.onclick=()=>openCustomer(x.dataset.id))}

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
  if(state.profile.role==="admin")return state.staff.filter(s=>s.status==="active"&&s.role==="level2");
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
  b.level_one_user_id=owner.parent_user_id;
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
function headerLegendChartOpts(){const opts=chartOpts();return {...opts,plugins:{...opts.plugins,legend:{...opts.plugins.legend,display:false}}};}
function marketStatusBadge(x){
  if(!x||x.error||!Number.isFinite(Number(x.price)))return '<span class="quoteTimeBadge">暂无数据</span>';
  const stamp=x.lastTradeAt?new Date(x.lastTradeAt):null;
  const time=stamp&&!Number.isNaN(stamp.getTime())
    ? new Intl.DateTimeFormat(localeFor(state.lang),{timeZone:ROMANIA_TZ,hour:"2-digit",minute:"2-digit",hour12:false}).format(stamp)
    : "--:--";
  return '<span class="quoteTimeBadge">'+esc(time)+'</span>';
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
  document.body.classList.remove("screenshotCaptureMode");
  const c=state.customers.find(x=>String(x.id)===String(id));if(!c)return;id=c.id;state.activeCustomer=c;
  const pos=state.positions.filter(x=>x.customer_id===id);
  const trades=state.trades.filter(x=>x.customer_id===id).sort((a,b)=>new Date(b.traded_at)-new Date(a.traded_at));
  const chartTrades=[...trades].sort((a,b)=>new Date(a.traded_at)-new Date(b.traded_at));
  const follows=state.followups.filter(x=>x.customer_id===id);
  const buys=trades.filter(t=>t.side==="buy");
  const sells=trades.filter(t=>t.side==="sell");
  const openPos=pos.filter(p=>Number(p.quantity)>0);
  const symbols=[...new Set(openPos.map(p=>p.symbol))];
  const portfolioAmount=(rows,value)=>Object.entries(rows.reduce((groups,p)=>{const c=p.currency||"USD";groups[c]=(groups[c]||0)+value(p);return groups},{})).map(([c,n])=>money(n,c)).join(" / ")||"—";
  const [q,indexQ]=await Promise.all([
    fetchQuotes(symbols,{realtimeOnly:false}),
    fetchQuotes(["^GSPC","^DJI","^IXIC","^FCHI","BET.RO"],{realtimeOnly:false})
  ]);
  const indexRows=["^GSPC","^DJI","^IXIC","^FCHI","BET.RO"].map(s=>indexQ[s]||{symbol:s,error:true});
  const livePos=openPos.filter(p=>q[p.symbol]?.realtime===true&&Number.isFinite(Number(q[p.symbol]?.price)));
  const pricedPos=openPos.filter(p=>q[p.symbol]?.price!=null&&!q[p.symbol]?.error&&Number.isFinite(Number(q[p.symbol]?.price)));
  const currentValue=pricedPos.reduce((a,p)=>a+Number(p.quantity)*Number(q[p.symbol].price),0);
  const unreal=pricedPos.reduce((a,p)=>a+(Number(p.quantity)*(Number(q[p.symbol].price)-Number(p.avg_cost))),0);
  const realized=pos.reduce((a,p)=>a+Number(p.realized_pnl||0),0);
  const costBasis=openPos.reduce((a,p)=>a+(Number(p.quantity)*Number(p.avg_cost)),0);
  const totalPnl=realized+unreal;
  const mixedCurrency=new Set(pos.map(p=>p.currency||"USD")).size>1;
  const returnPct=costBasis?totalPnl/costBasis*100:0;
  const latestTrade=trades[0];
  const primary=openPos.find(p=>q[p.symbol]?.points?.length)||openPos[0]||null;
  const owner=state.staff.find(s=>s.id===c.owner_user_id);
  const serviceRows=follows;

  $("#modalRoot").innerHTML=`
    <section class="customerDetail clientPortfolioDetail shareReady" id="clientSharePage">
      <div class="shareTopbar">
        <div class="shareBrand">
          <span class="brandLogoFrame"><img class="brandLogo" src="/assets/ellery-westcott-transparent.png?v=1" alt="Ellery Westcott · Capital Markets"><img class="brandLettering" src="/assets/ellery-westcott-transparent.png?v=1" alt="" aria-hidden="true"></span>
        </div>

        <div class="shareInternalActions">
          <button class="btn" id="backCustomers">返回</button>
          ${["admin","level2"].includes(state.profile.role)?'<button class="btn screenshotHide" id="editNoteBtn">编辑客户备注</button>':""}
          ${c.owner_user_id===state.profile.id?'<button class="btn screenshotHide" id="addCustomerProjectBtn">填写参与项目</button>':""}
          ${["admin","level2"].includes(state.profile.role)?'<button class="btn gold screenshotHide" id="addTradeBtn">新增交易</button><button class="btn screenshotHide" id="addFollowBtn">记录跟进</button>':""}
          <button class="btn primary" id="captureModeBtn">导出图片</button>
        </div>
      </div>



      <div class="shareKpiRow">
        <article><label>持仓成本</label><span>${openPos.length?portfolioAmount(openPos,p=>Number(p.quantity)*Number(p.avg_cost)):"—"}</span><small>COST BASIS</small></article>
        <article><label>最新行情市值</label><span>${pricedPos.length?portfolioAmount(pricedPos,p=>Number(p.quantity)*Number(q[p.symbol].price)):"—"}</span><small>按最新可用行情计算</small></article>
        <article><label>未实现盈亏</label><span class="${unreal>=0?"up":"down"}">${pricedPos.length?portfolioAmount(pricedPos,p=>Number(p.quantity)*(Number(q[p.symbol].price)-Number(p.avg_cost))):"—"}</span><small>UNREALIZED P/L</small></article>
        <article><label>已实现盈亏</label><span class="${realized>=0?"up":"down"}">${portfolioAmount(pos,p=>Number(p.realized_pnl||0))}</span><small>REALIZED P/L</small></article>
        <article><label>综合收益率</label><span class="${returnPct>=0?"up":"down"}">${mixedCurrency?"按币种分列":(returnPct>=0?"+":"")+num(returnPct,2)+"%"}</span><small>基于当前可用行情</small></article>
        <article><label>最近交易</label><span>${latestTrade?dt(latestTrade.traded_at):"—"}</span><small>${latestTrade?esc(latestTrade.symbol+" · "+(latestTrade.side==="buy"?"买入":"卖出")):"暂无交易"}</small></article>
      </div>

      <div class="shareMainGrid">
        <article class="panel sharePricePanel">
          <div class="panelHead compact"><div><h2>${primary?esc(primary.symbol)+" "+tr("价格走势",state.lang):"价格走势"}</h2><p>PRICE MOVEMENT · 买入 / 卖出节点 · 罗马尼亚时间</p></div><span class="headerChartLegend"><span><i style="background:#00d59b"></i>${primary?esc(primary.symbol):"—"}</span><span><i style="background:#8eafd0"></i>${tr("买进",state.lang)}</span><span><i style="background:#ef3456"></i>${tr("卖出",state.lang)}</span></span></div>
          <div class="chartBox sharePriceChart"><canvas id="customerPriceChart"></canvas></div>
        </article>
        <article class="panel shareReturnPanel">
          <div class="panelHead compact"><div><h2>持仓收益走势</h2><p>POSITION P/L · 基于当前行情序列</p></div><span class="headerChartLegend"><span><i style="background:#8eafd0"></i>${tr("持仓浮动盈亏",state.lang)}</span></span></div>
          <div class="chartBox shareReturnChart"><canvas id="customerReturnChart"></canvas></div>
        </article>

      </div>

      <div class="shareLowerGrid">
        <article class="panel sharePositions">
          <div class="panelHead compact"><div><h2><span class="customerNameHighlight" data-no-i18n>${esc(c.name)}</span> · 客户持仓与买卖记录</h2><p>HOLDINGS & ORDER LEDGER</p></div><span class="headMeta">${openPos.length} POSITIONS · ${trades.length} ORDERS</span></div>
          <div class="tableWrap shareLedgerTable"><div id="customerPositionLive">${positionTable(pos,q)}</div>${tradeTable(trades)}</div>
        </article>
        <article class="panel shareServicePanel">
          <div class="panelHead compact"><div><h2>客户资料与服务纪要</h2><p>CLIENT PROFILE · SERVICE NOTES</p></div>${["admin","level2"].includes(state.profile.role)?'<button class="btn screenshotHide" id="editServiceNotesBtn">编辑服务纪要</button>':""}</div>
          <div class="shareProfileGrid">
            <div><span>性别</span><span>${c.gender==="male"?"男性":c.gender==="female"?"女性":"未填写"}</span></div>
            <div><span>风险级别</span><span>${esc(c.risk_level||"--")}</span></div>
            <div><span>资金规模</span><span>${c.capital_amount?money(c.capital_amount,c.capital_currency||"USD"):"未填写"}</span></div>
            <div><span>服务状态</span><span>${customerStatus(c.status)}</span></div>
          </div>
          <div class="shareNote"><span>客户备注</span><p data-no-i18n>${c.notes?esc(c.notes):tr("暂无客户备注",state.lang)}</p></div>
          <div class="shareServiceTimeline">
            ${serviceRows.map(f=>`<div><span>${dt(f.created_at)}</span><p data-no-i18n>${esc(f.content)}</p></div>`).join("")||'<div><span>—</span><p>暂无服务纪要</p></div>'}
          </div>

        </article>
      </div>


    </section>`;

  translateUI($("#clientSharePage"),state.lang);
  const back=$("#backCustomers");if(back)back.onclick=()=>closeModal(true);
  const addTrade=$("#addTradeBtn");if(addTrade)addTrade.onclick=()=>openTradeForm(c);
  const addProject=$("#addCustomerProjectBtn");if(addProject)addProject.onclick=()=>{const projects=state.allocationProjects.filter(p=>p.owner_user_id===c.owner_user_id);if(!projects.length||state.customerReservationError){toast("请先配置该账号的项目客户明细",true);return;}editCustomerReservation(featureCtx(),projects[0],{customer:c,projects,onSaved:()=>openCustomer(c.id)});};
  const serviceEditor=$("#editServiceNotesBtn");if(serviceEditor)serviceEditor.onclick=()=>openFollowForm(c);
  const addFollow=$("#addFollowBtn");if(addFollow)addFollow.onclick=()=>openFollowForm(c);
  const editNote=$("#editNoteBtn");if(editNote)editNote.onclick=()=>openCustomerNoteForm(c);
  const capture=$("#captureModeBtn");
  if(state.customerCaptureEscapeHandler)document.removeEventListener('keydown',state.customerCaptureEscapeHandler);
  state.customerCaptureEscapeHandler=e=>{
    if(e.key==='Escape'&&document.body.classList.contains('screenshotCaptureMode')){
      e.preventDefault();e.stopImmediatePropagation();
      $('#clientSharePage')?.classList.remove('clientCaptureMode');
      document.body.classList.remove('screenshotCaptureMode');
    }
  };
  document.addEventListener('keydown',state.customerCaptureEscapeHandler);
  if(capture)capture.onclick=e=>{
    e.preventDefault();e.stopPropagation();
    exportPagePNG($('#clientSharePage'),{filename:'Ellery-Westcott-'+c.name,button:capture,notify:toast});
  };
  const note=$("#clientSharePage .shareNote");if(note&&c.notes){note.dataset.hasNotes="true";note.onclick=()=>modal("客户备注",`<p data-no-i18n style="white-space:pre-wrap;line-height:1.6">${esc(c.notes)}</p>`);}
  drawCustomerShareCharts(pos,chartTrades,q,primary,realized,unreal);
  if(state.customerMarketTimer)clearInterval(state.customerMarketTimer);
  state.customerMarketTimer=setInterval(async()=>{
    const page=$("#clientSharePage");
    if(!page||state.activeCustomer?.id!==c.id){
      clearInterval(state.customerMarketTimer);state.customerMarketTimer=null;return;
    }
    try{
      const [freshQ,freshIndexQ]=await Promise.all([
        fetchQuotes(symbols,{realtimeOnly:false}),
        fetchQuotes(["^GSPC","^DJI","^IXIC","^FCHI","BET.RO"],{realtimeOnly:false})
      ]);
      const freshRows=["^GSPC","^DJI","^IXIC","^FCHI","BET.RO"].map(s=>freshIndexQ[s]||{symbol:s,error:true});
      const strip=page.querySelector(".shareMarketStrip");
      if(strip)strip.innerHTML=marketIndexStrip(freshRows);
      const priced=openPos.filter(p=>freshQ[p.symbol]?.price!=null&&!freshQ[p.symbol]?.error&&Number.isFinite(Number(freshQ[p.symbol]?.price)));
      const freshValue=priced.reduce((a,p)=>a+Number(p.quantity)*Number(freshQ[p.symbol].price),0);
      const freshUnreal=priced.reduce((a,p)=>a+Number(p.quantity)*(Number(freshQ[p.symbol].price)-Number(p.avg_cost)),0);
      renderPortfolioBreakdown(pos,freshQ,realized,freshUnreal);
      const freshReturn=costBasis?(realized+freshUnreal)/costBasis*100:0;
      const kpis=page.querySelectorAll(".shareKpiRow article span");
      if(kpis[1])kpis[1].textContent=priced.length?portfolioAmount(priced,p=>Number(p.quantity)*Number(freshQ[p.symbol].price)):"—";
      if(kpis[2]){kpis[2].textContent=priced.length?portfolioAmount(priced,p=>Number(p.quantity)*(Number(freshQ[p.symbol].price)-Number(p.avg_cost))):"—";kpis[2].className=freshUnreal>=0?"up":"down";}
      if(kpis[4]){kpis[4].textContent=mixedCurrency?"按币种分列":(freshReturn>=0?"+":"")+num(freshReturn,2)+"%";kpis[4].className=freshReturn>=0?"up":"down";}
      const liveTable=$("#customerPositionLive");
      if(liveTable)liveTable.innerHTML=positionTable(pos,freshQ);
      const primaryNow=openPos.find(p=>freshQ[p.symbol]?.points?.length)||primary;
      const tech=page.querySelector(".clientMiniTech");
      if(primaryNow&&tech){
        tech.innerHTML=miniCandlesHTML(freshQ[primaryNow.symbol]?.points||[],primaryNow.symbol)+miniRSIHTML(freshQ[primaryNow.symbol]?.points||[]);
        updateCustomerShareMarketCharts(pos,chartTrades,freshQ,primaryNow,realized,freshUnreal);
      }
    }catch{}
  },60000);
}

function positionTable(rows,q){
  const visible=rows.filter(p=>Number(p.quantity)>0||Number(p.realized_pnl)!==0);
  return `<table class="dataTable portfolioTable"><thead><tr><th>股票</th><th>市场</th><th>数量</th><th>平均成本</th><th>成本基准</th><th>行情价</th><th>市值</th><th>未实现盈亏</th><th>已实现盈亏</th></tr></thead><tbody>${visible.map(p=>{
    const usable=q[p.symbol]?.price!=null&&!q[p.symbol]?.error&&Number.isFinite(Number(q[p.symbol]?.price));
    const last=usable?Number(q[p.symbol].price):null;
    const mv=last==null?null:Number(p.quantity)*last;
    const u=last==null?null:Number(p.quantity)*(last-Number(p.avg_cost));
    const quoteTime=usable&&q[p.symbol]?.lastTradeAt
      ? new Intl.DateTimeFormat(localeFor(state.lang),{timeZone:ROMANIA_TZ,hour:"2-digit",minute:"2-digit",hour12:false}).format(new Date(q[p.symbol].lastTradeAt))
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
  if(hEl)state.charts.holdings=new Chart(hEl,{type:"doughnut",data:{labels:h.map(x=>x.symbol),datasets:[{label:tr("成本结构",state.lang),data:h.map(x=>Number(x.quantity)*Number(x.avg_cost)),backgroundColor:["#14e76d","#6e8ba7","#8eafd0","#2ed3a0","#8b9bad","#8d5ed7"]}]},options:{...chartOpts(),cutout:"65%"}});
  let net=0;const data=trades.map(t=>{net+=t.side==="buy"?(Number(t.price)*Number(t.quantity)+Number(t.fees)):-((Number(t.price)*Number(t.quantity))-Number(t.fees));return{x:new Date(t.traded_at).toLocaleDateString(localeFor(state.lang)),y:net}});
  const tEl=$("#customerTradeChart");
  if(tEl)state.charts.trades=new Chart(tEl,{type:"line",data:{labels:data.map(x=>x.x),datasets:[{label:tr("累计净投入",state.lang),data:data.map(x=>x.y),borderColor:"#8eafd0",backgroundColor:"rgba(142,175,208,.12)",fill:true,tension:.25}]},options:chartOpts()});
}

function renderPortfolioBreakdown(pos,q,realized,unreal){
  const el=$("#customerPortfolioBreakdown");if(!el)return;
  const holdings=pos.filter(p=>Number(p.quantity)>0),groups={};
  for(const p of holdings){const c=p.currency||"USD";(groups[c]||=([])).push(p)}
  el.innerHTML=Object.entries(groups).map(([currency,rows])=>{
    const total=rows.reduce((a,p)=>a+Number(p.quantity)*Number(p.avg_cost),0);
    const priced=rows.filter(p=>q[p.symbol]?.price!=null&&!q[p.symbol].error&&Number.isFinite(Number(q[p.symbol].price)));
    const floating=priced.reduce((a,p)=>a+Number(p.quantity)*(Number(q[p.symbol].price)-Number(p.avg_cost)),0);
    const booked=pos.filter(p=>(p.currency||"USD")===currency).reduce((a,p)=>a+Number(p.realized_pnl||0),0);
    return `<section class="portfolioCurrencyGroup"><div class="breakdownLabel">持仓成本占比 · ${esc(currency)}</div>${rows.map(p=>{const cost=Number(p.quantity)*Number(p.avg_cost),ratio=total?cost/total*100:0;return `<div class="holdingBreakdownRow"><div><b>${esc(p.symbol)}</b><span>${money(cost,currency)}</span></div><div class="allocationBar"><i style="width:${ratio}%"></i></div><small>${num(ratio,1)}%</small></div>`}).join("")}<div class="profitBreakdownRow"><span>已实现盈亏</span><b class="${booked>=0?"up":"down"}">${money(booked,currency)}</b></div><div class="profitBreakdownRow"><span>未实现盈亏</span><b class="${floating>=0?"up":"down"}">${priced.length?money(floating,currency):"暂无行情"}</b></div></section>`;
  }).join("")||'<div class="empty">暂无持仓结构</div>';
}
function drawCustomerShareCharts(pos,trades,q,primary,realized,unreal){
  renderPortfolioBreakdown(pos,q,realized,unreal);

  const pEl=$("#customerPriceChart"),rEl=$("#customerReturnChart");
  if(!primary||!q[primary.symbol]||q[primary.symbol].error){
    if(pEl)pEl.parentElement.innerHTML='<div class="empty">当前持仓暂无可用价格序列</div>';
    if(rEl)rEl.parentElement.innerHTML='<div class="empty">当前持仓暂无可用收益序列</div>';
    return;
  }
  const quote=q[primary.symbol];
  const pts=(quote.points||[]).filter(p=>p.close!=null);
  const labels=pts.map(p=>new Date(p.t).toLocaleTimeString(localeFor(state.lang),{timeZone:ROMANIA_TZ,hour:"2-digit",minute:"2-digit"}));
  const buys=trades.filter(t=>t.symbol===primary.symbol&&pts.length&&new Date(t.traded_at).getTime()>=pts[0].t&&new Date(t.traded_at).getTime()<=pts.at(-1).t&&t.side==="buy");
  const sells=trades.filter(t=>t.symbol===primary.symbol&&pts.length&&new Date(t.traded_at).getTime()>=pts[0].t&&new Date(t.traded_at).getTime()<=pts.at(-1).t&&t.side==="sell");
  if(pEl){
    state.charts.customerPrice=new Chart(pEl,{type:"line",data:{labels,datasets:[
      {label:primary.symbol,data:pts.map(p=>p.close),borderColor:"#00d59b",backgroundColor:"rgba(20,231,109,.08)",fill:true,tension:.18,pointRadius:0,pointHoverRadius:4},
      {type:"scatter",label:tr("买入",state.lang),data:buys.map(t=>({x:new Date(t.traded_at).toLocaleTimeString(localeFor(state.lang),{timeZone:ROMANIA_TZ,hour:"2-digit",minute:"2-digit"}),y:Number(t.price)})),pointRadius:5,pointHoverRadius:7,backgroundColor:"#8eafd0"},
      {type:"scatter",label:tr("卖出",state.lang),data:sells.map(t=>({x:new Date(t.traded_at).toLocaleTimeString(localeFor(state.lang),{timeZone:ROMANIA_TZ,hour:"2-digit",minute:"2-digit"}),y:Number(t.price)})),pointRadius:5,pointHoverRadius:7,backgroundColor:"#ef3456"}
    ]},options:headerLegendChartOpts()});
  }
  if(rEl){
    const qty=Number(primary.quantity),avg=Number(primary.avg_cost);
    state.charts.customerReturn=new Chart(rEl,{type:"line",data:{labels,datasets:[{label:tr("持仓浮动盈亏",state.lang),data:pts.map(p=>(Number(p.close)-avg)*qty),borderColor:"#8eafd0",backgroundColor:"rgba(142,175,208,.10)",fill:true,tension:.18,pointRadius:0,pointHoverRadius:4}]},options:customerReturnChartOptions()});
  }
}

function customerReturnChartOptions(){
 const options=headerLegendChartOpts();
 options.scales.y.ticks={...options.scales.y.ticks,callback:value=>new Intl.NumberFormat("en-US",{notation:"compact",maximumFractionDigits:3}).format(Number(value))};
 options.scales.x.ticks={...options.scales.x.ticks,maxTicksLimit:6,maxRotation:0,minRotation:0};
 return options;
}

function updateCustomerShareMarketCharts(pos,trades,q,primary,realized,unreal){
  if(!primary||!q[primary.symbol]||q[primary.symbol].error){
    for(const key of ["customerPrice","customerReturn"]){const chart=state.charts[key];if(chart){chart.data.labels=[];chart.data.datasets.forEach(d=>d.data=[]);chart.update("none");}}
    return;
  }
  const quote=q[primary.symbol];
  const pts=(quote.points||[]).filter(p=>p.close!=null);
  const labels=pts.map(p=>new Date(p.t).toLocaleTimeString(localeFor(state.lang),{timeZone:ROMANIA_TZ,hour:"2-digit",minute:"2-digit"}));
  const buys=trades.filter(t=>t.symbol===primary.symbol&&pts.length&&new Date(t.traded_at).getTime()>=pts[0].t&&new Date(t.traded_at).getTime()<=pts.at(-1).t&&t.side==="buy");
  const sells=trades.filter(t=>t.symbol===primary.symbol&&pts.length&&new Date(t.traded_at).getTime()>=pts[0].t&&new Date(t.traded_at).getTime()<=pts.at(-1).t&&t.side==="sell");
  const priceChart=state.charts.customerPrice;
  if(priceChart){
    priceChart.data.labels=labels;
    priceChart.data.datasets[0].data=pts.map(p=>p.close);
    priceChart.data.datasets[1].data=buys.map(t=>({x:new Date(t.traded_at).toLocaleTimeString(localeFor(state.lang),{timeZone:ROMANIA_TZ,hour:"2-digit",minute:"2-digit"}),y:Number(t.price)}));
    priceChart.data.datasets[2].data=sells.map(t=>({x:new Date(t.traded_at).toLocaleTimeString(localeFor(state.lang),{timeZone:ROMANIA_TZ,hour:"2-digit",minute:"2-digit"}),y:Number(t.price)}));
    priceChart.update("none");
  }
  const returnChart=state.charts.customerReturn;
  if(returnChart){
    const qty=Number(primary.quantity),avg=Number(primary.avg_cost);
    returnChart.data.labels=labels;
    returnChart.data.datasets[0].data=pts.map(p=>(Number(p.close)-avg)*qty);
    returnChart.update("none");
  }

}

function openTradeForm(c){
  modal("新增交易 · "+c.name,`<form id="tradeForm" class="formGrid">
    <div class="field"><label>股票代码</label><input class="input" name="symbol" placeholder="AAPL / MC.PA" required></div>
    <div class="field"><label>股票名称</label><input class="input" name="stock_name"></div>
    <div class="field"><label>市场</label><select class="select" name="market"><option>Bucharest Stock Exchange</option><option>NASDAQ</option><option>NYSE</option><option>Euronext Paris</option><option>Xetra / Frankfurt</option><option>London Stock Exchange</option><option>Borsa Italiana</option><option>Bolsa de Madrid</option><option>Euronext Amsterdam</option><option>SIX Swiss Exchange</option><option>Warsaw Stock Exchange</option><option>Tokyo Stock Exchange</option><option>其他</option></select></div>
    <div class="field"><label>交易类型</label><select class="select" name="side"><option value="buy">买入</option><option value="sell">卖出</option></select></div>
    <div class="field"><label>数量</label><input class="input" type="number" step="0.000001" min="0.000001" name="quantity" required></div>
    <div class="field"><label>价格</label><input class="input" type="number" step="0.000001" min="0.000001" name="price" required></div>
    <div class="field"><label>币种</label><select class="select" name="currency"><option>RON</option><option>USD</option><option>EUR</option><option>GBP</option><option>CHF</option><option>PLN</option><option>JPY</option></select></div>
    <div class="field"><label>手续费</label><input class="input" type="number" step="0.01" min="0" name="fees" value="0"></div>
    <div class="field"><label>交易时间</label><input class="input" type="datetime-local" name="traded_at" required></div>
    <div class="field full"><label>备注</label><textarea class="textarea" name="note"></textarea></div>
    <div class="field full"><button class="btn primary" type="submit">保存交易</button></div>
  </form>`);
  $("[name=traded_at]").value=romaniaInputNow();
  $("#tradeForm").onsubmit=async e=>{e.preventDefault();const b=Object.fromEntries(new FormData(e.currentTarget).entries());b.customer_id=c.id;b.entered_by=state.profile.id;b.symbol=String(b.symbol).trim().toUpperCase();b.traded_at=romaniaLocalToISO(String(b.traded_at));const {error}=await supabase.from("trades").insert(b);if(error){toast(error.message,true);return}closeModal();toast("交易已保存，持仓已自动重算");await refreshAll();await openCustomer(c.id)};
}

function openFollowForm(c){
  modal("编辑服务纪要 · "+c.name,`<form id="followForm" class="formGrid">
    <div class="field"><label>沟通渠道</label><select class="select" name="channel"><option value="whatsapp">WhatsApp</option><option value="phone">电话</option><option value="email">邮件</option><option value="meeting">会议</option><option value="other">其他</option></select></div>
    <div class="field"><label>下次跟进</label><input class="input" type="datetime-local" name="next_followup_at"></div>
    <div class="field full"><label>服务纪要（追加记录，保留历史）</label><textarea class="textarea" name="content" maxlength="4000" required></textarea></div>
    <div class="field full"><button class="btn primary" type="submit">保存跟进记录</button></div>
  </form>`);
  $("#followForm").onsubmit=async e=>{e.preventDefault();const b=Object.fromEntries(new FormData(e.currentTarget).entries());b.customer_id=c.id;b.user_id=state.profile.id;if(!b.next_followup_at)b.next_followup_at=null;else b.next_followup_at=romaniaLocalToISO(String(b.next_followup_at));const {error}=await supabase.from("customer_followups").insert(b);if(error){toast(error.message,true);return}closeModal();toast("跟进记录已保存");await refreshAll();await openCustomer(c.id)};
}

async function renderPersonnel(){
  if(!canPersonnel()){state.activeView="dashboard";await renderDashboard();return}
  const rows=state.staff.filter(s=>s.status!=="deleted"&&["admin","level2"].includes(s.role));
  const createButton=state.profile.role==="admin"?'<button class="btn primary" id="newStaff">新建人员账户</button>':"";
  $("#main").innerHTML=`
    <article class="panel modulePanel">
      <div class="panelHead unifiedModuleHead">
        <div><h2>人员账户管理</h2><p>管理员统一管理直属二级账户：创建、编辑、重置密码与启停；二级账户仅访问自己的客户和业务数据。</p></div>
        <div class="toolbar unifiedActions">${createButton}</div>
      </div>
      <div class="tableWrap moduleContent personnelModuleContent">
        <table class="dataTable personnelTable">
          <colgroup>
            <col style="width:15%"><col style="width:17%"><col style="width:10%"><col style="width:17%">
            <col style="width:9%"><col style="width:17%"><col style="width:15%">
          </colgroup>
          <thead><tr><th>账号</th><th>姓名</th><th>角色</th><th>上级</th><th>状态</th><th>创建时间</th><th>操作</th></tr></thead><tbody>
        ${rows.map(s=>{
          const parent=state.staff.find(x=>x.id===s.parent_user_id);
          const parentName=s.role==="admin"?"最高管理员":parent?.display_name||"--";
          let actions="--";
          if(state.profile.role==="admin"){
            if(s.role==="admin"){
              actions=`<div class="staffActions"><button class="btn editStaff" data-id="${s.id}">编辑账号</button><button class="btn resetPwd" data-id="${s.id}">重置密码</button></div>`;
            }else{
              actions=`<div class="staffActions"><button class="btn editStaff" data-id="${s.id}">编辑账号</button><button class="btn resetPwd" data-id="${s.id}">重置密码</button><button class="btn danger toggleStaff" data-id="${s.id}" data-status="${s.status==="active"?"disabled":"active"}">${s.status==="active"?"禁用":"启用"}</button><button class="btn danger deleteStaff" data-id="${s.id}">删除账号</button></div>`;
            }
          }
          return`<tr><td class="link">${esc(s.username)}</td><td>${esc(s.display_name)}</td><td>${roleName(s.role)}</td><td>${esc(parentName)}</td><td><span class="statusDot ${s.status}"></span>${s.status==="active"?"正常":s.status==="disabled"?"已停用":esc(s.status)}</td><td>${dt(s.created_at)}</td><td>${actions}</td></tr>`;
        }).join("")}
        </tbody></table>
      </div>
    </article>`;
  if($("#newStaff"))$("#newStaff").onclick=openStaffForm;
  $$(".editStaff").forEach(b=>b.onclick=()=>openStaffEdit(b.dataset.id));
  $$(".resetPwd").forEach(b=>b.onclick=()=>resetStaffPassword(b.dataset.id));
  $$(".toggleStaff").forEach(b=>b.onclick=()=>setStaffStatus(b.dataset.id,b.dataset.status));
  $$(".deleteStaff").forEach(b=>b.onclick=()=>deleteStaffAccount(b.dataset.id));
}

function openStaffForm(){
  if(!canPersonnel())return;
  modal("新建人员账户",`<form id="staffForm" class="formGrid">
    <div class="field"><label>姓名</label><input class="input" name="display_name" required></div>
    <div class="field"><label>账号</label><input class="input" name="username" required></div>
    <div class="field"><label>密码</label><input class="input" type="password" name="password" minlength="8" required></div>
    <div class="field"><label>角色</label><div class="input staffReadonly">二级账户</div><input type="hidden" name="role" value="level2"></div>
    <div class="field" id="adminParentField"><label>上级</label><div class="input staffReadonly">管理员 · ${esc(state.profile.display_name)}</div></div>
    <div class="field"><label>电话</label><input class="input" name="phone"></div>
    <div class="field full"><button class="btn primary" type="submit">创建账户</button></div>
  </form>`);
  $("#staffForm").onsubmit=async e=>{
    e.preventDefault();
    const b=Object.fromEntries(new FormData(e.currentTarget).entries());
    b.action="create";
    b.role="level2";b.parent_user_id=state.profile.id;
    const j=await callStaffFn(b);
    if(j){closeModal();toast("人员账户已创建");await refreshAll();}
  };
}

function openStaffEdit(id){
  const s=state.staff.find(x=>x.id===id&&x.status!=="deleted");if(!s)return;
  if(!canPersonnel()||!["admin","level2"].includes(s.role))return;
  const admins=state.staff.filter(x=>x.role==="admin"&&x.status==="active");
  const parent=state.staff.find(x=>x.id===s.parent_user_id);
  modal("编辑人员账号",`<form id="staffEditForm" class="formGrid">
    <div class="field"><label>账号</label><input class="input" name="username" value="${esc(s.username)}" required></div>
    <div class="field"><label>姓名</label><input class="input" name="display_name" value="${esc(s.display_name)}" required></div>
    <div class="field"><label>角色</label><div class="input staffReadonly">${roleName(s.role)}</div></div>
    ${s.role==="admin"
      ? `<div class="field"><label>上级</label><div class="input staffReadonly">管理员</div></div>`
      : `<div class="field"><label>所属管理员</label><select class="select" name="parent_user_id" required>${admins.map(x=>`<option value="${x.id}" ${x.id===s.parent_user_id?"selected":""}>${esc(x.display_name)}</option>`).join("")}</select></div>`}
    <div class="field"><label>电话</label><input class="input" name="phone" value="${esc(s.phone||"")}"></div>
    <div class="field"><label>当前状态</label><div class="input staffReadonly">${esc(s.status)}</div></div>
    <div class="field full"><button class="btn primary" type="submit">保存账号修改</button></div>
  </form>`);
  $("#staffEditForm").onsubmit=async e=>{
    e.preventDefault();
    const b=Object.fromEntries(new FormData(e.currentTarget).entries());
    b.action="update";b.user_id=s.id;
    if(s.role==="admin")delete b.parent_user_id;
    const j=await callStaffFn(b);
    if(j){closeModal();toast("账号资料已更新");await refreshAll();}
  };
}

async function callStaffFn(body){
  const {data:{session}}=await supabase.auth.getSession();
  const r=await fetch(SUPABASE_URL+"/functions/v1/staff-admin",{
    method:"POST",
    headers:{"Content-Type":"application/json","apikey":SUPABASE_KEY,"Authorization":"Bearer "+session.access_token},
    body:JSON.stringify(body)
  });
  const j=await r.json();
  if(!r.ok){toast(j.error||"操作失败",true);return null}
  return j;
}
async function resetStaffPassword(id){
  const s=state.staff.find(x=>x.id===id);if(!s)return;
  modal("重置密码",`<form id="resetStaffPasswordForm" class="formGrid">
    <div class="field full"><label>人员账号</label><div class="input staffReadonly">${esc(s.username)} · ${esc(s.display_name)}</div></div>
    <div class="field"><label>新密码</label><input class="input" type="password" name="password" minlength="8" required></div>
    <div class="field"><label>确认新密码</label><input class="input" type="password" name="confirm_password" minlength="8" required></div>
    <div class="field full modalActionRow"><button class="btn" type="button" id="cancelResetPwd">取消</button><button class="btn primary" type="submit">确认重置</button></div>
  </form>`);
  $("#cancelResetPwd").onclick=closeModal;
  $("#resetStaffPasswordForm").onsubmit=async e=>{
    e.preventDefault();const b=Object.fromEntries(new FormData(e.currentTarget).entries());
    if(b.password!==b.confirm_password){toast("两次输入的密码不一致",true);return}
    const j=await callStaffFn({action:"reset_password",user_id:id,new_password:b.password});
    if(j){closeModal();toast("密码已重置")}
  };
}
async function setStaffStatus(id,status){
  const s=state.staff.find(x=>x.id===id);if(!s)return;
  const disabling=status==="disabled";
  modal(disabling?"禁用账号":"启用账号",`<div class="confirmPanel">
    <div class="confirmIcon ${disabling?"danger":""}">${disabling?"!":"✓"}</div>
    <h3>${disabling?"确认禁用该账户？":"确认启用该账户？"}</h3>
    <p>${esc(s.username)} · ${esc(s.display_name)}</p>
    <div class="modalActionRow"><button class="btn" id="cancelStaffStatus">取消</button><button class="btn ${disabling?"danger":"primary"}" id="confirmStaffStatus">${disabling?"确认禁用":"确认启用"}</button></div>
  </div>`);
  $("#cancelStaffStatus").onclick=closeModal;
  $("#confirmStaffStatus").onclick=async()=>{
    const j=await callStaffFn({action:"set_status",user_id:id,status});
    if(j){closeModal();toast("账户状态已更新");await refreshAll()}
  };
}
async function deleteStaffAccount(id){
  const s=state.staff.find(x=>x.id===id);if(!s)return;
  modal("删除账号",`<div class="confirmPanel">
    <div class="confirmIcon danger">!</div>
    <h3>确认删除账号？</h3>
    <p>${esc(s.username)} · ${esc(s.display_name)}</p>
    <div class="confirmWarning">删除后该账号将无法登录，但历史业务记录会保留。存在客户或下级人员时系统会阻止删除。</div>
    <div class="modalActionRow"><button class="btn" id="cancelDeleteStaff">取消</button><button class="btn danger" id="confirmDeleteStaff">确认删除</button></div>
  </div>`);
  $("#cancelDeleteStaff").onclick=closeModal;
  $("#confirmDeleteStaff").onclick=async()=>{
    const j=await callStaffFn({action:"delete",user_id:id});
    if(j){closeModal();toast("账号已删除，历史业务记录已保留");await refreshAll()}
  };
}

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
  if(demoMode){const rows=(await import("./demo-client.js?v=20261009-brighter")).demoQuotes(symbols);Object.assign(state.quotes,rows);return rows;}
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
      <div class="tableWrap moduleContent"><table class="dataTable holdingsTable"><thead><tr><th>客户</th><th>股票</th><th>市场</th><th>数量</th><th>平均成本</th><th>行情价</th><th>更新时间</th><th>市值</th><th>未实现盈亏</th><th>已实现盈亏</th></tr></thead><tbody>${rows.map(p=>{
        const x=q[p.symbol],usable=x&&!x.error&&Number.isFinite(Number(x.price));
        const px=usable?Number(x.price):null,mv=usable?Number(p.quantity)*px:null,u=usable?Number(p.quantity)*(px-Number(p.avg_cost)):null;
        const stamp=usable&&x.lastTradeAt?dt(x.lastTradeAt):"--";
        return`<tr class="positionQuoteRow" data-symbol="${esc(p.symbol)}" data-qty="${Number(p.quantity)}" data-cost="${Number(p.avg_cost)}" data-currency="${esc(p.currency||"USD")}"><td>${esc(p.customers?.name||"--")}</td><td class="link">${esc(p.symbol)}</td><td>${esc(p.market)}</td><td>${num(p.quantity,4)}</td><td>${money(p.avg_cost,p.currency)}</td><td class="positionLivePrice">${px==null?"--":money(px,p.currency)}</td><td class="positionLiveTime">${stamp}</td><td class="positionLiveValue">${mv==null?"--":money(mv,p.currency)}</td><td class="positionLivePnl ${u==null?"":u>=0?"up":"down"}">${u==null?"--":money(u,p.currency)}</td><td class="${Number(p.realized_pnl)>=0?"up":"down"}">${money(p.realized_pnl,p.currency)}</td></tr>`
      }).join("")}</tbody></table></div>
    </article>`;
  const refreshQuotesOnly=async()=>{
    const liveRows=$$(".positionQuoteRow");
    const symbols=[...new Set(liveRows.map(r=>r.dataset.symbol).filter(Boolean))];
    const fresh=await fetchQuotes(symbols,{realtimeOnly:false});
    liveRows.forEach(r=>{
      const x=fresh[r.dataset.symbol],usable=x&&!x.error&&Number.isFinite(Number(x.price));
      const qty=Number(r.dataset.qty||0),cost=Number(r.dataset.cost||0),currency=r.dataset.currency||"USD";
      const px=usable?Number(x.price):null,mv=px==null?null:qty*px,pnl=px==null?null:qty*(px-cost);
      const priceEl=$(".positionLivePrice",r),timeEl=$(".positionLiveTime",r),valueEl=$(".positionLiveValue",r),pnlEl=$(".positionLivePnl",r);
      if(priceEl)priceEl.textContent=px==null?"--":money(px,currency);
      if(timeEl)timeEl.textContent=usable&&x.lastTradeAt?dt(x.lastTradeAt):"--";
      if(valueEl)valueEl.textContent=mv==null?"--":money(mv,currency);
      if(pnlEl){pnlEl.textContent=pnl==null?"--":money(pnl,currency);pnlEl.className="positionLivePnl "+(pnl==null?"":pnl>=0?"up":"down")}
    });
  };
  $("#refreshPositions").onclick=()=>refreshQuotesOnly().catch(()=>{});
  state.positionRefreshTimer=setInterval(()=>{if(state.activeView==="positions")refreshQuotesOnly().catch(()=>{})},60000);
}

let currentMarketQuote=null;
let marketRange="1D";
async function renderMarket(){
  marketRange="1D";currentMarketQuote=null;
  const presetOptions=Object.entries(MARKET_PRESETS).map(([k,v])=>`<option value="${k}" ${k==="RO"?"selected":""}>${v.label}</option>`).join("");
  $("#main").innerHTML=`\n    <section class="grid2 marketUnifiedGrid canvaReferenceMarket"><header class="referenceMarketHero"><div><h1>股票市场</h1><p>查看多国家股票真实行情、涨跌及趋势</p></div><span class="referenceLiveFlag">行情以数据源返回结果为准</span></header><div class="referenceFeatureCards" id="referenceFeatureCards"><div class="referenceFeatureLoading">正在读取股票行情…</div></div>
      <article class="panel marketOverviewPanel">
        <div class="panelHead"><div><h2><img class="sectionIcon" src="/assets/globe2.svg" alt="">多国家行情</h2></div><div class="marketControls"><select id="marketCountry" class="select">${presetOptions}</select><input id="marketSymbols" class="input" value="${MARKET_PRESETS.RO.symbols.join(",")}"></div></div>
        <div class="panelBody"><div class="quoteHeader"><div><span class="link" id="mSymbol">--</span><span id="mExchangeBadge" class="exchangeBadge"></span><h3 id="mName">选择股票</h3><p class="muted" id="mExchange">--</p></div><div><div class="quotePrice"><span id="mPrice">--</span><small id="mCurrency"></small></div><div id="mChange" class="quoteChange">--</div></div></div></div>
        <div class="marketMetrics" id="marketMetrics"></div>

      </article>
      <article class="panel marketListPanel">
        <div class="panelHead"><div><h2><img class="sectionIcon" src="/assets/bar-chart.svg" alt="">股票列表</h2><p>罗马尼亚、美国、法国、德国、英国、意大利、西班牙、荷兰、瑞士、波兰、日本</p></div></div>
        <div class="referenceMarketTabs" id="referenceMarketTabs"><button data-market-preset="RO" class="active" type="button">罗马尼亚</button><button data-market-preset="US" type="button">美国</button><button data-market-preset="FR" type="button">法国</button><button data-market-preset="DE" type="button">德国</button><button data-market-preset="GB" type="button">英国</button><button data-market-preset="IT" type="button">意大利</button><button data-market-preset="ES" type="button">西班牙</button><button data-market-preset="NL" type="button">荷兰</button><button data-market-preset="CH" type="button">瑞士</button><button data-market-preset="PL" type="button">波兰</button><button data-market-preset="JP" type="button">日本</button></div><div class="referenceMarketFilters"><button class="active" type="button" data-market-sort="original">默认顺序</button><button type="button" data-market-sort="gain">涨幅最高</button><button type="button" data-market-sort="loss">跌幅最高</button><input id="marketListFilter" class="input" type="search" placeholder="搜索当前列表…" aria-label="筛选股票列表"></div><div class="marketListHead"><span>股票 / 公司</span><span>价格</span><span>涨跌 / 时间</span></div><div class="panelBody marketList" id="marketRows"></div>
      </article>
      <article class="panel marketChartPanel">
        <div class="panelHead marketChartHeader"><div class="marketRangeBar" role="group" aria-label="图表时间范围">${["1D","1W","1M","3M","6M","1Y","全部"].map((r,i)=>`<button type="button" data-range="${r}" class="${i===0?"active":""}" aria-pressed="${i===0}">${r}</button>`).join("")}<span class="marketRangeNote" id="marketRangeNote"></span></div></div><div class="chartBox"><div class="marketCanvas"><canvas id="marketChart"></canvas></div></div>
      </article>
    </section>`;
  const load=async()=>{
    publishUIData("market",{status:"loading"});
    const selectedSymbol=$("#mSymbol")?.textContent||"";
    const syms=$("#marketSymbols").value.split(",").map(x=>x.trim().toUpperCase()).filter(Boolean);
    const q=await fetchQuotes(syms,{realtimeOnly:false});
    const rows=syms.map(s=>q[s]).filter(Boolean);
    for(const row of rows)row.uiReceivedAt=Date.now();

    const featureCards=$("#referenceFeatureCards");
    if(featureCards){
      featureCards.innerHTML=syms.slice(0,4).map(symbol=>{
        const item=q[symbol];
        const valid=item&&!item.error&&Number.isFinite(Number(item.price));
        const change=valid&&item.changePct!=null?Number(item.changePct):null;
        return '<button type="button" class="referenceFeatureCard" data-feature-symbol="'+esc(symbol)+'">'+
          '<span class="referenceFeatureTop"><span class="referenceFeatureIcon" aria-hidden="true">'+esc(symbol.slice(0,1))+'</span><span><strong>'+esc(symbol)+'</strong><small>'+esc(item?.name||"尚未获得公司信息")+'</small></span></span>'+
          '<span class="referenceFeatureValue">'+(valid?num(item.price):"--")+'</span>'+
          '<span class="referenceFeatureChange '+(change===null?"":change>=0?"up":"down")+'">'+(change===null?"暂无有效涨跌幅":((change>=0?"+":"")+num(change)+"%"))+
          '</span></button>';
      }).join("")||'<span class="empty">当前市场无股票代码</span>';
      $$("#referenceFeatureCards [data-feature-symbol]").forEach(b=>b.onclick=()=>{const quote=q[b.dataset.featureSymbol];if(quote&&!quote.error)drawMarket(quote);});
    }
    $("#marketRows").innerHTML=rows.map(x=>{
      const usable=!x.error&&Number.isFinite(Number(x.price));
      const stamp=usable&&x.lastTradeAt?dt(x.lastTradeAt):"--";
      return `<button type="button" class="marketRow referenceMarketRow marketPick" data-symbol="${esc(x.symbol)}" data-initial-index="${syms.indexOf(x.symbol)}" data-change-pct="${usable&&x.changePct!=null?Number(x.changePct):0}" aria-pressed="false"><span class="marketCompany"><strong class="link">${esc(x.symbol)}</strong><small>${esc(x.name||x.symbol)}</small><small>${esc(x.exchange||"--")}</small></span><span>${usable?num(x.price):"--"}<small class="muted"> ${esc(x.currency||"")}</small></span><span class="${usable&&Number(x.changePct)>=0?"up":usable?"down":""}">${usable&&x.changePct!=null?((Number(x.changePct)>=0?"+":"")+num(x.changePct)+"%"):"--"}<small class="quoteTimeBadge">${esc(stamp)}</small></span></button>`;
    }).join("")||'<div class="empty">暂无行情数据</div>';
    $$(".marketPick").forEach(r=>r.onclick=()=>drawMarket(q[r.dataset.symbol]));
    const marketText=$("#marketListFilter")?.value.trim().toLowerCase()||"";
    if(marketText)$$("#marketRows .marketRow").forEach(row=>row.hidden=!row.textContent.toLowerCase().includes(marketText));
    const first=rows.find(x=>x.symbol===selectedSymbol&&!x.error&&Number.isFinite(Number(x.price)))||rows.find(x=>!x.error&&Number.isFinite(Number(x.price)));
    if(first) drawMarket(first);
    else {
      $("#mSymbol").textContent=syms[0]||"--";
      publishUIData("market",{status:"error"});
      $("#mName").textContent="当前股票暂无可用行情";
      $("#mExchange").textContent="请更换股票或市场";
      $("#mPrice").textContent="--";
      $("#mChange").textContent="--";
      currentMarketQuote=null;
      $("#marketMetrics").innerHTML="";
      $("#mCurrency").textContent="";
      $("#mExchangeBadge").textContent="";
      $("#marketRangeNote").textContent="";
      if(state.charts.market){state.charts.market.destroy();delete state.charts.market}
    }
  };
  $$("[data-range]").forEach(b=>b.onclick=()=>{marketRange=b.dataset.range;$$("[data-range]").forEach(t=>{t.classList.toggle("active",t===b);t.setAttribute("aria-pressed",String(t===b))});if(currentMarketQuote)drawMarket(currentMarketQuote)});
  $$("#referenceMarketTabs [data-market-preset]").forEach(button=>button.onclick=()=>{
    const key=button.dataset.marketPreset;
    $("#marketCountry").value=key;
    $("#marketCountry").dispatchEvent(new Event("change",{bubbles:true}));
  });
  $$("#referenceMarketTabs [data-market-preset]").forEach(button=>button.classList.toggle("active",button.dataset.marketPreset==="RO"));
  $$(".referenceMarketFilters [data-market-sort]").forEach(button=>button.onclick=()=>{
    $$(".referenceMarketFilters [data-market-sort]").forEach(item=>item.classList.toggle("active",item===button));
    const rows=$$("#marketRows .marketRow");
    const mode=button.dataset.marketSort;
    const pct=node=>Number(node.dataset.changePct);
    const sorted=mode==="original"?rows.sort((a,b)=>Number(a.dataset.initialIndex)-Number(b.dataset.initialIndex)):
      rows.sort((a,b)=>mode==="gain"?pct(b)-pct(a):pct(a)-pct(b));
    sorted.forEach(row=>$("#marketRows").append(row));
  });
  $("#marketListFilter").oninput=e=>{
    const q=e.target.value.trim().toLowerCase();
    $$("#marketRows .marketRow").forEach(row=>row.hidden=!!q&&!row.textContent.toLowerCase().includes(q));
  };
  $("#marketCountry").onchange=e=>{
    $("#marketSymbols").value=MARKET_PRESETS[e.target.value].symbols.join(",");
    $$("#referenceMarketTabs [data-market-preset]").forEach(item=>item.classList.toggle("active",item.dataset.marketPreset===e.target.value));
    load().catch(()=>{});
  };
  $("#marketSymbols").onchange=load;
  await load().catch(error=>{publishUIData("market",{status:"error"});throw error;});
  state.marketRefreshTimer=setInterval(()=>{if(state.activeView==="market")load().catch(()=>publishUIData("market",{status:"error"}))},60000);
}
let marketChartRequest=0;
async function drawMarket(x){
 const request=++marketChartRequest,selectedRange=marketRange;
  const usable=x&&!x.error&&Number.isFinite(Number(x.price));
  $("#mSymbol").textContent=x?.symbol||"--";
  $("#mName").textContent=usable?(x.name||x.symbol):"暂无可用行情";
  $("#mExchange").textContent=[x?.country,x?.exchange,x?.currency,x?.source].filter(Boolean).join(" · ");
  $("#mPrice").textContent=usable?num(x.price):"--";
  $("#mChange").textContent=usable&&x.changePct!=null?(Number(x.changePct)>=0?"+":"")+num(x.changePct)+"%":"--";
  $("#mChange").className="quoteChange "+(usable&&x.changePct!=null?(Number(x.changePct)>=0?"up":"down"):"");
  currentMarketQuote=x;
  publishUIData("market",{status:usable?"ok":"error",receivedAt:x?.uiReceivedAt,quoteAt:x?.lastTradeAt||null,marketState:x?.marketState||"",realtime:x?.realtime,delaySeconds:x?.delaySeconds||0});
  $("#mCurrency").textContent=x?.currency||"";
  $("#mExchangeBadge").textContent=x?.exchange||"—";
  $$(".marketPick").forEach(r=>{const active=r.dataset.symbol===x?.symbol;r.classList.toggle("active",active);r.setAttribute("aria-pressed",String(active))});
  const sourcePoints=(x?.points||[]).filter(p=>p.close!=null&&Number.isFinite(Number(p.close)));
  const available=p=>p!=null&&Number.isFinite(Number(p));
  const fmt=v=>available(v)?num(v):"—";
  const today=sourcePoints.filter(p=>new Date(p.t).toLocaleDateString("en-CA",{timeZone:ROMANIA_TZ})===new Date(x?.lastTradeAt||sourcePoints.at(-1)?.t||Date.now()).toLocaleDateString("en-CA",{timeZone:ROMANIA_TZ}));
  const highs=today.map(p=>p.high).filter(available).map(Number),lows=today.map(p=>p.low).filter(available).map(Number);
  const volumes=today.map(p=>p.volume).filter(available).map(Number);
  const metrics=[["今开",fmt(today[0]?.open)],["最高",fmt(highs.length?Math.max(...highs):null)],["最低",fmt(lows.length?Math.min(...lows):null)],["成交量",volumes.length?num(volumes.reduce((a,b)=>a+b,0),0):"—"],["成交额","—"],["昨收",fmt(x?.previousClose)]];
  const metricIcons=["<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" fill=\"currentColor\" class=\"metricIcon metricIcon0\" aria-hidden=\"true\" viewBox=\"0 0 16 16\">\n  <path d=\"M5.5 9.511c.076.954.83 1.697 2.182 1.785V12h.6v-.709c1.4-.098 2.218-.846 2.218-1.932 0-.987-.626-1.496-1.745-1.76l-.473-.112V5.57c.6.068.982.396 1.074.85h1.052c-.076-.919-.864-1.638-2.126-1.716V4h-.6v.719c-1.195.117-2.01.836-2.01 1.853 0 .9.606 1.472 1.613 1.707l.397.098v2.034c-.615-.093-1.022-.43-1.114-.9zm2.177-2.166c-.59-.137-.91-.416-.91-.836 0-.47.345-.822.915-.925v1.76h-.005zm.692 1.193c.717.166 1.048.435 1.048.91 0 .542-.412.914-1.135.982V8.518z\"/>\n  <path d=\"M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16\"/>\n  <path d=\"M8 13.5a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11m0 .5A6 6 0 1 0 8 2a6 6 0 0 0 0 12\"/>\n</svg>", "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" fill=\"currentColor\" class=\"metricIcon metricIcon1\" aria-hidden=\"true\" viewBox=\"0 0 16 16\">\n  <path fill-rule=\"evenodd\" d=\"M8 15a.5.5 0 0 0 .5-.5V2.707l3.146 3.147a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 1 0 .708.708L7.5 2.707V14.5a.5.5 0 0 0 .5.5\"/>\n</svg>", "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" fill=\"currentColor\" class=\"metricIcon metricIcon2\" aria-hidden=\"true\" viewBox=\"0 0 16 16\">\n  <path fill-rule=\"evenodd\" d=\"M8 1a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L7.5 13.293V1.5A.5.5 0 0 1 8 1\"/>\n</svg>", "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" fill=\"currentColor\" class=\"metricIcon metricIcon3\" aria-hidden=\"true\" viewBox=\"0 0 16 16\">\n  <path d=\"M11 2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v12h.5a.5.5 0 0 1 0 1H.5a.5.5 0 0 1 0-1H1v-3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3h1V7a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v7h1z\"/>\n</svg>", "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" fill=\"currentColor\" class=\"metricIcon metricIcon4\" aria-hidden=\"true\" viewBox=\"0 0 16 16\">\n  <path d=\"M4.318 2.687C5.234 2.271 6.536 2 8 2s2.766.27 3.682.687C12.644 3.125 13 3.627 13 4c0 .374-.356.875-1.318 1.313C10.766 5.729 9.464 6 8 6s-2.766-.27-3.682-.687C3.356 4.875 3 4.373 3 4c0-.374.356-.875 1.318-1.313M13 5.698V7c0 .374-.356.875-1.318 1.313C10.766 8.729 9.464 9 8 9s-2.766-.27-3.682-.687C3.356 7.875 3 7.373 3 7V5.698c.271.202.58.378.904.525C4.978 6.711 6.427 7 8 7s3.022-.289 4.096-.777A5 5 0 0 0 13 5.698M14 4c0-1.007-.875-1.755-1.904-2.223C11.022 1.289 9.573 1 8 1s-3.022.289-4.096.777C2.875 2.245 2 2.993 2 4v9c0 1.007.875 1.755 1.904 2.223C4.978 15.71 6.427 16 8 16s3.022-.289 4.096-.777C13.125 14.755 14 14.007 14 13zm-1 4.698V10c0 .374-.356.875-1.318 1.313C10.766 11.729 9.464 12 8 12s-2.766-.27-3.682-.687C3.356 10.875 3 10.373 3 10V8.698c.271.202.58.378.904.525C4.978 9.71 6.427 10 8 10s3.022-.289 4.096-.777A5 5 0 0 0 13 8.698m0 3V13c0 .374-.356.875-1.318 1.313C10.766 14.729 9.464 15 8 15s-2.766-.27-3.682-.687C3.356 13.875 3 13.373 3 13v-1.302c.271.202.58.378.904.525C4.978 12.71 6.427 13 8 13s3.022-.289 4.096-.777c.324-.147.633-.323.904-.525\"/>\n</svg>", "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" fill=\"currentColor\" class=\"metricIcon metricIcon5\" aria-hidden=\"true\" viewBox=\"0 0 16 16\">\n  <path d=\"M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71z\"/>\n  <path d=\"M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0\"/>\n</svg>"];
  $("#marketMetrics").innerHTML=metrics.map(([label,value],i)=>`<div class="marketMetric">${metricIcons[i]}<div><label>${tr(label,state.lang)}</label><strong>${esc(value)}</strong></div></div>`).join("");
  state.charts.market?.destroy();state.charts.market=null;
  const note=$("#marketRangeNote"),canvas=$("#marketChart");
  canvas.removeAttribute("aria-label");
  if(!usable){note.textContent="暂无可用行情";return;}
  note.textContent=x.symbol+" · "+selectedRange+" · 加载历史数据…";
  let pts=[];
  try{
    if(demoMode){pts=selectedRange==="1D"?sourcePoints:[];}
    else{
      const response=await fetch("/api/market?symbols="+encodeURIComponent(x.symbol)+"&range="+encodeURIComponent(selectedRange));
      const data=await response.json(),row=data.rows?.[0];
      if(!response.ok||row?.error)throw new Error("历史行情不可用");
      pts=(row?.points||[]).filter(p=>p.close!=null&&Number.isFinite(Number(p.close)));
    }
  }catch(error){if(request===marketChartRequest&&canvas.isConnected)note.textContent=x.symbol+" · "+selectedRange+" · 历史行情暂不可用，请重试";return;}
  if(request!==marketChartRequest||!canvas.isConnected)return;
  if(!pts.length){note.textContent=x.symbol+" · "+selectedRange+" · "+(demoMode?"模拟环境未提供该周期历史数据":"该周期暂无历史数据");return;}
  const options=selectedRange==="1D"?{hour:"2-digit",minute:"2-digit"}:{year:"numeric",month:"2-digit",day:"2-digit",...(selectedRange==="1W"?{hour:"2-digit",minute:"2-digit"}:{})};
  const labels=pts.map(p=>new Date(p.t).toLocaleString(localeFor(state.lang),{timeZone:ROMANIA_TZ,...options}));
  note.textContent=x.symbol+" · "+selectedRange+" · "+pts.length+" 个数据点 · "+labels[0]+" — "+labels.at(-1);
  canvas.setAttribute("role","img");canvas.setAttribute("aria-label",note.textContent);
  state.charts.market=new Chart($("#marketChart"),{
    type:"line",
    data:{labels,datasets:[{label:x.symbol+" "+tr("行情价",state.lang),data:pts.map(p=>p.close),borderColor:"#ef3456",backgroundColor:"rgba(239,52,86,.18)",fill:true,tension:.35,pointRadius:0,pointHoverRadius:4}]},
    options:{...chartOpts(),plugins:{...chartOpts().plugins,legend:{display:false}}}
  });
  state.charts.market.$bvSymbol=x.symbol;
}

async function renderReports(){
  const byOwner={};
  for(const c of state.customers){
    const o=state.staff.find(s=>s.id===c.owner_user_id)?.display_name||"未知";
    byOwner[o]=(byOwner[o]||0)+1;
  }

  const reportStaff=state.profile.role==="admin"
    ? state.staff.filter(s=>s.status==="active"&&s.role!=="admin")
    : [state.profile];

  const staffRows=reportStaff.map(s=>{
    const cs=state.customers.filter(c=>c.owner_user_id===s.id);
    const ids=new Set(cs.map(c=>c.id));
    const holding=new Set(state.positions.filter(p=>Number(p.quantity)>0&&ids.has(p.customer_id)).map(p=>p.customer_id));
    return `<tr><td>${esc(s.display_name)}</td><td>${roleName(s.role)}</td><td>${cs.length}</td><td>${holding.size}</td></tr>`;
  }).join("");

  $("#main").innerHTML=pageHead("统计报表","按当前权限范围实时汇总，不使用虚拟业务数据。")+`
    <section class="grid2">
      <article class="panel"><div class="panelHead"><div><h2>客户归属分布</h2><div class="panelSubtitleRow"><p>按二级负责人统计</p><span class="inlineLegend goldLegend">客户数量 · ${state.customers.length}</span></div></div></div><div class="chartBox ownerChartBox" style="--owner-count:${Object.keys(byOwner).length}"><canvas id="ownerChart"></canvas></div></article>
      <article class="panel"><div class="panelHead"><div><h2>买卖结构</h2><div class="panelSubtitleRow"><p>交易记录数量</p><span class="inlineLegend up">买入 · ${state.trades.filter(t=>t.side==="buy").length}</span><span class="inlineLegend down">卖出 · ${state.trades.filter(t=>t.side==="sell").length}</span></div></div></div><div class="chartBox"><canvas id="sideChart"></canvas></div></article>
    </section>
    <section class="reportsLower"><article class="panel"><div class="panelHead"><div><h2>人员客户统计</h2><p>按角色层级计算可见客户数量</p></div></div><div class="tableWrap"><table class="dataTable"><thead><tr><th>人员</th><th>角色</th><th>客户数量</th><th>持仓客户</th></tr></thead><tbody>${staffRows||'<tr><td colspan="4"><div class="empty">暂无人员数据</div></td></tr>'}</tbody></table></div></article><article class="panel monthlyReport"><div class="panelHead"><h2>月度成交额 / 笔数</h2><input id="reportMonth" class="input" type="month" value="${romaniaDateKey().slice(0,7)}"><select id="reportCurrency" class="select"><option>USD</option><option>RON</option></select></div><p class="reportScope" id="reportScope"></p><div class="chartBox" style="height:140px;min-height:100px"><canvas id="monthlyTradeChart"></canvas></div><div class="tableWrap" id="monthlyTradeRows"></div></article></section>`;
  const renderMonthly=()=>{const monthly=monthlyTradeTotals(state.trades,state.customers),currency=$("#reportCurrency").value,selected=$("#reportMonth").value;const rows=monthly.filter(r=>r.month===selected&&r.currency===currency);$("#monthlyTradeRows").innerHTML=`<table class="dataTable"><thead><tr><th>月份</th><th>买入成交额</th><th>卖出成交额</th><th>笔数</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.month)}</td><td>${money(r.buy,r.currency)}</td><td>${money(r.sell,r.currency)}</td><td>${r.count}</td></tr>`).join("")||'<tr><td colspan="4">该月该币种暂无交易</td></tr>'}</tbody></table>`;$("#reportScope").textContent=selected.slice(0,4)+" 年按月走势 · "+currency+"；下表为所选月份";const series=monthly.filter(r=>r.currency===currency&&r.month.startsWith(selected.slice(0,4)));state.charts.monthly?.destroy();state.charts.monthly=new Chart($("#monthlyTradeChart"),{type:"bar",data:{labels:series.map(r=>r.month),datasets:[{label:tr("买入",state.lang)+" · "+currency,data:series.map(r=>r.buy),backgroundColor:"#8eafd0"},{label:tr("卖出",state.lang)+" · "+currency,data:series.map(r=>r.sell),backgroundColor:"#ef3456"}]},options:chartOpts()});window.dispatchEvent(new Event("crm-layout"));};
  $("#reportMonth").onchange=renderMonthly;$("#reportCurrency").onchange=renderMonthly;renderMonthly();
  state.charts.owner=new Chart($("#ownerChart"),{type:"bar",data:{labels:Object.keys(byOwner),datasets:[{label:tr("客户数量",state.lang),data:Object.values(byOwner),backgroundColor:"#8eafd0",maxBarThickness:36}]},options:{...chartOpts(),plugins:{...chartOpts().plugins,legend:{display:false}},indexAxis:"y",scales:{x:{...chartOpts().scales.x,beginAtZero:true,ticks:{...chartOpts().scales.x.ticks,precision:0}},y:{...chartOpts().scales.y,ticks:{...chartOpts().scales.y.ticks,autoSkip:false}}}}});
  state.charts.side=new Chart($("#sideChart"),{type:"doughnut",data:{labels:[tr("买入",state.lang),tr("卖出",state.lang)],datasets:[{data:[state.trades.filter(t=>t.side==="buy").length,state.trades.filter(t=>t.side==="sell").length],backgroundColor:["#00d59b","#ef3456"],borderColor:"#fffefa",borderWidth:0}]},options:{responsive:true,maintainAspectRatio:false,cutout:"72%",plugins:{...chartOpts().plugins,legend:{display:false}}}});
}

async function renderSettings(){
  $("#main").classList.add("settingsMain");
  const s=state.appSettings||{};
  $("#main").innerHTML=`
    <section class="grid3 settingsGrid">
      <article class="panel settingsCard"><div class="panelHead"><div><h2>当前账户</h2><p>登录身份</p></div><button class="btn" id="settingsNameBtn">修改账号名称</button></div><div class="panelBody list settingsList"><div class="listItem"><div class="top"><span>账号</span><span>${esc(state.profile.username)}</span></div></div><div class="listItem"><div class="top"><span>姓名</span><span>${esc(state.profile.display_name)}</span></div></div><div class="listItem"><div class="top"><span>角色</span><span>${roleName(state.profile.role)}</span></div></div><div class="listItem"><div class="top"><span>语言</span><span>${state.lang==="zh"?"中文":state.lang==="en"?"English":"Română"}</span></div></div></div></article>
      <article class="panel settingsCard"><div class="panelHead"><div><h2>交易时段</h2><p>Europe/Bucharest</p></div></div><div class="panelBody list settingsList"><div class="listItem"><div class="top"><span>开盘时间</span><span>${String(s.market_open_time||"09:30").slice(0,5)}</span></div></div><div class="listItem"><div class="top"><span>目标交易时间</span><span>${String(s.target_trade_time||"14:30").slice(0,5)}</span></div></div>${state.profile.role==="admin"?'<button class="btn primary" id="settingsTimeBtn">修改交易时段</button>':""}</div></article>
      <article class="panel settingsCard"><div class="panelHead"><div><h2>行情数据</h2><p>FREE MARKET DATA</p></div></div><div class="panelBody list settingsList"><div class="listItem"><div class="top"><span>覆盖市场</span><span>RO / US / FR / DE / GB / IT / ES / NL / CH / PL / JP</span></div></div><div class="listItem"><div class="top"><span>显示规则</span><span>最新报价 + 罗马尼亚更新时间</span></div></div><div class="listItem"><div class="top"><span>公司信息</span><span>股票名称 / 代码自动搜索</span></div></div></div></article>
    </section>`;
  if(demoMode){
    const card=document.createElement('article');card.className='panel settingsCard';
    card.innerHTML=`<div class="panelHead"><h2>查看账号</h2></div><div class="panelBody"><p class="muted">虚构数据 · 非真实交易 · 编辑仅保存在本机</p><select class="input" aria-label="查看账号"></select></div>`;
    const select=card.querySelector('select');
    for(const account of supabase.previewAccounts()){const option=document.createElement('option');option.value=account.id;option.textContent=account.name;select.append(option);}
    select.value=state.profile.id;select.onchange=()=>supabase.selectPreviewAccount(select.value);
    $("#main .settingsGrid").append(card);
  }
  $("#settingsNameBtn").onclick=openAccountNameForm;
  const b=$("#settingsTimeBtn");if(b)b.onclick=()=>openTimeSettings(featureCtx());
}

function openAccountNameForm(){
  modal("修改账号名称",`<form id="accountNameForm" class="formGrid"><div class="field full"><label>显示名称</label><input class="input" name="display_name" maxlength="80" value="${esc(state.profile.display_name)}" required></div><div class="field full"><button class="btn primary">保存</button></div></form>`);
  $("#accountNameForm").onsubmit=async event=>{event.preventDefault();const form=event.currentTarget,name=String(new FormData(form).get("display_name")||"").trim();if(!name||name.length>80){toast("名称须为1至80个字符",true);return}form.querySelector("button").disabled=true;
    try{const result=await supabase.from("profiles").update({display_name:name}).eq("id",state.profile.id).select("id,display_name").single();if(result.error||!result.data)throw result.error||new Error("未保存，请核查数据库权限");state.profile.display_name=result.data.display_name;closeModal();renderShell();await refreshAll();toast("账号名称已更新");}catch(error){toast(error.message||"未能保存",true);form.querySelector("button").disabled=false;}
  };
}

function translatedModalTitle(title){
  const raw=String(title||"");
  const parts=raw.split(" · ");
  if(parts.length>1)return tr(parts[0],state.lang)+" · "+parts.slice(1).join(" · ");
  return tr(raw,state.lang);
}
function modal(title,html){
  const root=$("#modalRoot");
  const markup=`<div class="modal nestedModal" role="dialog" aria-modal="true" aria-label="${esc(translatedModalTitle(title))}"><div class="modalCard"><div class="modalHead"><h2>${esc(translatedModalTitle(title))}</h2><button class="close modalCloseBtn" type="button" aria-label="${tr("关闭",state.lang)}">×</button></div><div class="modalBody">${html}</div></div></div>`;
  const client=root.querySelector("#clientSharePage");
  if(client)root.insertAdjacentHTML("beforeend",markup);
  else root.innerHTML=markup;
  const close=[...root.querySelectorAll(".modalCloseBtn")].at(-1);
  if(close)close.onclick=()=>closeModal();
  const current=root.querySelector('.nestedModal:last-child');
  current.querySelectorAll('.field').forEach((field,index)=>{
    const label=field.querySelector('label'),control=field.querySelector('input,select,textarea');
    if(label&&control){if(!control.id)control.id='modal-field-'+Date.now()+'-'+index;label.htmlFor=control.id;}
  });
  translateUI(root,state.lang);
  queueMicrotask(()=>root.querySelector('.nestedModal:last-child input,.nestedModal:last-child select,.nestedModal:last-child button')?.focus());
}
function closeModal(all=false){
  const root=$("#modalRoot");
  const nested=[...root.querySelectorAll(".nestedModal")].at(-1);
  if(!all&&nested&&root.querySelector("#clientSharePage")){nested.remove();return}
  if(state.customerMarketTimer){clearInterval(state.customerMarketTimer);state.customerMarketTimer=null}
  if(state.customerCaptureEscapeHandler){document.removeEventListener('keydown',state.customerCaptureEscapeHandler);state.customerCaptureEscapeHandler=null}
  document.body.classList.remove('screenshotCaptureMode');
  state.activeCustomer=null;
  root.innerHTML="";
}

window.addEventListener("popstate",()=>{if(!state.profile)return;const route=location.hash.match(/^#allocation\/([123])$/);if(route){state.activeProjectNumber=Number(route[1]);switchView("shareboard")}else if(state.activeView==="shareboard")switchView("dashboard")});
supabase?.auth.onAuthStateChange(async(event,session)=>{if(event==="SIGNED_OUT"){exitProjectPresentation(featureCtx());clearMarketRefreshTimers();state.allocationProjects=[];state.allocationRecords=[];state.allocationOwnerId=null;state.session=null;state.profile=null;state.activeView="dashboard";renderLogin(true)}});
installViewportLayout({getLanguage:()=>state.lang});
if(!demoMode&&!desktopBackend.ready){$("#root").innerHTML=`<main class="backendPending" style="max-width:560px;margin:15vh auto;padding:32px"><h1>独立系统配置中</h1><p>${esc(desktopBackend.reason)}</p><p>当前未连接业务数据库，登录与数据操作已停用。</p></main>`}else if(demoMode&&new URLSearchParams(location.search).get("loginPreview")==="1"){renderLogin(true)}else{(async()=>{const {data:{session}}=await supabase.auth.getSession();if(session){state.session=session;await loadProfileAndStart()}else renderLogin(await checkBootstrap())})()}
