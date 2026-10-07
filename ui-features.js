const LANG_KEY="bv_language";
const dictionaries={
  en:{
    "总览大盘":"Dashboard","客户中心":"Customers","人员中心":"Staff","交易记录":"Trades","持仓中心":"Positions","行情中心":"Markets","统计报表":"Reports","系统设置":"Settings","股票份额看板":"Share Allocation",
    "系统正常":"System Online","退出":"Sign out","登录系统":"Sign in","账号":"Account","密码":"Password","安全登录":"Secure login","数据库权限隔离":"Database access isolation","操作记录审计":"Audit trail",
    "客户列表":"Customer List","新增客户":"New Client","全部状态":"All Status","潜在客户":"Prospect","服务中":"In Service","持仓中":"Holding","已结束":"Closed","已归档":"Archived",
    "人员账户管理":"Staff Accounts","新建人员账户":"Create Staff Account","重置密码":"Reset Password","禁用":"Disable","启用":"Enable",
    "交易流水":"Trade Ledger","当前持仓明细":"Current Positions","刷新持仓":"Refresh Positions","多国家行情":"Global Markets","股票列表":"Securities",
    "管理员":"Administrator","一级人员":"Level 1","二级人员":"Level 2","客户姓名":"Client Name","性别":"Gender","男性":"Male","女性":"Female","未填写":"Not set","年龄（可选）":"Age (optional)","地区（可选）":"Region (optional)",
    "客户备注":"Client Notes","编辑客户备注":"Edit Client Notes","新增交易":"Add Trade","记录跟进":"Add Service Note","截图模式":"Screenshot Mode","恢复显示":"Restore","返回":"Back",
    "持仓成本":"Cost Basis","最新行情市值":"Latest Market Value","未实现盈亏":"Unrealized P/L","已实现盈亏":"Realized P/L","综合收益率":"Total Return","最近交易":"Latest Trade",
    "客户持仓与买卖记录":"Client Holdings & Trades","客户资料与服务纪要":"Client Profile & Service Notes","持仓结构 / 收益构成":"Allocation / P&L Mix","持仓收益走势":"Position P/L Trend",
    "买入":"Buy","卖出":"Sell","买进":"Buy","卖出":"Sell","时间":"Time","数量":"Quantity","价格":"Price","手续费":"Fees","备注":"Notes","保存交易":"Save Trade",
    "股票份额":"Share Allocation","剩余份额":"Remaining Shares","已预留份额":"Reserved Shares","总份额":"Total Shares","剩余占比":"Remaining Ratio","距离交易剩余时间":"Time Remaining",
    "时段预留份额":"Reserved Shares by Time","时段参与人数":"Participants by Time","罗马尼亚时间":"Romania Time","最新数据时间":"Latest Data Time","更新时间":"Updated",
    "业务使用情况":"Business Activity","当前账户":"Current Account","角色":"Role","团队人员":"Team Members","客户总数":"Clients","今日交易":"Today Trades","待跟进":"Pending Follow-up","刷新":"Refresh",
    "语言":"Language","交易时段":"Trading Window","份额配置":"Allocation Setup","保存设置":"Save Settings","开盘时间":"Market Open","目标交易时间":"Target Trade Time",
    "跟进中":"Following","搜索姓名 / 编号 / 电话":"Search name / ID / phone","风险级别":"Risk Level","低":"Low","普通":"Normal","高":"High","电话（可选）":"Phone (optional)","邮箱（可选）":"Email (optional)","资金规模（可选）":"Capital (optional)","资金币种":"Currency","客户状态":"Client Status","归属二级人员":"Assigned Level 2","客户备注（由二级人员填写）":"Client Notes","保存客户资料":"Save Client","市场":"Market","交易类型":"Trade Type","股票代码":"Symbol","股票名称":"Security Name","币种":"Currency","交易时间":"Trade Time","沟通渠道":"Channel","下次跟进":"Next Service","跟进内容":"Service Note","保存跟进记录":"Save Service Note","姓名":"Name","上级":"Supervisor","状态":"Status","创建时间":"Created","操作":"Action","查看":"View","客户":"Clients","持仓":"Positions","交易":"Trades","报表":"Reports","设置":"Settings","概览":"Overview","跟进":"Service","趋势":"Trend","成交价":"Price","成交金额":"Value","持仓标的":"Open Securities","当前持仓":"Current Positions","成本基准":"Cost Basis","份额看板":"Allocation Board","修改交易时段":"Edit Trading Window","显示规则":"Display Rule","公司信息":"Company Info","我的客户":"My Clients","持仓客户":"Holding Clients","今日买入":"Buys Today","今日卖出":"Sells Today","累计买进":"Total Buys","累计卖出":"Total Sells","编辑账号":"Edit Account","删除账号":"Delete Account","保存账号修改":"Save Account Changes","新建人员账户":"Create Staff Account","人员账户管理":"Staff Accounts","最高管理员":"Top Administrator","所属一级人员":"Assigned Level 1","创建账户":"Create Account","电话":"Phone","当前状态":"Current Status"
  },
  ro:{
    "总览大盘":"Panou general","客户中心":"Clienți","人员中心":"Personal","交易记录":"Tranzacții","持仓中心":"Poziții","行情中心":"Piețe","统计报表":"Rapoarte","系统设置":"Setări","股票份额看板":"Alocare acțiuni",
    "系统正常":"Sistem activ","退出":"Ieșire","登录系统":"Autentificare","账号":"Cont","密码":"Parolă","安全登录":"Autentificare securizată","数据库权限隔离":"Izolare acces bază de date","操作记录审计":"Jurnal de audit",
    "客户列表":"Lista clienților","新增客户":"Client nou","全部状态":"Toate stările","潜在客户":"Prospect","服务中":"În servicii","持仓中":"Cu poziții","已结束":"Închis","已归档":"Arhivat",
    "人员账户管理":"Conturi personal","新建人员账户":"Cont nou","重置密码":"Resetare parolă","禁用":"Dezactivare","启用":"Activare",
    "交易流水":"Registru tranzacții","当前持仓明细":"Poziții curente","刷新持仓":"Actualizare poziții","多国家行情":"Piețe globale","股票列表":"Instrumente",
    "管理员":"Administrator","一级人员":"Nivel 1","二级人员":"Nivel 2","客户姓名":"Nume client","性别":"Gen","男性":"Bărbat","女性":"Femeie","未填写":"Necompletat","年龄（可选）":"Vârstă (opțional)","地区（可选）":"Regiune (opțional)",
    "客户备注":"Notițe client","编辑客户备注":"Editare notițe","新增交易":"Tranzacție nouă","记录跟进":"Notă de serviciu","截图模式":"Mod captură","恢复显示":"Restabilire","返回":"Înapoi",
    "持仓成本":"Cost poziții","最新行情市值":"Valoare de piață","未实现盈亏":"P/L nerealizat","已实现盈亏":"P/L realizat","综合收益率":"Randament total","最近交易":"Ultima tranzacție",
    "客户持仓与买卖记录":"Poziții și tranzacții client","客户资料与服务纪要":"Profil client și note de serviciu","持仓结构 / 收益构成":"Alocare / structură P&L","持仓收益走势":"Evoluție P/L",
    "买入":"Cumpărare","卖出":"Vânzare","买进":"Cumpărare","时间":"Timp","数量":"Cantitate","价格":"Preț","手续费":"Comision","备注":"Notițe","保存交易":"Salvare tranzacție",
    "股票份额":"Alocare acțiuni","剩余份额":"Acțiuni rămase","已预留份额":"Acțiuni rezervate","总份额":"Total acțiuni","剩余占比":"Procent rămas","距离交易剩余时间":"Timp rămas",
    "时段预留份额":"Acțiuni rezervate pe interval","时段参与人数":"Participanți pe interval","罗马尼亚时间":"Ora României","最新数据时间":"Ora ultimei actualizări","更新时间":"Actualizat",
    "业务使用情况":"Activitate","当前账户":"Cont curent","角色":"Rol","团队人员":"Membri echipă","客户总数":"Clienți","今日交易":"Tranzacții azi","待跟进":"De urmărit","刷新":"Actualizare",
    "语言":"Limbă","交易时段":"Interval tranzacționare","份额配置":"Configurare alocare","保存设置":"Salvare setări","开盘时间":"Deschidere piață","目标交易时间":"Ora țintă",
    "跟进中":"În urmărire","搜索姓名 / 编号 / 电话":"Caută nume / ID / telefon","风险级别":"Nivel risc","低":"Scăzut","普通":"Normal","高":"Ridicat","电话（可选）":"Telefon (opțional)","邮箱（可选）":"Email (opțional)","资金规模（可选）":"Capital (opțional)","资金币种":"Monedă","客户状态":"Stare client","归属二级人员":"Responsabil Nivel 2","客户备注（由二级人员填写）":"Notițe client","保存客户资料":"Salvare client","市场":"Piață","交易类型":"Tip tranzacție","股票代码":"Simbol","股票名称":"Denumire instrument","币种":"Monedă","交易时间":"Ora tranzacției","沟通渠道":"Canal","下次跟进":"Următor serviciu","跟进内容":"Notă serviciu","保存跟进记录":"Salvare notă","姓名":"Nume","上级":"Coordonator","状态":"Stare","创建时间":"Creat","操作":"Acțiune","查看":"Vezi","客户":"Clienți","持仓":"Poziții","交易":"Tranzacții","报表":"Rapoarte","设置":"Setări","概览":"Prezentare","跟进":"Serviciu","趋势":"Tendință","成交价":"Preț","成交金额":"Valoare","持仓标的":"Instrumente deschise","当前持仓":"Poziții curente","成本基准":"Bază cost","份额看板":"Panou alocare","修改交易时段":"Modificare interval","显示规则":"Regulă afișare","公司信息":"Informații companie","我的客户":"Clienții mei","持仓客户":"Clienți cu poziții","今日买入":"Cumpărări azi","今日卖出":"Vânzări azi","累计买进":"Cumpărări totale","累计卖出":"Vânzări totale","编辑账号":"Editare cont","删除账号":"Ștergere cont","保存账号修改":"Salvare modificări","新建人员账户":"Cont personal nou","人员账户管理":"Conturi personal","最高管理员":"Administrator principal","所属一级人员":"Nivel 1 responsabil","创建账户":"Creare cont","电话":"Telefon","当前状态":"Stare curentă"
  }
};

export function getLang(){return localStorage.getItem(LANG_KEY)||"zh"}
export function setLang(lang){const v=["zh","en","ro"].includes(lang)?lang:"zh";localStorage.setItem(LANG_KEY,v);return v}
export function localeFor(lang){return lang==="ro"?"ro-RO":lang==="en"?"en-GB":"zh-CN"}
export function tr(text,lang=getLang()){
  if(lang==="zh")return text;
  return dictionaries[lang]?.[text]||text;
}
export function translateUI(root=document,lang=getLang()){
  if(lang==="zh")return;
  const dict=dictionaries[lang]||{};
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  const nodes=[];let n;while((n=walker.nextNode()))nodes.push(n);
  for(const node of nodes){
    const raw=node.nodeValue,trim=raw.trim();
    if(trim&&dict[trim])node.nodeValue=raw.replace(trim,dict[trim]);
  }
  root.querySelectorAll?.("[placeholder]").forEach(el=>{
    const p=el.getAttribute("placeholder");if(dict[p])el.setAttribute("placeholder",dict[p]);
  });
}
export function languageOptions(lang){
  return `<option value="zh" ${lang==="zh"?"selected":""}>中文</option><option value="en" ${lang==="en"?"selected":""}>English</option><option value="ro" ${lang==="ro"?"selected":""}>Română</option>`;
}
export function roleLabel(role,lang=getLang()){
  const zh=role==="admin"?"管理员":role==="level1"?"一级人员":"二级人员";
  return tr(zh,lang);
}
export function customerStatusLabel(status,lang=getLang()){
  const zh=({prospect:"潜在客户",following:"服务中",holding:"持仓中",closed:"已结束",archived:"已归档"})[status]||status;
  return tr(zh,lang);
}

function fmtNumber(v,d=2,lang=getLang()){
  return Number(v||0).toLocaleString(localeFor(lang),{maximumFractionDigits:d});
}
function timeHHMM(v){
  if(!v)return"--:--";
  const d=new Date(v);if(Number.isNaN(d.getTime()))return"--:--";
  return new Intl.DateTimeFormat(localeFor(),{timeZone:"Europe/Bucharest",hour:"2-digit",minute:"2-digit",hour12:false}).format(d);
}
function minutesOfRomania(ts){
  const p=new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/Bucharest",hour:"2-digit",minute:"2-digit",hour12:false}).formatToParts(new Date(ts));
  const o=Object.fromEntries(p.map(x=>[x.type,x.value]));
  return Number(o.hour)*60+Number(o.minute);
}
function hhmmToMinutes(v){
  const m=String(v||"00:00").match(/(\d{1,2}):(\d{2})/);return m?Number(m[1])*60+Number(m[2]):0;
}
function safePct(v){return Number.isFinite(Number(v))?Number(v):null}

export function miniCandlesHTML(points=[],label=""){
  const p=points.filter(x=>x&&x.close!=null).slice(-18);
  if(!p.length)return '<div class="miniNoData">--</div>';
  const all=p.flatMap(x=>[x.high??x.close,x.low??x.close]).map(Number).filter(Number.isFinite);
  const lo=Math.min(...all),hi=Math.max(...all),span=Math.max(hi-lo,0.000001);
  const candles=p.map((x,i)=>{
    const o=Number(x.open??x.close),c=Number(x.close),h=Number(x.high??Math.max(o,c)),l=Number(x.low??Math.min(o,c));
    const top=(hi-h)/span*100,bottom=(l-lo)/span*100;
    const bodyTop=(hi-Math.max(o,c))/span*100,bodyBottom=(Math.min(o,c)-lo)/span*100;
    const bodyH=Math.max(6,100-bodyTop-bodyBottom);
    const stamp=x.t?timeHHMM(x.t):"--:--";
    const tip=`${stamp}  O ${fmtNumber(o,2)}  H ${fmtNumber(h,2)}  L ${fmtNumber(l,2)}  C ${fmtNumber(c,2)}`;
    return `<i class="miniCandle ${c>=o?"upC":"downC"}" title="${tip}" style="--x:${i};--top:${top}%;--bottom:${bottom}%;--bodyTop:${bodyTop}%;--bodyH:${bodyH}%"></i>`;
  }).join("");
  return `<div class="miniCandleWrap"><div class="miniCandleLabel">${label}</div><div class="miniCandles" style="--count:${p.length}">${candles}</div></div>`;
}
function calcRSI(points=[],period=14){
  const c=points.filter(x=>x?.close!=null).map(x=>Number(x.close)).filter(Number.isFinite);
  if(c.length<period+1)return[];
  const out=[];
  for(let i=period;i<c.length;i++){
    let gain=0,loss=0;
    for(let j=i-period+1;j<=i;j++){const d=c[j]-c[j-1];if(d>0)gain+=d;else loss-=d}
    const rs=loss===0?100:gain/loss;out.push(100-(100/(1+rs)));
  }
  return out.slice(-24);
}
export function miniRSIHTML(points=[]){
  const r=calcRSI(points);
  if(!r.length)return '<div class="miniIndicator"><span>RSI</span><b>--</b></div>';
  const w=180,h=54;
  const pts=r.map((v,i)=>`${(i/(Math.max(1,r.length-1))*w).toFixed(1)},${(h-(v/100*h)).toFixed(1)}`).join(" ");
  return `<div class="miniIndicator" title="RSI(14): ${fmtNumber(r.at(-1),1)}"><div class="miniIndicatorHead"><span>RSI(14)</span><b>${fmtNumber(r.at(-1),1)}</b></div><svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><line x1="0" y1="${h*.3}" x2="${w}" y2="${h*.3}" /><line x1="0" y1="${h*.7}" x2="${w}" y2="${h*.7}" /><polyline points="${pts}"/></svg></div>`;
}

function energyColor(ratio){
  if(ratio>60)return"#14e76d";
  if(ratio>30)return"#d9ad3d";
  return"#ff626e";
}
function countdownText(ctx,target){
  const date=ctx.romaniaDateKey();
  const iso=ctx.romaniaLocalToISO(date+"T"+String(target||"14:30").slice(0,5));
  const ms=new Date(iso).getTime()-Date.now();
  if(!Number.isFinite(ms)||ms<=0)return"00:00:00";
  const s=Math.floor(ms/1000),hh=Math.floor(s/3600),mm=Math.floor((s%3600)/60),ss=s%60;
  return [hh,mm,ss].map(x=>String(x).padStart(2,"0")).join(":");
}
function indexName(symbol){
  return ({"^GSPC":"S&P 500","^DJI":"Dow Jones","^IXIC":"Nasdaq","^FCHI":"CAC 40","BET.RO":"BET","^GDAXI":"DAX","^FTSE":"FTSE 100","FTSEMIB.MI":"FTSE MIB","^IBEX":"IBEX 35","^AEX":"AEX","^SSMI":"SMI","WIG20.WA":"WIG20","^N225":"Nikkei 225"})[symbol]||symbol;
}
function marketWall(rows,ctx){
  return rows.map(x=>{
    const ok=x&&!x.error&&Number.isFinite(Number(x.price)),pct=ok&&x.changePct!=null?Number(x.changePct):null;
    return `<article class="indexTile">
      <div class="indexTileHead"><span>${indexName(x?.symbol||"--")}</span><small>${x?.lastTradeAt?timeHHMM(x.lastTradeAt):"--:--"}</small></div>
      <div class="indexTilePrice">${ok?fmtNumber(x.price,2):"--"}</div>
      <div class="indexTilePct ${pct==null?"":pct>=0?"up":"down"}">${pct==null?"--":(pct>=0?"+":"")+fmtNumber(pct,2)+"%"}</div>
      ${miniCandlesHTML(x?.points||[])}
    </article>`;
  }).join("");
}

export async function renderShareBoard(ctx){
  const {state,$,fetchQuotes,esc,num,dt,chartOpts}=ctx;
  if(state.profile?.role!=="admin"){ctx.toast("仅管理员可访问",true);ctx.switchView("dashboard");return}
  const board=state.shareBoard;
  if(!board){
    $("#main").innerHTML=`<article class="panel shareBoardEmpty"><div><div class="shareBrandMark">BV<small>1996</small></div><h2>股票份额看板尚未配置</h2><p>请在管理员总览使用“份额配置”完成股票、总份额和剩余份额设置。</p></div></article>`;
    return;
  }
  const symbols=["^GSPC","^DJI","^IXIC","^FCHI","BET.RO","^GDAXI","^FTSE","FTSEMIB.MI","^IBEX","^AEX","^SSMI","WIG20.WA","^N225"];
  const [security,quotes]=await Promise.all([
    fetch("/api/security-info?symbol="+encodeURIComponent(board.symbol)).then(r=>r.ok?r.json():null).catch(()=>null),
    fetchQuotes(symbols,{realtimeOnly:false})
  ]);
  const rows=symbols.map(s=>quotes[s]||{symbol:s,error:true});
  const total=Number(board.total_shares||0),remaining=Number(board.remaining_shares||0),reserved=Math.max(0,total-remaining);
  const ratio=total?Math.max(0,Math.min(100,remaining/total*100)):0;
  const color=energyColor(ratio);
  const settings=state.appSettings||{market_open_time:"09:30",target_trade_time:"14:30",energy_high:60,energy_low:30};
  const openMin=hhmmToMinutes(settings.market_open_time),targetMin=hhmmToMinutes(settings.target_trade_time);
  const cap=Math.min(openMin,targetMin>0?targetMin:openMin);
  const validSlots=(state.shareSlots||[]).filter(s=>{
    const m=minutesOfRomania(s.slot_at);return m>=360&&m<=cap;
  }).sort((a,b)=>new Date(a.slot_at)-new Date(b.slot_at));
  const latest=security&&Number.isFinite(Number(security.price))?security:null;
  $("#main").innerHTML=`
    <section class="allocationBoard" style="--energy-color:${color}">
      <div class="allocationIdentity panel">
        <div class="allocationCompany">
          <div class="shareBrandMark">BV<small>1996</small></div>
          <div><span class="eyebrow">BRANTONE VEYLOR · SHARE ALLOCATION</span><h1>${esc(board.company_name||security?.companyName||board.stock_name||board.symbol)}</h1><p>${esc(board.symbol)} · ${esc(board.exchange||security?.exchange||"--")} · ${esc(board.currency||security?.currency||"--")} · ${esc(board.industry||security?.industry||"")}</p></div>
        </div>
        <div class="allocationQuote"><span id="allocationQuotePrice">${latest?fmtNumber(latest.price,2):"--"}</span><b id="allocationQuoteChange" class="${safePct(latest?.changePct)>=0?"up":"down"}">${latest&&latest.changePct!=null?(Number(latest.changePct)>=0?"+":"")+fmtNumber(latest.changePct,2)+"%":"--"}</b><small id="allocationQuoteTime">${latest?.lastTradeAt?dt(latest.lastTradeAt):"--"}</small></div>
        <div class="allocationMini" id="allocationMini">${miniCandlesHTML(latest?.points||[],board.symbol)}</div>
      </div>

      <div class="allocationHero">
        <article class="panel shareTotals">
          <div><small>总份额</small><span>${num(total,2)}</span></div>
          <div><small>已预留份额</small><span>${num(reserved,2)}</span></div>
          <div><small>剩余份额</small><span class="energyText">${num(remaining,2)}</span></div>
        </article>
        <article class="panel energyPanel">
          <div class="energyRing" style="--ratio:${ratio}"><div><small>剩余占比</small><strong>${fmtNumber(ratio,2)}%</strong><span>${num(remaining,2)}</span></div></div>
        </article>
        <article class="panel countdownPanel">
          <span>ROMANIA / BUCHAREST</span><strong id="allocationRomaniaClock">${ctx.romaniaClockText()}</strong>
          <div class="timePair"><small>开盘时间</small><b>${String(settings.market_open_time||"09:30").slice(0,5)}</b></div>
          <div class="timePair"><small>目标交易时间</small><b>${String(settings.target_trade_time||"14:30").slice(0,5)}</b></div>
          <div class="countdownBox"><small>距离交易剩余时间</small><strong id="allocationCountdown">${countdownText(ctx,settings.target_trade_time)}</strong></div>
        </article>
      </div>

      <div class="allocationCharts">
        <article class="panel allocationChartPanel"><div class="panelHead compact"><div><h2>时段预留份额</h2><p>有效罗马尼亚业务时段</p></div></div><div class="chartBox"><canvas id="reservedSlotChart"></canvas></div></article>
        <article class="panel allocationChartPanel"><div class="panelHead compact"><div><h2>时段参与人数</h2><p>有效罗马尼亚业务时段</p></div></div><div class="chartBox"><canvas id="participantSlotChart"></canvas></div></article>
      </div>

      <div class="globalIndexWall" id="globalIndexWall">${marketWall(rows,ctx)}</div>
    </section>`;

  const labels=validSlots.map(s=>timeHHMM(s.slot_at));
  if(validSlots.length){
    state.charts.reservedSlots=new Chart($("#reservedSlotChart"),{type:"line",data:{labels,datasets:[{label:"预留份额",data:validSlots.map(s=>Number(s.reserved_shares||0)),borderColor:color,backgroundColor:color+"22",fill:true,tension:.28,pointRadius:3,pointHoverRadius:5}]},options:chartOpts()});
    state.charts.participantSlots=new Chart($("#participantSlotChart"),{type:"bar",data:{labels,datasets:[{label:"参与人数",data:validSlots.map(s=>Number(s.participant_count||0)),backgroundColor:color+"88",borderColor:color,borderWidth:1,borderRadius:5}]},options:chartOpts()});
  }else{
    $("#reservedSlotChart").parentElement.innerHTML='<div class="empty">暂无有效时段份额记录</div>';
    $("#participantSlotChart").parentElement.innerHTML='<div class="empty">暂无有效时段参与记录</div>';
  }
  clearInterval(state.allocationClockTimer);
  state.allocationClockTimer=setInterval(()=>{
    const c=$("#allocationRomaniaClock"),d=$("#allocationCountdown");
    if(c)c.textContent=ctx.romaniaClockText();
    if(d)d.textContent=countdownText(ctx,settings.target_trade_time);
  },1000);

  if(state.shareBoardRefreshTimer)clearInterval(state.shareBoardRefreshTimer);
  const refreshMs=Math.max(10000,Number(settings.share_board_refresh_seconds||60)*1000);
  state.shareBoardRefreshTimer=setInterval(async()=>{
    if(state.activeView!=="shareboard"||!$("#globalIndexWall")){
      clearInterval(state.shareBoardRefreshTimer);state.shareBoardRefreshTimer=null;return;
    }
    try{
      const [freshSecurity,freshQuotes]=await Promise.all([
        fetch("/api/security-info?symbol="+encodeURIComponent(board.symbol)).then(r=>r.ok?r.json():null).catch(()=>null),
        fetchQuotes(symbols,{realtimeOnly:false})
      ]);
      const freshRows=symbols.map(s=>freshQuotes[s]||{symbol:s,error:true});
      const wall=$("#globalIndexWall");if(wall)wall.innerHTML=marketWall(freshRows,ctx);
      const priceEl=$("#allocationQuotePrice"),changeEl=$("#allocationQuoteChange"),timeEl=$("#allocationQuoteTime"),mini=$("#allocationMini");
      if(priceEl)priceEl.textContent=freshSecurity&&Number.isFinite(Number(freshSecurity.price))?fmtNumber(freshSecurity.price,2):"--";
      if(changeEl){
        const pct=safePct(freshSecurity?.changePct);
        changeEl.textContent=pct==null?"--":(pct>=0?"+":"")+fmtNumber(pct,2)+"%";
        changeEl.className=pct==null?"":pct>=0?"up":"down";
      }
      if(timeEl)timeEl.textContent=freshSecurity?.lastTradeAt?dt(freshSecurity.lastTradeAt):"--";
      if(mini)mini.innerHTML=miniCandlesHTML(freshSecurity?.points||[],board.symbol);
    }catch{}
  },refreshMs);
}

export function openTimeSettings(ctx){
  if(ctx.state.profile?.role!=="admin")return;
  const s=ctx.state.appSettings||{};
  ctx.modal("交易时段",`<form id="timeSettingsForm" class="formGrid">
    <div class="field"><label>开盘时间</label><input class="input" type="time" name="market_open_time" value="${String(s.market_open_time||"09:30").slice(0,5)}" required></div>
    <div class="field"><label>目标交易时间</label><input class="input" type="time" name="target_trade_time" value="${String(s.target_trade_time||"14:30").slice(0,5)}" required></div>
    <div class="field"><label>默认语言</label><select class="select" name="default_language">${languageOptions(s.default_language||ctx.state.lang||"zh")}</select></div>
    <div class="field"><label>看板刷新秒数</label><input class="input" type="number" min="10" max="3600" name="share_board_refresh_seconds" value="${Number(s.share_board_refresh_seconds||60)}"></div>
    <div class="field full"><button class="btn primary" type="submit">保存设置</button></div>
  </form>`);
  ctx.$("#timeSettingsForm").onsubmit=async e=>{
    e.preventDefault();const b=Object.fromEntries(new FormData(e.currentTarget).entries());
    b.id=1;b.share_board_refresh_seconds=Number(b.share_board_refresh_seconds||60);b.updated_at=new Date().toISOString();
    const {error}=await ctx.supabase.from("app_settings").upsert(b,{onConflict:"id"});
    if(error){ctx.toast(error.message,true);return}
    ctx.closeModal();ctx.toast("设置已保存");await ctx.refreshAll();
  };
}

export function openShareBoardConfig(ctx){
  if(ctx.state.profile?.role!=="admin")return;
  const b=ctx.state.shareBoard;
  ctx.modal("份额配置",`<div class="shareConfigWrap">
    <div class="field"><label>股票名称或代码</label><div class="searchInline"><input id="securityQuery" class="input" value="${ctx.esc(b?.symbol||"")}" placeholder="AAPL / Apple / TLV.RO"><button class="btn" id="securitySearchBtn" type="button">查询</button></div></div>
    <div id="securitySearchResults" class="securitySearchResults"></div>
    <form id="shareBoardForm" class="formGrid">
      <input type="hidden" name="id" value="${ctx.esc(b?.id||"")}">
      <div class="field"><label>股票代码</label><input class="input" name="symbol" value="${ctx.esc(b?.symbol||"")}" required></div>
      <div class="field"><label>公司名称</label><input class="input" name="company_name" value="${ctx.esc(b?.company_name||"")}"></div>
      <div class="field"><label>交易所</label><input class="input" name="exchange" value="${ctx.esc(b?.exchange||"")}"></div>
      <div class="field"><label>币种</label><input class="input" name="currency" value="${ctx.esc(b?.currency||"USD")}"></div>
      <div class="field"><label>总份额</label><input class="input" type="number" min="0.0001" step="0.0001" name="total_shares" value="${b?.total_shares??""}" required></div>
      <div class="field"><label>剩余份额</label><input class="input" type="number" min="0" step="0.0001" name="remaining_shares" value="${b?.remaining_shares??""}" required></div>
      <div class="field"><label>看板日期</label><input class="input" type="date" name="board_date" value="${b?.board_date||ctx.romaniaDateKey()}" required></div>
      <div class="field full"><button class="btn primary" type="submit">保存份额看板</button></div>
    </form>
    <div class="slotEditorHead"><span>时段预留数据</span><button id="addSlotBtn" class="btn" type="button">添加时段记录</button></div>
    <div id="slotEditorRows" class="slotEditorRows"></div>
  </div>`);

  const renderSlots=()=>{
    const rows=ctx.state.shareSlots||[];
    ctx.$("#slotEditorRows").innerHTML=rows.map(s=>`<div class="slotRow"><span>${ctx.dt(s.slot_at)}</span><span>预留 ${ctx.num(s.reserved_shares,2)}</span><span>人数 ${ctx.num(s.participant_count,0)}</span></div>`).join("")||'<div class="empty">暂无时段记录</div>';
  };
  renderSlots();

  ctx.$("#securitySearchBtn").onclick=async()=>{
    const q=ctx.$("#securityQuery").value.trim();if(!q)return;
    const box=ctx.$("#securitySearchResults");box.innerHTML='<div class="empty">查询中…</div>';
    try{
      const r=await fetch("/api/security-search?q="+encodeURIComponent(q));const j=await r.json();
      box.innerHTML=(j.rows||[]).map(x=>`<button type="button" class="securityResult" data-symbol="${ctx.esc(x.symbol)}"><b>${ctx.esc(x.symbol)}</b><span>${ctx.esc(x.name||x.symbol)}</span><small>${ctx.esc(x.exchangeDisplay||x.exchange||"")}</small></button>`).join("")||'<div class="empty">没有找到匹配股票</div>';
      ctx.$$(".securityResult",box).forEach(btn=>btn.onclick=async()=>{
        const symbol=btn.dataset.symbol;
        const ir=await fetch("/api/security-info?symbol="+encodeURIComponent(symbol));const info=await ir.json();
        const form=ctx.$("#shareBoardForm");
        form.elements.symbol.value=info.symbol||symbol;
        form.elements.company_name.value=info.companyName||info.stockName||"";
        form.elements.exchange.value=info.exchange||"";
        form.elements.currency.value=info.currency||"USD";
        box.innerHTML="";
      });
    }catch(e){box.innerHTML='<div class="empty">股票查询失败</div>'}
  };

  ctx.$("#shareBoardForm").onsubmit=async e=>{
    e.preventDefault();const x=Object.fromEntries(new FormData(e.currentTarget).entries());
    const id=x.id||null;delete x.id;
    x.symbol=String(x.symbol||"").trim().toUpperCase();x.total_shares=Number(x.total_shares);x.remaining_shares=Number(x.remaining_shares);
    x.stock_name=x.company_name;x.market=x.exchange;x.country=null;x.industry=null;x.created_by=ctx.state.profile.id;x.updated_at=new Date().toISOString();
    if(x.remaining_shares>x.total_shares){ctx.toast("剩余份额不能大于总份额",true);return}
    let error;
    if(id)({error}=await ctx.supabase.from("share_boards").update(x).eq("id",id));
    else ({error}=await ctx.supabase.from("share_boards").insert(x));
    if(error){ctx.toast(error.message,true);return}
    ctx.closeModal();ctx.toast("份额看板已保存");await ctx.refreshAll();
  };

  ctx.$("#addSlotBtn").onclick=()=>{
    if(!ctx.state.shareBoard?.id){ctx.toast("请先保存股票份额看板",true);return}
    openSlotForm(ctx);
  };
}
function openSlotForm(ctx){
  ctx.modal("添加时段记录",`<form id="slotForm" class="formGrid">
    <div class="field"><label>罗马尼亚时间</label><input class="input" type="datetime-local" name="slot_at" value="${ctx.romaniaInputNow()}" required></div>
    <div class="field"><label>该时段预留份额</label><input class="input" type="number" min="0" step="0.0001" name="reserved_shares" required></div>
    <div class="field"><label>参与预留人数</label><input class="input" type="number" min="0" step="1" name="participant_count" required></div>
    <div class="field full"><button class="btn primary" type="submit">保存时段记录</button></div>
  </form>`);
  ctx.$("#slotForm").onsubmit=async e=>{
    e.preventDefault();const x=Object.fromEntries(new FormData(e.currentTarget).entries());
    x.board_id=ctx.state.shareBoard.id;x.slot_at=ctx.romaniaLocalToISO(x.slot_at);x.reserved_shares=Number(x.reserved_shares);x.participant_count=Number(x.participant_count);
    const {error}=await ctx.supabase.from("share_board_slots").upsert(x,{onConflict:"board_id,slot_at"});
    if(error){ctx.toast(error.message,true);return}
    ctx.closeModal();ctx.toast("时段记录已保存");await ctx.refreshAll();
  };
}
