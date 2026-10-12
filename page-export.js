// Local-only PNG export: no customer data is sent to an image service.
export const EXPORT_WIDTH = 3840;
const LAYOUT_WIDTH = 1440;
let renderer;
export async function exportPagePNG(element, {filename='CRM',button,notify=()=>{}}={}) {
  if (!element || button?.disabled) return;
  const caption=button?.textContent;
  let status=button?.parentElement.querySelector('.exportStatus');
  if(button&&!status){status=document.createElement('span');status.className='exportStatus';status.setAttribute('role','status');button.after(status);}
  if(status)status.textContent='正在准备完整图片…';
  if(button){button.disabled=true;button.textContent='正在生成 4K 图片…';}
  const marker='export-'+Date.now();
  element.dataset.pngExport=marker;
  try {
    await document.fonts.ready;
    await Promise.all([...element.querySelectorAll('img')].map(img=>img.decode().catch(()=>{})));
    // Rasterize SVG logos at export density so their viewBox is preserved by the renderer.
    const logos=[...element.querySelectorAll('img.brandLogo')].map(img=>{
      const raster=document.createElement('canvas');
      const ratio=img.naturalWidth/img.naturalHeight;
      raster.width=1200;raster.height=Math.round(1200/ratio);
      raster.getContext('2d').drawImage(img,0,0,raster.width,raster.height);
      return raster.toDataURL('image/png');
    });
    renderer ||= import('./vendor-html2canvas.js');
    const {default:html2canvas}=await renderer;
    const canvas=await html2canvas(element,{
      backgroundColor:'#faf9f5',scale:EXPORT_WIDTH/LAYOUT_WIDTH,
      width:LAYOUT_WIDTH,windowWidth:LAYOUT_WIDTH,windowHeight:2160,
      scrollX:0,scrollY:0,logging:false,useCORS:true,
      onclone:doc=>{
        const target=doc.querySelector(`[data-png-export="${marker}"]`);
        target.querySelectorAll('img.brandLogo').forEach((img,i)=>{img.src=logos[i];});
        const style=doc.createElement('style');
        style.textContent=`
          [data-png-export] {position:relative!important;inset:auto!important;transform:none!important;width:${LAYOUT_WIDTH}px!important;max-width:none!important;height:auto!important;min-height:0!important;max-height:none!important;margin:0!important;padding:24px!important;overflow:visible!important;box-sizing:border-box!important;}
          [data-png-export] :is(.tableWrap,.panelBody,.shareMainGrid,.shareLowerGrid,.shareServiceTimeline) {height:auto!important;max-height:none!important;overflow:visible!important;}
          [data-png-export] :is(.navFrame,.globalSearch,.userArea,#dashboardAccountSlot,.viewportPager,.shareInternalActions,.projectPresentationHeader,.screenshotHide,.previewNotice,#projectAddRecord,.projectEditButton,.projectNameEditor,.projectRecordActionColumn,.exportStatus) {display:none!important;}
          [data-png-export] .topbar {min-height:80px!important;height:auto!important;}
          [data-png-export] :is(.projectOverviewCards,.shareKpiRow) {grid-template-columns:repeat(3,minmax(0,1fr))!important;}
          [data-png-export] .projectOverviewCards>article {grid-column:auto!important;}
          [data-png-export] * {animation:none!important;transition:none!important;}
        `;
        const scope="body :is("+"#root".repeat(11)+","+"#modalRoot".repeat(11)+") ";
        style.textContent=style.textContent.replaceAll("[data-png-export]",scope+"[data-png-export]");
        doc.head.append(style);
        doc.body.classList.remove('screenshotCaptureMode','projectCaptureMode','navigationHidden');
        target.querySelectorAll('.dataTable tr[hidden],[data-viewport-row][hidden],.portfolioCurrencyGroup[hidden],.holdingBreakdownRow[hidden]').forEach(row=>row.removeAttribute('hidden'));
      }
    });
    if(canvas.width!==EXPORT_WIDTH)throw new Error('图片宽度校验失败');
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
    if(!blob)throw new Error('图片生成失败，请重试');
    const url=URL.createObjectURL(blob),link=document.createElement('a');
    link.href=url;link.download=filename.replace(/[\\/:*?"<>|]/g,'-')+'-4K.png';
    document.body.append(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),60000);
    if(status)status.textContent=`已导出 ${canvas.width} × ${canvas.height} PNG`;
    notify(`已导出完整 PNG：${canvas.width} × ${canvas.height}`);
  } catch(error) {if(status)status.textContent='导出失败：'+(error.message||'请重试');notify('导出失败：'+(error.message||'请重试'),true);}
  finally {delete element.dataset.pngExport;if(button){button.disabled=false;button.textContent=caption;}}
}
