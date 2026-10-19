// Shared visual layer; simulated login behavior is restricted to the explicit trial.
const params=new URLSearchParams(location.search);
const trialMode=params.get('designPreview')==='1' && params.get('demo')==='1';
{
 document.body.classList.add('designPreview');
 if(window.Chart){
  Chart.defaults.font.family='Segoe UI, Microsoft YaHei, PingFang SC, Arial, sans-serif';Chart.defaults.font.size=13;Chart.defaults.font.weight='normal';
  Chart.register({id:'elleryUniformTypography',beforeUpdate(chart){
   for(const scale of Object.values(chart.options.scales||{})){if(scale.ticks)scale.ticks.font={size:13,weight:'normal'};if(scale.title)scale.title.font={size:13,weight:'normal'};}
   const plugins=chart.options.plugins||{};if(plugins.legend?.labels)plugins.legend.labels.font={size:13,weight:'normal'};
   if(plugins.tooltip){plugins.tooltip.titleFont={size:13,weight:'normal'};plugins.tooltip.bodyFont={size:13,weight:'normal'};}
  }});
 }

 let toolbar,screen,toggle;
 let collapsed=false;
 try{collapsed=localStorage.getItem('ellery-navigation-hidden')==='1';}catch{}
 function sync(){
  const top=document.querySelector('.topbar'),nav=document.querySelector('.nav');
  if(top&&nav){
   if(!toggle?.isConnected){
    toggle=document.createElement('button');toggle.className='navigationToggle';toggle.type='button';toggle.setAttribute('aria-controls','sideNavigation');
    toggle.onclick=()=>{collapsed=!collapsed;try{localStorage.setItem('ellery-navigation-hidden',collapsed?'1':'0');}catch{}window.elleryPreferences?.setNavigationHidden(collapsed).catch(()=>{});sync();requestAnimationFrame(()=>{dispatchEvent(new Event('resize'));dispatchEvent(new Event('crm-layout'));});};
    top.append(toggle);
   }
   document.body.classList.toggle('navCollapsed',collapsed);
   if(toggle.dataset.collapsed!==String(collapsed)){toggle.dataset.collapsed=String(collapsed);toggle.textContent=collapsed?'☰':'‹';}toggle.setAttribute('aria-label',collapsed?'展开导航栏':'隐藏导航栏');toggle.title=collapsed?'展开导航栏':'隐藏导航栏';toggle.setAttribute('aria-expanded',String(!collapsed));
   if(!toolbar?.isConnected){
    toolbar=document.createElement('div');toolbar.className='trialToolbar';toolbar.setAttribute('aria-label','页面功能工具栏');
    for(const node of top.querySelectorAll(':scope > #pageActionsSlot,:scope > .globalSearch,:scope > .userArea'))toolbar.append(node);
   }
   const docked=matchMedia('(min-width:1001px)').matches&&!collapsed;
   document.body.classList.toggle('sidebarToolsDocked',docked);
   const anchor=docked?nav:top;if(toolbar.previousElementSibling!==anchor)anchor.after(toolbar);
  }
  const form=document.querySelector('#loginForm');
  if(trialMode&&form&&!form.dataset.trial){
   form.dataset.trial='true';
   const title=document.querySelector('.loginCardDescription');if(title)title.textContent='界面试览 · 使用模拟数据，不连接业务数据库';
   const button=form.querySelector('[type="submit"]');button.textContent='进入模拟工作台 ↗';button.type='button';
   button.onclick=()=>{location.href='/?demo=1&account=TEST-A002&designPreview=1#allocation/1';};
   form.addEventListener('submit',event=>{event.preventDefault();event.stopImmediatePropagation();button.click();},true);
  }
  const isProject=document.querySelector('#main')?.dataset.view==='shareboard';
  document.body.classList.toggle('projectScreenTrial',!!isProject);
  if(top&&isProject){
   if(!screen?.isConnected){
    screen=document.createElement('div');screen.className='trialDisplay';screen.setAttribute('aria-label','项目动态信息屏');
    screen.innerHTML='<div class="trialDisplayIdentity"><span class="trialLiveDot"></span><span>PROJECT MONITOR</span><small>项目预留份额</small></div><div class="trialDisplayReadings"></div><time class="trialDisplayTime"></time>';
    top.append(screen);screen.querySelector('time').textContent=new Date().toLocaleTimeString('en-GB',{timeZone:'Europe/Bucharest'})+' · BUCHAREST';

   }
   const readings=screen.querySelector('.trialDisplayReadings');
   const cards=[...document.querySelectorAll('.projectOverviewCard')].slice(0,3);
   const values=cards.map(card=>({name:card.querySelector('h2,h3')?.textContent||'PROJECT',amount:card.querySelector('.projectOverviewNumbers strong')?.textContent||'—',color:getComputedStyle(card).getPropertyValue('--project-accent')}));
   const key=JSON.stringify(values);
   if(readings.dataset.values!==key){readings.dataset.values=key;readings.replaceChildren(...values.map(v=>{const item=document.createElement('div'),name=document.createElement('small'),amount=document.createElement('strong');name.textContent=v.name;amount.textContent=v.amount;amount.style.setProperty("--trial-reading-color",v.color);item.append(name,amount);return item;}));}
  }else if(screen){screen.remove();screen=null;}

  const chart=window.Chart?.getChart(document.querySelector('#marketChart'));
  if(chart&&!chart.$trialPalette){chart.$trialPalette=true;for(const d of chart.data.datasets){d.borderColor='#efc45f';d.backgroundColor='rgba(239,196,95,.10)';d.borderWidth=2;d.tension=.2;}chart.update('none');}
 }
 addEventListener('resize',()=>requestAnimationFrame(sync));
 window.elleryPreferences?.getNavigationHidden().then(value=>{collapsed=value;sync();dispatchEvent(new Event('resize'));}).catch(()=>{});
 let pending=false;
 new MutationObserver(()=>{if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;sync();});}).observe(document.querySelector('#root'),{childList:true,subtree:true});
 setInterval(()=>{const time=screen?.querySelector('time');if(time)time.textContent=new Date().toLocaleTimeString('en-GB',{timeZone:'Europe/Bucharest'})+' · BUCHAREST';},1000);
 sync();
}
