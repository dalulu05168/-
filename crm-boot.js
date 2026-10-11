// Bootstrap separately from the CRM app so blocked CDN resources or a failed module
// cannot leave a blank, unclickable page. No CRM credentials or customer data here.
const cdns=[
  "https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.7/chart.umd.min.js",
  "https://unpkg.com/chart.js@4.4.7/dist/chart.umd.js"
];
function loadSource(src,deadline=3500){
  return new Promise(resolve=>{
    if(window.Chart){resolve(true);return;}
    const script=document.createElement('script');script.src=src;script.async=true;script.crossOrigin='anonymous';
    let done=false;
    const finish=ok=>{
      if(done)return;done=true;clearTimeout(timer);
      if(!ok)script.remove();
      resolve(ok&&!!window.Chart);
    };
    const timer=setTimeout(()=>finish(false),deadline);
    script.onload=()=>finish(true);
    script.onerror=()=>finish(false);
    document.head.append(script);
  });
}
function fallbackChart(){
  // A clearly labeled chart-unavailable placeholder; never invent market data.
  class UnavailableChart{
    static defaults={font:{},plugins:{tooltip:{}},animation:{},devicePixelRatio:1,interaction:{}};
    static register(){}
    constructor(canvas,config={}){
      this.canvas=canvas;this.data=config.data||{datasets:[]};this.options=config.options||{};
      this.tooltip={getActiveElements:()=>[]};
      if(canvas?.parentElement){
        canvas.hidden=true;
        const notice=document.createElement('p');
        notice.className='crmChartUnavailable';
        notice.setAttribute('role','status');
        notice.textContent='图表组件暂时无法加载 · 数据卡片与管理功能仍可使用';
        canvas.parentElement.append(notice);
        this._notice=notice;
      }
    }
    update(){}resize(){}clear(){}render(){}stop(){}
    destroy(){this._notice?.remove();if(this.canvas)this.canvas.hidden=false;}
  }
  window.Chart=UnavailableChart;
  document.body.dataset.crmChartFallback='1';
}
function showBootError(error){
  console.error('CRM initialization failed',error);
  const root=document.getElementById('root');
  if(!root)return;
  const safeMessage=String(error?.message||error||'加载异常');
  const box=document.createElement('section');
  box.className='crmStartupRecovery';
  const heading=document.createElement('h2');heading.textContent='页面暂时无法操作';
  const desc=document.createElement('p');desc.textContent='前端初始化失败，请重新进入测试站。详细错误已保留在浏览器控制台。';
  const detail=document.createElement('small');detail.textContent=safeMessage.slice(0,220);
  const actions=document.createElement('div');
  const reload=document.createElement('button');reload.textContent='重新加载';reload.onclick=()=>location.reload();
  const signIn=document.createElement('button');signIn.textContent='重新验证访问';signIn.onclick=()=>location.assign('/_preview/login');
  actions.append(reload,signIn);box.append(heading,desc,detail,actions);
  root.replaceChildren(box);
}
(async()=>{
  try{
    let loaded=!!window.Chart;
    if(!loaded){for(const url of cdns){if(await loadSource(url)){loaded=true;break;}}}
    if(!loaded)fallbackChart();
    await import('/app.js?v=20261011-stable-bootstrap-v1');
    // A module can import successfully but still fail during async initialization.
    setTimeout(()=>{
      if(document.body.dataset.crmInteractiveReady==='1')return;
      const root=document.getElementById('root');
      if(root&&!root.querySelector('.crmStartupRecovery'))showBootError(new Error('CRM 界面初始化超时，检查登录有效期和本地演示数据'));
    },10000);
  }catch(error){showBootError(error);}
})();
