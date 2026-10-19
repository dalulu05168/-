// Opt-in visual trial. Uses the isolated simulator only; no backend changes.
const params=new URLSearchParams(location.search);
if(params.get('designPreview')==='1' && params.get('demo')==='1'){
 document.body.classList.add('designPreview');
 const sheet=document.createElement('link');sheet.rel='stylesheet';sheet.href='/design-preview.css';document.head.append(sheet);
 let homes=[],toolbar,screen;
 function sync(){
  const form=document.querySelector('#loginForm');
  if(form&&!form.dataset.trial){
   form.dataset.trial='true';
   const title=document.querySelector('.loginCardDescription');if(title)title.textContent='界面试览 · 使用模拟数据，不连接业务数据库';
   const button=form.querySelector('[type="submit"]');button.textContent='进入模拟工作台 ↗';button.type='button';
   button.onclick=()=>{location.href='/?demo=1&account=TEST-A002&designPreview=1#allocation/1';};
   form.addEventListener('submit',event=>{event.preventDefault();event.stopImmediatePropagation();button.click();},true);
  }
  const top=document.querySelector('.topbar');
  const isProject=document.querySelector('#main')?.dataset.view==='shareboard';
  document.body.classList.toggle('projectScreenTrial',!!isProject);
  if(top&&isProject){
   if(!screen?.isConnected){
    screen=document.createElement('div');screen.className='trialDisplay';screen.setAttribute('aria-label','项目动态信息屏');
    screen.innerHTML='<div class="trialDisplayIdentity"><span class="trialLiveDot"></span><span>PROJECT MONITOR</span><small>项目预留份额</small></div><div class="trialDisplayReadings"></div><time class="trialDisplayTime"></time>';
    top.append(screen);
    toolbar=document.createElement('div');toolbar.className='trialToolbar';toolbar.setAttribute('aria-label','项目功能工具栏');top.after(toolbar);
    const replay=document.createElement('a');replay.className='trialReplay';replay.href='/?demo=1&loginPreview=1&designPreview=1';replay.textContent='查看登录动画';toolbar.append(replay);
    homes=[];
    for(const node of top.querySelectorAll(':scope > #pageActionsSlot,:scope > .globalSearch,:scope > .userArea')){
     const marker=document.createComment('trial-toolbar-home');node.before(marker);homes.push([node,marker]);toolbar.append(node);
    }
   }
   const readings=screen.querySelector('.trialDisplayReadings');
   const cards=[...document.querySelectorAll('.projectOverviewCard')].slice(0,3);
   const values=cards.map(card=>({name:card.querySelector('h2,h3')?.textContent||'PROJECT',amount:card.querySelector('.projectOverviewNumbers strong')?.textContent||'—',color:getComputedStyle(card).getPropertyValue('--project-accent')}));
   const key=JSON.stringify(values);
   if(readings.dataset.values!==key){readings.dataset.values=key;readings.replaceChildren(...values.map(v=>{const item=document.createElement('div'),name=document.createElement('small'),amount=document.createElement('strong');name.textContent=v.name;amount.textContent=v.amount;amount.style.setProperty("--trial-reading-color",v.color);item.append(name,amount);return item;}));}
  }else if(screen){
   for(const [node,marker] of homes){if(marker.isConnected)marker.replaceWith(node);}
   toolbar?.remove();screen.remove();screen=null;homes=[];
  }
  const chart=window.Chart?.getChart(document.querySelector('#marketChart'));
  if(chart&&!chart.$trialPalette){chart.$trialPalette=true;for(const d of chart.data.datasets){d.borderColor='#efc45f';d.backgroundColor='rgba(239,196,95,.10)';d.borderWidth=2;d.tension=.2;}chart.update('none');}
 }
 let pending=false;
 new MutationObserver(()=>{if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;sync();});}).observe(document.querySelector('#root'),{childList:true,subtree:true});
 setInterval(()=>{const time=screen?.querySelector('time');if(time)time.textContent=new Date().toLocaleTimeString('en-GB',{timeZone:'Europe/Bucharest'})+' · BUCHAREST';},1000);
 sync();
}
