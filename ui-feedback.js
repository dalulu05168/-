// Read-only UI feedback for the existing refresh paths; no new polling or writes.
const hasDOM=typeof document!=='undefined';
const states=new Map(),values=new Map(),timers=new WeakMap();let view='',queued=false;const recovered=new Set();
const copy={zh:{loading:'更新中',error:'读取失败',offline:'离线',waiting:'网络恢复，待刷新',ok:'已更新',empty:'尚未读取',quote:'报价',missing:'报价时间未提供',realtime:'实时数据源',delayed:'延迟',nonreal:'非实时源',unknown:'状态未提供',REGULAR:'交易中',TRADING:'交易中',CLOSED:'已收市',PRE:'盘前',POST:'盘后'},en:{loading:'Updating',error:'Read failed',offline:'Offline',waiting:'Online; refresh required',ok:'Updated',empty:'Not loaded',quote:'Quote',missing:'Quote time unavailable',realtime:'Real-time source',delayed:'Delay',nonreal:'Non-live source',unknown:'Status unavailable',REGULAR:'Trading',TRADING:'Trading',CLOSED:'Closed',PRE:'Pre-market',POST:'After-hours'},ro:{loading:'Actualizare',error:'Citire eșuată',offline:'Offline',waiting:'Online; reîncarcă datele',ok:'Actualizat',empty:'Neîncărcat',quote:'Cotație',missing:'Ora cotației indisponibilă',realtime:'Sursă în timp real',delayed:'Întârziere',nonreal:'Sursă întârziată',unknown:'Stare indisponibilă',REGULAR:'Tranzacționare',TRADING:'Tranzacționare',CLOSED:'Închis',PRE:'Pre-deschidere',POST:'După închidere'}};
const language=()=>document.documentElement.lang.split('-')[0];
const words=()=>copy[language()]||copy.zh;
const stamp=value=>{const date=new Date(value);if(!value||!Number.isFinite(date.getTime()))return '';const locale=language()==='zh'?'zh-CN':language()==='ro'?'ro-RO':'en-GB',options={timeZone:'Europe/Bucharest'};const today=new Date().toLocaleDateString('en-CA',options),day=date.toLocaleDateString('en-CA',options);return (day===today?'':date.toLocaleDateString(locale,{...options,month:'2-digit',day:'2-digit'})+' ')+date.toLocaleTimeString(locale,{...options,hour12:false});};
export function publishUIData(scope,detail){
 if(!hasDOM)return;
 if(detail.status)recovered.delete(scope);
 const previous=states.get(scope)||{};
 const next={...previous,...detail};
 if(detail.status==='ok'){next.receivedAt=detail.receivedAt||Date.now();recovered.delete(scope);}
 states.set(scope,next);schedule();
}
function label(scope){const s=states.get(scope),w=words();let status=navigator.onLine===false?'offline':recovered.has(scope)?'waiting':s?.status||'empty';let text=w[status]||w.error;
 if(status==='ok')text=w.ok+' '+stamp(s.receivedAt);
 if(scope==='market'&&status==='ok'){
  const mode=w[String(s.marketState||'').toUpperCase()]||w.unknown;
  const delay=Number(s.delaySeconds)>0?w.delayed+' '+Math.ceil(Number(s.delaySeconds)/60)+' min':s.realtime===true?w.realtime:s.realtime===false?w.nonreal:'';
  text=[mode,delay,s.quoteAt?w.quote+' '+stamp(s.quoteAt):w.missing,text].filter(Boolean).join(' · ');
 }
 return {text,status};
}
function statusFor(scope,container,existing){
 if(!container)return;
 let node=existing||container.querySelector('.dataStatus');
 if(!node){node=document.createElement(scope==='projects'?'small':'p');node.className='dataStatus';node.setAttribute('role','status');node.setAttribute('aria-live','polite');container.append(node);}
 if(!node.classList.contains('dataStatus')){node.dataset.originalCaption=node.textContent;node.classList.add('dataStatus');node.setAttribute('role','status');}
 const next=label(scope);if(node.textContent!==next.text)node.textContent=next.text;node.dataset.state=next.status;node.title=next.text;
}
function pulse(node,key){
 const value=node.textContent.trim(),previous=values.get(key);values.set(key,value);
 if(previous===undefined||previous===value||matchMedia('(prefers-reduced-motion:reduce)').matches)return;
 clearTimeout(timers.get(node));node.classList.remove('dataChanged');void node.offsetWidth;node.classList.add('dataChanged');timers.set(node,setTimeout(()=>node.classList.remove('dataChanged'),700));
}
function render(){
 queued=false;const main=document.querySelector('#main');if(!main){view='';values.clear();return;}
 const health=document.querySelector('#systemHealth');if(health){const state=label('business');health.title=state.text;health.setAttribute('aria-label',state.text);health.classList.toggle('syserror',['offline','error'].includes(state.status));health.classList.toggle('syswaiting',['loading','waiting'].includes(state.status));}
 const nextView=main.dataset.view;if(nextView!==view){view=nextView;values.clear();}
 if(view==='dashboard')statusFor('business',main.querySelector('.studioTrend .panelHead>div:first-child'),main.querySelector('.studioTrend .panelHead p'));
 if(view==='market')statusFor('market',main.querySelector('.marketOverviewPanel .panelHead>div:first-child'));
 if(view==='shareboard')statusFor('projects',document.querySelector('.trialDisplayIdentity'));
 if(!['dashboard','market','shareboard'].includes(view))return;
 for(const node of main.querySelectorAll('.studioMetric>strong,.level2Metric>strong,.referenceFeatureValue,#mPrice,.projectOverviewNumbers strong,.projectProgressRing text')){
  const card=node.closest('[data-studio-view],[data-feature-symbol],.projectOverviewCard,.level2Metric');
  const id=card?.dataset.featureSymbol||card?.querySelector('.studioMetricIndex,.projectInternalLabel')?.textContent||card?.dataset.studioView||[...main.querySelectorAll('.level2Metric')].indexOf(card);
  const type=node.id|| (node.matches('.referenceFeatureValue')?'ticker':node.matches('.projectProgressRing text')?'ratio':node.matches('.projectOverviewNumbers strong')?'allocation':'metric');
  pulse(node,view+':'+(node.id==='mPrice'?document.querySelector('#mSymbol')?.textContent:id)+':'+type);
 }
}
function schedule(){if(!hasDOM)return;if(!queued){queued=true;requestAnimationFrame(render);}}
if(hasDOM){
 new MutationObserver(schedule).observe(document.querySelector('#root'),{childList:true,subtree:true});
 addEventListener('offline',schedule);addEventListener('online',()=>{for(const scope of states.keys())recovered.add(scope);schedule();});
 schedule();
}
