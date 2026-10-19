// PNG rendering stays on this computer; no business data is sent to an image service.
export const EXPORT_WIDTH=3840;
const LAYOUT_WIDTH=1440;
let renderer;
async function rasterSVG(svg){
 const bounds=svg.getBoundingClientRect(),copy=svg.cloneNode(true);
 copy.setAttribute('xmlns','http://www.w3.org/2000/svg');copy.setAttribute('width',bounds.width);copy.setAttribute('height',bounds.height);
 const sources=[svg,...svg.querySelectorAll('*')],targets=[copy,...copy.querySelectorAll('*')];
 sources.forEach((source,i)=>{const css=getComputedStyle(source);for(const property of ['color','fill','stroke','stroke-width','stroke-dasharray','stroke-linecap','font-family','font-size','font-weight','text-anchor'])targets[i].style.setProperty(property,css.getPropertyValue(property));});
 const img=new Image();img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(new XMLSerializer().serializeToString(copy));await img.decode();
 const canvas=document.createElement('canvas');canvas.width=Math.ceil(bounds.width*3);canvas.height=Math.ceil(bounds.height*3);canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);return canvas.toDataURL('image/png');
}
async function rasterLogo(source){
 const img=new Image();img.src=source;await img.decode();
 const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=Math.round(1200*img.naturalHeight/img.naturalWidth);
 const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,canvas.width,canvas.height);
 // Render the existing CSS white lettering treatment, preserving the original pillar artwork.
 ctx.save();ctx.beginPath();ctx.rect(0,canvas.height*.655,canvas.width,canvas.height*.345);ctx.clip();ctx.globalCompositeOperation='source-in';ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.restore();return canvas.toDataURL('image/png');
}
export async function exportPagePNG(element,{filename='Ellery-Westcott',button,notify=()=>{}}={}){
 if(!element||button?.disabled)return;
 const caption=button?.textContent;
 let status=button?.parentElement.querySelector('.exportStatus');
 if(button&&!status){status=document.createElement('span');status.className='exportStatus';status.setAttribute('role','status');button.after(status);}
 if(status)status.textContent='正在准备业务长图…';
 if(button){button.disabled=true;button.textContent='正在导出…';}
 const marker='export-'+Date.now();element.dataset.pngExport=marker;
 try{
  await document.fonts.ready;
  await Promise.all([...element.querySelectorAll('img')].map(img=>img.decode().catch(()=>{})));
  const logo=await rasterLogo('/assets/ellery-westcott-transparent.png');
  const svgImages=await Promise.all([...element.querySelectorAll('svg')].map(rasterSVG));
  renderer ||= import('./vendor-html2canvas.js');const{default:html2canvas}=await renderer;
  const canvas=await html2canvas(element,{
   backgroundColor:'#08121f',scale:EXPORT_WIDTH/LAYOUT_WIDTH,width:LAYOUT_WIDTH,
   windowWidth:LAYOUT_WIDTH,windowHeight:1000,scrollX:0,scrollY:0,logging:false,useCORS:true,
   onclone:doc=>{
    const target=doc.querySelector(`[data-png-export="${marker}"]`),root=doc.querySelector('#root');
    // Isolate the business section from the fixed sidebar and sticky application toolbar.
    target.remove();root.replaceChildren(target);doc.body.replaceChildren(root);
    target.classList.remove('customerNavCollapsed');
    if(target.id==='clientSharePage')target.classList.add('clientCaptureMode');
    for(const node of [doc.documentElement,doc.body,root]){node.style.setProperty('width',LAYOUT_WIDTH+'px','important');node.style.setProperty('min-height','0','important');node.style.setProperty('height','auto','important');node.style.setProperty('margin','0','important');node.style.setProperty('padding','0','important');node.style.setProperty('overflow','visible','important');}
    for(const[key,value]of Object.entries({position:'relative',inset:'auto',transform:'none',width:LAYOUT_WIDTH+'px','max-width':'none',height:'auto','min-height':'0','max-height':'none',margin:'0',padding:'20px',overflow:'visible',background:'#08121f','box-sizing':'border-box'}))target.style.setProperty(key,value,'important');
    target.querySelectorAll('svg').forEach((svg,i)=>{const img=doc.createElement('img');img.src=svgImages[i];img.className=svg.getAttribute('class')||'';img.setAttribute('alt',svg.getAttribute('aria-label')||'');img.style.cssText=svg.style.cssText;svg.replaceWith(img);});
    target.querySelectorAll('.brandLogoFrame').forEach(frame=>{const img=frame.querySelector('img');img.src=logo;frame.querySelectorAll('.brandLettering').forEach(el=>el.remove());});
    if(target.classList.contains('projectOverview')){const header=doc.createElement('div');header.className='exportBrandHeader';header.innerHTML='<img src="'+logo+'" alt="Ellery Westcott Capital Markets"><div><strong>项目预留份额'+(new URLSearchParams(location.search).get('demo')==='1'?' · 模拟数据':'')+'</strong><span>'+new Intl.DateTimeFormat('zh-CN',{timeZone:'Europe/Bucharest',dateStyle:'medium',timeStyle:'short'}).format(new Date())+' · Europe/Bucharest</span></div>';target.prepend(header);}
    target.querySelectorAll('.customerQuickActions,.navFrame,.topbar,.viewportPager,.shareInternalActions,.projectPresentationHeader,.screenshotHide,.previewNotice,#projectAddRecord,.projectEditButton,.projectNameEditor,.projectRecordActionColumn,.exportStatus').forEach(el=>el.remove());
    target.querySelectorAll('.dataTable tr[hidden],[data-viewport-row][hidden],.portfolioCurrencyGroup[hidden],.holdingBreakdownRow[hidden]').forEach(el=>el.removeAttribute('hidden'));
    const style=doc.createElement('style'),scope='body :is('+'#root'.repeat(14)+','+'#modalRoot'.repeat(14)+') ';
    style.textContent=`
     [data-png-export] :is(.tableWrap,.panelBody,.shareMainGrid,.shareLowerGrid,.shareServiceTimeline){height:auto!important;max-height:none!important;overflow:visible!important;}
     [data-png-export] .shareMainGrid{grid-template-columns:minmax(0,1.5fr) minmax(0,1fr)!important;}
     [data-png-export] .brandLogoFrame img{clip-path:none!important;object-position:center!important;}
     [data-png-export] .projectOverviewCards{grid-template-columns:repeat(3,minmax(0,1fr))!important;}
     [data-png-export] .projectOverviewLower{grid-template-columns:repeat(3,minmax(0,1fr))!important;}
     [data-png-export] .projectTrendPanel{grid-column:span 2!important;}
     [data-png-export] .projectOverviewSummary{grid-column:span 1!important;}
     [data-png-export] .exportBrandHeader{display:flex!important;align-items:center!important;justify-content:space-between!important;margin:0 0 16px!important;padding:0 10px 12px!important;border-bottom:1px solid #496078!important;}
     [data-png-export] .exportBrandHeader>img{width:160px!important;height:120px!important;object-fit:contain!important;}
     [data-png-export] .exportBrandHeader>div{display:grid!important;gap:8px!important;text-align:right!important;}
     [data-png-export] .exportBrandHeader strong{font-size:20px!important;color:#e8ebef!important;}
     [data-png-export] .exportBrandHeader span{color:#efc45f!important;font-size:11px!important;}
     [data-png-export] *{animation:none!important;transition:none!important;}
    `.replaceAll('[data-png-export]',scope+'[data-png-export]');doc.head.append(style);
    doc.body.classList.remove('screenshotCaptureMode','projectCaptureMode','navigationHidden');
   }
  });
  if(canvas.width!==EXPORT_WIDTH)throw Error('图片宽度校验失败');
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('图片生成失败');
  const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=filename.replace(/[\\/:*?"<>|]/g,'-')+'-4K.png';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
  if(status)status.textContent=`已导出 ${canvas.width} × ${canvas.height} PNG`;notify('业务长图已导出');
 }catch(error){if(status)status.textContent='导出失败';notify('导出失败：'+(error.message||'请重试'),true);}
 finally{delete element.dataset.pngExport;if(button){button.disabled=false;button.textContent=caption;}}
}
