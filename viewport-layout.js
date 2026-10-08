// Keep desktop pages in a shared 16:9 frame; paginate long lists instead of clipping rows.
export function desktopFrameMetrics(width,height){const scale=Math.min(width/1600,height/900);return {scale,width:1600,height:900,left:(width-1600*scale)/2,top:(height-900*scale)/2};}
export function pageBounds(total,size,page=0){const count=Math.max(1,Math.ceil(total/size)),index=Math.max(0,Math.min(count-1,page));return {page:index,count,start:index*size,end:Math.min(total,(index+1)*size)};}
export function installViewportLayout({getLanguage=()=> 'zh'}={}){
 const tableStates=new WeakMap(),listStates=new WeakMap();let queued=false;
 const labels=()=>({zh:['上一页','下一页','页'],en:['Previous','Next','Page'],ro:['Înapoi','Înainte','Pagina']}[getLanguage()]||['Previous','Next','Page']);
 function pagerFor(container,state,total,size,apply){
  if(!state.pager?.isConnected){state.pager=document.createElement('nav');state.pager.className='viewportPager';state.pager.setAttribute('aria-label','Pagination');state.pager.innerHTML='<button class="btn" type="button"></button><span aria-live="polite"></span><button class="btn" type="button"></button>';container.append(state.pager);const buttons=state.pager.querySelectorAll('button');buttons[0].onclick=()=>{state.page--;apply()};buttons[1].onclick=()=>{state.page++;apply()};}
  const b=pageBounds(total,size,state.page),copy=labels(),buttons=state.pager.querySelectorAll('button');state.page=b.page;
  buttons[0].textContent=copy[0];buttons[1].textContent=copy[1];buttons[0].disabled=b.page===0;buttons[1].disabled=b.page===b.count-1;
  const text=copy[2]+' '+(b.page+1)+' / '+b.count+' · '+total;const span=state.pager.querySelector('span');if(span.textContent!==text)span.textContent=text;state.pager.hidden=b.count===1;return b;
 }
 function paginateTables(){
  document.querySelectorAll('#main .dataTable,#clientSharePage .dataTable').forEach(table=>{
   const wrapper=table.closest('.tableWrap');if(table.dataset.managedPagination||!wrapper||!table.tBodies.length)return;
   const rows=[...table.tBodies].flatMap(body=>[...body.rows]);if(!rows.length)return;
   let state=tableStates.get(table);if(!state){state={page:0};tableStates.set(table,state)}
   const peers=[...wrapper.querySelectorAll('.dataTable')].filter(t=>t.closest('.tableWrap')===wrapper).length||1;
   const height=wrapper.clientHeight||260,head=table.tHead?.offsetHeight||28,rowHeight=Math.max(30,...rows.slice(0,3).map(r=>r.offsetHeight||32));
   const size=Math.max(1,Math.floor((height/peers-head-30)/rowHeight));
   const apply=()=>{const b=pagerFor(table.parentElement,state,rows.length,size,apply);rows.forEach((row,i)=>{row.hidden=i<b.start||i>=b.end})};apply();
  });
  const list=document.querySelector('#main .marketList');if(list){const rows=[...list.querySelectorAll('.marketRow')];if(rows.length){let state=listStates.get(list);if(!state){state={page:0};listStates.set(list,state)}const size=Math.max(1,Math.floor(((list.clientHeight||450)-30)/Math.max(55,rows[0].offsetHeight||65)));const apply=()=>{const b=pagerFor(list,state,rows.length,size,apply);rows.forEach((r,i)=>r.hidden=i<b.start||i>=b.end)};apply();}}
 }
 function paginateCollections(){
  for(const [selector,itemSelector] of [['#clientSharePage .shareServiceTimeline',':scope > div'],['#main .level1TeamGrid',':scope > .level1StaffCard'],['#main .terminalPositionList',':scope > .terminalPositionCard']]){
   const container=document.querySelector(selector);if(!container)continue;const rows=[...container.querySelectorAll(itemSelector)];if(!rows.length)continue;
   rows.forEach(r=>r.dataset.viewportRow='true');let state=listStates.get(container);if(!state){state={page:0};listStates.set(container,state)}
   const columns=Math.max(1,getComputedStyle(container).gridTemplateColumns.split(' ').filter(x=>x.endsWith('px')).length);
   const size=Math.max(1,Math.floor(((container.clientHeight||280)-30)/(Math.max(40,rows[0].offsetHeight||70)+(parseFloat(getComputedStyle(container).rowGap)||0)))*columns);
   const apply=()=>{const b=pagerFor(container,state,rows.length,size,apply);rows.forEach((r,i)=>r.hidden=i<b.start||i>=b.end)};apply();
  }
 }
 function paginatePortfolio(){
  const container=document.querySelector('#customerPortfolioBreakdown');if(!container)return;
  const groups=[...container.querySelectorAll(':scope > .portfolioCurrencyGroup')];if(!groups.length)return;
  let state=listStates.get(container);if(!state){state={page:0};listStates.set(container,state)}
  const apply=()=>{
   const b=pagerFor(container,state,groups.length,1,apply);groups.forEach((g,i)=>g.hidden=i!==b.page);
   const group=groups[b.page],rows=[...group.querySelectorAll('.holdingBreakdownRow')];if(!rows.length)return;
   let rowState=listStates.get(group);if(!rowState){rowState={page:0};listStates.set(group,rowState)}
   const fixed=[...group.querySelectorAll('.breakdownLabel,.profitBreakdownRow')].reduce((total,el)=>total+(el.offsetHeight||30),0);
   const size=Math.max(1,Math.floor(((container.clientHeight||260)-fixed-30-(groups.length>1?30:0))/Math.max(35,rows[0].offsetHeight||50)));
   const applyRows=()=>{const range=pagerFor(group,rowState,rows.length,size,applyRows);rows.forEach((row,i)=>row.hidden=i<range.start||i>=range.end)};applyRows();
  };apply();
 }
 function layout(){queued=false;const on=window.innerWidth>=900&&window.innerHeight>=500;document.body.classList.toggle('desktopFrame',on);if(!on){document.querySelectorAll('.viewportPager:not([data-managed-pagination])').forEach(p=>p.hidden=true);document.querySelectorAll('.dataTable:not([data-managed-pagination]) tr[hidden],.marketRow[hidden],[data-viewport-row][hidden],.portfolioCurrencyGroup[hidden],.holdingBreakdownRow[hidden]').forEach(r=>r.hidden=false);return;}
  const frame=desktopFrameMetrics(window.innerWidth,window.innerHeight);const root=document.documentElement;root.style.setProperty('--frame-scale',String(frame.scale));root.style.setProperty('--frame-left',frame.left+'px');root.style.setProperty('--frame-top',frame.top+'px');paginateTables();paginateCollections();paginatePortfolio();
 }
 function schedule(){if(!queued){queued=true;requestAnimationFrame(layout)}}
 const observer=new MutationObserver(records=>{if(records.some(r=>!r.target.closest?.('.viewportPager')&&[...r.addedNodes].some(n=>n.nodeType===1)))schedule()});observer.observe(document.body,{childList:true,subtree:true});
 window.addEventListener('resize',schedule);window.addEventListener('crm-layout',schedule);schedule();return ()=>{observer.disconnect();window.removeEventListener('resize',schedule);window.removeEventListener('crm-layout',schedule)};
}
