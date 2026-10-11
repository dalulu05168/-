/* Customer-facing reports: isolated from internal notes and admin DOM. */
const e=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const txt=v=>String(v??"").trim();
const numbers=(n,d=4)=>Number(n||0).toLocaleString("zh-CN",{maximumFractionDigits:d});
const time=(ctx,v)=>v?ctx.dt(v):"未安排";
const stateLabels={prospect:"潜在客户",following:"服务中",holding:"持仓中",closed:"已结束",archived:"已归档"};
const channelLabels={phone:"电话",whatsapp:"WhatsApp",email:"邮件",meeting:"线下会面",other:"其他"};
const logo='/assets/brand-logo-transparent-color.svg?v=20261010-approved-logo-v2';
const reportScope=ctx=>(ctx.state.staff||[]).reduce((map,p)=>(map.set(p.id,p),map),new Map());
const reportToday=ctx=>ctx.romaniaClockText?.()||new Date().toLocaleString("zh-CN");
const visibleRows=(ctx,project)=>{const clients=new Map(ctx.state.customers.filter(c=>c.owner_user_id===project.owner_user_id).map(c=>[String(c.id),c]));return (ctx.state.customerReservations||[]).filter(r=>r.project_id===project.id&&r.owner_user_id===project.owner_user_id&&r.status==="confirmed"&&clients.has(String(r.customer_id))).map(r=>({...r,client:clients.get(String(r.customer_id))}));};
const item=(label,value)=>'<div class="cfInfoItem"><span>'+e(label)+'</span><strong>'+e(value||"—")+'</strong></div>';
const metric=(label,value,sub='')=>'<article class="cfMetric"><small>'+e(label)+'</small><strong>'+e(value||"—")+'</strong><span>'+e(sub)+'</span></article>';
function frame(data){
 const reservation=data.kind==="reservation";
 const metrics=reservation?[
   metric("预留项目",data.project,"来自项目记录"),metric("已记录份额",data.quantity,"仅份额数量，不代表金额"),
   metric("预留金额",data.amount,"未提供单价，不作金额推算"),metric("记录状态",data.status,"以系统客户记录为准")
 ]:[metric("客户服务状态",data.status,"当前客户档案状态"),metric("最近沟通",data.last,"记录中的实际时间"),metric("下次计划",data.nextDate,"如未安排则显示未安排")];
 const details=reservation?
  '<div class="cfInfoGrid">'+[
   item("客户编号",data.code),item("项目代码",data.symbol),
   item("所属顾问",data.owner),item("项目日期",data.projectDate),
   item("最近确认时间",data.updated),item("已确认记录数",data.recordCount),
   item("预留有效期", "未在系统中记录"),item("最新数据时间",data.generated)
  ].join('')+'</div>':
  '<div class="cfInfoGrid">'+[
   item("服务顾问",data.owner),item("沟通记录数",data.totalRecords),
   item("公开摘要条数",data.entries.length),item("报告生成时间",data.generated)
  ].join('')+'</div>';
 let body="";
 if(reservation){
  body='<section class="cfBlock"><h2>预留记录进展</h2><div class="cfSteps"><div class="done"><b>1</b><strong>客户预订记录</strong><small>已登记</small></div><div class="done"><b>2</b><strong>状态核对</strong><small>系统标记已确认</small></div><div><b>3</b><strong>后续安排</strong><small>尚未提供办理进度</small></div></div></section>'+
  '<section class="cfBlock"><h2>预留信息明细</h2>'+details+'</section>'+
  '<section class="cfNote"><h2>信息说明</h2><p>本页仅复述当前账户可见的客户预订记录。已确认是系统记录状态，不表示资金到账、收益保证、额度法律锁定或证券成交。具体交付条款以正式文件为准。</p></section>';
 }else{
  body='<section class="cfBlock"><h2>客户服务进展</h2>'+details+'</section><section class="cfBlock cfTimeline"><h2>服务跟进时间轴</h2>'+
  (data.entries.length?data.entries.map(x=>'<div class="cfTimelineItem"><div><b>'+e(x.date)+'</b><span>'+e(x.channel)+'</span></div><p>'+e(x.summary)+'</p></div>').join(''):'<p class="cfNoEntry">尚未选择经审核的对外沟通摘要。</p>')+'</section>'+
  '<section class="cfBlock"><h2>阶段性结论与下一步安排</h2><div class="cfConclusions">'+item("当前结论",data.conclusion||"暂无已审核结论")+item("下一步安排",data.nextAction||"暂无已审核安排")+'</div></section>';
 }
 return '<div class="cfSheet" data-report-kind="'+e(data.kind)+'"><header class="cfBrandHeader"><img src="'+logo+'" alt="Brantone Veylor"><div><p>BRANTONE VEYLOR · CLIENT SERVICE</p><h1>'+(reservation?"预留信息确认页":"客户服务进度报告")+'</h1><small>'+e(data.generated)+'</small></div></header>'+
  '<div class="cfClientHeader"><div><small>CLIENT / 客户</small><strong>'+e(data.client)+'</strong></div><div><small>客户编号</small><strong>'+e(data.code)+'</strong></div><div><small>服务顾问</small><strong>'+e(data.owner)+'</strong></div></div>'+
  '<section class="cfMetrics">'+metrics.join('')+'</section>'+body+
  '<footer class="cfFooter"><span>BRANTONE VEYLOR · 仅供客户核对 · 非投资收益承诺</span><span>生成时间：'+e(data.generated)+'</span></footer>'+
  (data.demo?'<div class="cfDemoStamp">演示预览 · 模拟数据 · 非真实客户确认</div>':'')+
  '<div class="cfWatermark" aria-hidden="true">BRANTONE VEYLOR</div></div>';
}
function shell(ctx,title,editor){
 document.getElementById("customerFacingRoot")?.remove();
 const el=document.createElement('section');el.id='customerFacingRoot';el.className='cfRoot';el.dataset.format='wide';
 el.innerHTML='<div class="cfEditor"><div class="cfEditorTitle"><div><h2>'+e(title)+'</h2><p>内部编辑区，不会写入对外图片或打印报告</p></div><button type="button" class="cfClose" id="cfClose">×</button></div>'+editor+
 '<div class="cfPreviewControls"><button type="button" id="cfFormatWide" aria-pressed="true">16:9 横版</button><button type="button" id="cfFormatMobile" aria-pressed="false">手机长图</button><button type="button" id="cfDownloadPng">生成 PNG 图片</button><button type="button" id="cfPrintPdf">打印 / 保存 PDF</button></div><p class="cfWarning" id="cfWarning" role="status">请核对客户姓名、记录状态与对外摘要后导出。</p></div><div class="cfStage"><div class="cfPreview" id="cfPreview" aria-live="polite"></div></div>';
 document.body.append(el);document.body.classList.add('cfActive');
 const close=()=>{el.remove();document.body.classList.remove('cfActive');document.removeEventListener('keydown',escapeHandler);};
 const escapeHandler=ev=>{if(ev.key==='Escape'){ev.preventDefault();ev.stopImmediatePropagation();close();}};
 document.addEventListener('keydown',escapeHandler);
 el.querySelector('#cfClose').onclick=close;
 const wide=el.querySelector('#cfFormatWide'),mobile=el.querySelector('#cfFormatMobile');
 const setFormat=f=>{el.dataset.format=f;wide.setAttribute('aria-pressed',String(f==='wide'));mobile.setAttribute('aria-pressed',String(f==='mobile'));};
 wide.onclick=()=>setFormat('wide');mobile.onclick=()=>setFormat('mobile');
 return {el,close,setPreview:(data,allow=true)=>{el.querySelector('#cfPreview').innerHTML=frame(data);el._payload=data;el.querySelector('#cfDownloadPng').disabled=!allow;el.querySelector('#cfPrintPdf').disabled=!allow;el.querySelector('#cfWarning').textContent=allow?"请在发送前核对客户身份、状态和所有对外文字。对外摘要只在本次编辑中有效，不会替换内部纪要。":"无可核实的客户记录或尚未审核对外内容，暂不允许导出。";}};
}
export function openReservationClientMode(ctx,project){
 if(!ctx.state.profile||!project||!(ctx.state.allocationProjects||[]).some(p=>p.id===project.id)){ctx.toast("当前账户无权查看所选项目",true);return;}
 const rows=visibleRows(ctx,project),unique=[...new Map(rows.map(r=>[String(r.client.id),r.client])).values()];
 const editor='<div class="cfField"><label for="cfSelectClient">选择要发送的客户（仅显示有已确认预订记录的客户）</label><select id="cfSelectClient">'+(unique.length?unique.map(c=>'<option value="'+e(c.id)+'">'+e(c.name)+' · '+e(c.customer_code)+'</option>').join(''):'<option value="">无已确认的客户预订记录</option>')+'</select></div><p class="cfFormHelp">仅展示这个客户、这个项目的已确认预订份额；不展示其他客户排行和内部登记备注。</p>';
 const ui=shell(ctx,"预留信息 · 客户对外展示",editor);
 const selector=ui.el.querySelector('#cfSelectClient');
 const refresh=()=>{
  const client=unique.find(c=>String(c.id)===selector.value);
  if(!client){ui.setPreview({kind:"reservation",client:"—",code:"—",owner:"—",project:project.name,quantity:"—",amount:"未记录",status:"未确认",symbol:project.symbol||"—",projectDate:project.board_date,updated:"—",recordCount:"0",generated:reportToday(ctx),demo:!!ctx.isDemo},false);return;}
  const ownRows=rows.filter(r=>String(r.customer_id)===String(client.id));
  const valid=ownRows.length>0;
  const qty=ownRows.reduce((n,r)=>n+Number(r.reserved_shares||0),0);
  const recent=[...ownRows].sort((a,b)=>new Date(b.confirmed_at)-new Date(a.confirmed_at))[0];
  const staff=reportScope(ctx).get(project.owner_user_id);
  ui.setPreview({kind:"reservation",client:client.name,code:client.customer_code||"—",owner:staff?.display_name||"服务团队",project:project.name,quantity:valid?numbers(qty)+" 份":"—",amount:"未记录",status:valid?"系统记录已确认":"暂无确认记录",symbol:project.symbol||"未填写",projectDate:project.board_date,updated:time(ctx,recent?.confirmed_at),recordCount:String(ownRows.length),generated:reportToday(ctx),demo:!!ctx.isDemo},valid);
 };
 selector.onchange=refresh;refresh();
 bindExport(ui,ctx);
}
export function openFollowupClientMode(ctx,client){
 if(!ctx.state.profile||!ctx.state.customers.some(c=>c.id===client.id)){ctx.toast("无权查看客户",true);return;}
 const rows=ctx.state.followups.filter(f=>f.customer_id===client.id).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
 const editor='<p class="cfFormHelp">只把经审核、明确选择的摘要写入客户报告。原始内部纪要仅在下方工作区显示，不出现在对外页面、PNG 或 PDF。</p>'+
 '<div class="cfField"><label for="cfConclusion">对外阶段性结论（需人工审核）</label><textarea id="cfConclusion" placeholder="依据实际沟通结果填写；不可承诺未经确认的事项"></textarea></div>'+
 '<div class="cfField"><label for="cfNextAction">对外下一步安排（需人工审核）</label><textarea id="cfNextAction" placeholder="只写已确定的后续安排"></textarea></div>'+
 '<div class="cfField"><label>选取已审核的沟通摘要</label><div class="cfRawEntries">'+(rows.length?rows.map((r,i)=>'<div class="cfRawEntry"><label><input type="checkbox" data-approved="'+i+'"> 公开 '+e(time(ctx,r.created_at))+' · '+e(channelLabels[r.channel]||"其他")+'</label><small>内部原文（不会导出）</small><p>'+e(r.content||"暂无记录")+'</p><textarea data-summary="'+i+'" placeholder="填写准确、客观、经审核的对外沟通摘要"></textarea></div>').join(''):'<p>客户目前没有跟进记录。</p>')+'</div></div>';
 const ui=shell(ctx,"客户跟进 · 对外服务报告",editor);
 const owner=reportScope(ctx).get(client.owner_user_id);
 const refresh=()=>{
  const entries=rows.map((r,i)=>({date:time(ctx,r.created_at),channel:channelLabels[r.channel]||"其他",summary:txt(ui.el.querySelector('[data-summary="'+i+'"]')?.value),approved:!!ui.el.querySelector('[data-approved="'+i+'"]')?.checked})).filter(x=>x.approved&&x.summary);
  const planned=rows.find(x=>x.next_followup_at)?.next_followup_at;
  const conclusion=txt(ui.el.querySelector('#cfConclusion').value),nextAction=txt(ui.el.querySelector('#cfNextAction').value);
  const safe=entries.length>0||!!conclusion||!!nextAction;
  ui.setPreview({kind:"followup",client:client.name,code:client.customer_code||"—",owner:owner?.display_name||"服务团队",status:stateLabels[client.status]||"未知",last:rows.length?time(ctx,rows[0].created_at):"无记录",nextDate:planned?time(ctx,planned):"未安排",totalRecords:String(rows.length),entries,conclusion,nextAction,generated:reportToday(ctx),demo:!!ctx.isDemo},safe);
 };
 ui.el.querySelectorAll('.cfEditor textarea,.cfEditor input[type="checkbox"]').forEach(x=>x.addEventListener('input',refresh));
 refresh();bindExport(ui,ctx);
}
function bindExport(ui,ctx){
 ui.el.querySelector('#cfPrintPdf').onclick=()=>{if(ui.el._payload)window.print();};
 ui.el.querySelector('#cfDownloadPng').onclick=async()=>{
  const btn=ui.el.querySelector('#cfDownloadPng');if(!ui.el._payload)return;
  btn.disabled=true;const old=btn.textContent;btn.textContent="正在生成高清 PNG…";
  try{await drawSnapshot(ui.el._payload,ui.el.dataset.format);}catch(error){ctx.toast("PNG 导出失败："+String(error.message||error),true);}finally{btn.disabled=false;btn.textContent=old;}
 };
}
function rounded(c,x,y,w,h,r,fill,stroke){
 c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}
}
function wrapped(c,text,x,y,maxWidth,lineHeight,maxLines=5){
 let line='',count=0;const str=String(text||"—");for(const ch of str){
  if(c.measureText(line+ch).width>maxWidth&&line){c.fillText(line,x,y);y+=lineHeight;count++;line=ch;if(count>=maxLines)return y;}else line+=ch;
 }if(line){c.fillText(line,x,y);y+=lineHeight;}return y;
}
async function brandImage(){return new Promise(resolve=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>resolve(null);img.src=logo;});}
async function drawSnapshot(data,format){
 const mobile=format==="mobile",W=mobile?1080:3200,H=mobile?2100:1800;const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;const c=canvas.getContext('2d');c.fillStyle='#f6f8f7';c.fillRect(0,0,W,H);
 const margin=mobile?48:100,inner=W-margin*2,brand=await brandImage(),size=mobile?1:1;
 rounded(c,margin,50,inner,H-100,20,'#fff','#e5e9e7');
 if(brand){const w=mobile?360:520,h=mobile?90:130;c.drawImage(brand,margin+48,105,w,h);}
 c.textAlign='right';c.fillStyle='#6d8176';c.font=(mobile?23:27)+'px Arial, sans-serif';c.fillText('BRANTONE VEYLOR · CLIENT SERVICE',W-margin-42,150);c.textAlign='left';
 let y=mobile?270:255;c.font='bold '+(mobile?55:69)+'px Arial, sans-serif';c.fillStyle='#203e35';c.fillText(data.kind==='reservation'?'预留信息确认页':'客户服务进度报告',margin+48,y);
 c.font=(mobile?23:27)+'px Arial, sans-serif';c.fillStyle='#789087';c.fillText('生成时间：'+data.generated,margin+50,y+55);
 y+=110;rounded(c,margin+46,y,inner-92,mobile?126:120,12,'#f7faf8','#e5ece7');c.font='bold '+(mobile?34:39)+'px Arial';c.fillStyle='#2b4b3f';c.fillText('客户：'+data.client,margin+77,y+54);c.font=(mobile?23:29)+'px Arial';c.fillText('编号：'+data.code+'     服务顾问：'+data.owner,margin+77,y+96);y+=mobile?160:160;
 const metrics=data.kind==='reservation'?[["预留项目",data.project],["已记录份额",data.quantity],["预留金额",data.amount],["状态",data.status]]:[["当前状态",data.status],["最近沟通",data.last],["下次计划",data.nextDate]];
 const cols=mobile?2:metrics.length,gap=18,cardW=(inner-94-gap*(cols-1))/cols,cardH=mobile?155:190;
 for(let i=0;i<metrics.length;i++){const col=i%cols,row=Math.floor(i/cols),x=margin+47+col*(cardW+gap),top=y+row*(cardH+gap);rounded(c,x,top,cardW,cardH,12,'#f8faf8','#e5ece7');c.fillStyle='#71867a';c.font=(mobile?21:27)+'px Arial';c.fillText(metrics[i][0],x+25,top+43);c.font='bold '+(mobile?28:42)+'px Arial';c.fillStyle='#234e3c';wrapped(c,metrics[i][1],x+25,top+105,cardW-50,mobile?39:49,2);}
 y+=Math.ceil(metrics.length/cols)*(cardH+gap)+20;
 const bar=(label)=>{c.font='bold '+(mobile?33:37)+'px Arial';c.fillStyle='#2f4b3e';c.fillText(label,margin+52,y+27);y+=57;};
 const line=(label,value)=>{c.font=(mobile?24:28)+'px Arial';c.fillStyle='#698075';c.fillText(label,margin+60,y+24);c.fillStyle='#274639';c.font='bold '+(mobile?27:31)+'px Arial';const h=wrapped(c,value,margin+60+Math.min(250,inner*.25),y+24,inner-Math.min(320,inner*.3)-100,mobile?40:45,3);y=Math.max(y+57,h+19);};
 if(data.kind==='reservation'){bar('预留进度');line('确认状态','已登记 · 系统预留记录已确认');line('项目代码',data.symbol);line('项目日期',data.projectDate);line('最近确认时间',data.updated);line('确认记录数',data.recordCount);
  bar('说明');c.fillStyle='#536c60';c.font=(mobile?22:27)+'px Arial';y=wrapped(c,'系统确认仅代表记录状态，不等于资金到账、合同额度锁定或投资收益保证。',margin+55,y+15,inner-110,mobile?36:41,5);
 }else{bar('服务跟进时间轴');const limit=mobile?4:4;
 for(const entry of data.entries.slice(0,limit)){line(entry.date,entry.channel);c.font=(mobile?23:27)+'px Arial';c.fillStyle='#305647';y=wrapped(c,entry.summary,margin+67,y+8,inner-150,mobile?36:42,3)+10;}
 if(data.entries.length>limit){c.fillStyle='#73877d';c.font='22px Arial';c.fillText('其余经审核条目请查看 PDF 报告',margin+55,y+18);y+=50;}
 bar('阶段性结论与下一步安排');line('当前结论',data.conclusion||'暂无已审核结论');line('下一步安排',data.nextAction||'暂无已审核安排');
 }
 const footerY=H-145;c.fillStyle='#657d70';c.font=(mobile?18:25)+'px Arial';c.fillText('BRANTONE VEYLOR · 仅供信息核对 · 不构成投资承诺',margin+58,footerY);
 if(data.demo){c.fillStyle='#b23d3d';c.font='bold '+(mobile?22:35)+'px Arial';c.fillText('演示预览 · 模拟数据 · 非真实确认',margin+58,H-100);}
 const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw new Error('PNG 图像生成失败');
 const link=document.createElement('a'),url=URL.createObjectURL(blob);link.href=url;link.download=(data.kind==='reservation'?'客户预留确认':'客户服务进度')+'-'+new Date().toISOString().slice(0,10)+(mobile?'-mobile':'-wide')+'.png';link.click();setTimeout(()=>URL.revokeObjectURL(url),2000);
}
