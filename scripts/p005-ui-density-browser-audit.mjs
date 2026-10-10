/* P005 financial CRM UI density sweep, using isolated simulated fixture only.
 * Audits all available pages for administrator, first-level and second-level roles.
 * Never authenticates to the real Supabase project or writes user data.
 */
import {chromium} from "playwright";
import {spawn} from "node:child_process";
import {createServer} from "node:net";
import {mkdir,writeFile} from "node:fs/promises";
import assert from "node:assert/strict";
import {fileURLToPath} from "node:url";
import path from "node:path";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const port=await new Promise((resolve,reject)=>{
 const sock=createServer();sock.once("error",reject);sock.listen(0,"127.0.0.1",()=>{const p=sock.address().port;sock.close(()=>resolve(p))});
});
const user="ui-audit",password="qa-only-mock-data-access-2026";
const server=spawn(process.execPath,["server.js"],{cwd:root,env:{...process.env,PORT:String(port),STAGING_PREVIEW:"1",STAGING_PREVIEW_USERNAME:user,STAGING_PREVIEW_PASSWORD:password},stdio:["ignore","pipe","pipe"]});
let stderr="";server.stderr.on("data",d=>stderr+=d);
const origin="http://127.0.0.1:"+port;
const roles=[{role:"admin",id:"TEST-ADMIN"},{role:"level1",id:"TEST-A001"},{role:"level2",id:"TEST-A002"}];
const views=["dashboard","customers","personnel","trades","positions","market","reports","settings","shareboard"];
const sizes=[{name:"desktop",width:1440,height:900},{name:"phone",width:390,height:844}];
let browser;const reports=[],failures=[];
try{
 let ready=false;for(let i=0;i<80;i++){
  try{const r=await fetch(origin+"/healthz");if(r.status===200){ready=true;break}}catch{}
  if(server.exitCode!==null)throw new Error("Preview server failed: "+stderr);
  await new Promise(ok=>setTimeout(ok,150));
 }
 assert.ok(ready,"Preview server did not start: "+stderr);
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 await mkdir(path.join(root,"artifacts/finance-audit"),{recursive:true});
 for(const size of sizes)for(const actor of roles){
  const context=await browser.newContext({viewport:{width:size.width,height:size.height},httpCredentials:{username:user,password},deviceScaleFactor:1});
  const page=await context.newPage();const errors=[];
  page.on("pageerror",e=>errors.push(String(e)));
  try{
   await page.goto(origin+"/?demo=1&account="+encodeURIComponent(actor.id),{waitUntil:"domcontentloaded",timeout:30000});
   await page.waitForSelector("#main[data-view]",{timeout:20000});
   for(const view of views){
    if(view==="personnel"&&actor.role==="level2")continue;
    const button=page.locator('.nav button[data-view="'+view+'"]');
    if(!(await button.count())){failures.push(actor.role+"/"+size.name+"/"+view+": tab not found");continue;}
    try{
     await button.click({timeout:10000});
     await page.waitForFunction(v=>{
      const m=document.querySelector("#main");
      return m?.dataset.view===v&&!m.classList.contains("viewBusy")&&m.classList.contains("viewReveal");
     },view,{timeout:35000});
     await page.waitForTimeout(140);
     const measure=await page.evaluate(()=>{
      const m=document.querySelector("#main"),viewport=innerWidth;
      const boxes=[...m.querySelectorAll(".panel,.projectPanel,.kpi,.marketMetric,.referenceFeatureCard,.settingsCard,.metricCard")].filter(el=>{
        const r=el.getBoundingClientRect(),cs=getComputedStyle(el);
        return r.width>=75&&r.height>=40&&cs.display!=="none"&&cs.visibility!=="hidden";
      });
      const clipped=boxes.filter(el=>{
        const cs=getComputedStyle(el);
        return cs.overflowY==="hidden"&&el.scrollHeight>el.clientHeight+25&&el.clientHeight>40;
      }).slice(0,8).map(el=>({className:String(el.className).slice(0,55),client:el.clientHeight,content:el.scrollHeight}));
      const whitespace=boxes.filter(el=>{
        const raw=(el.innerText||"").trim(),hasVisual=!!el.querySelector("canvas,svg,table");
        return raw.length>20&&!hasVisual&&el.clientHeight>250&&el.scrollHeight<el.clientHeight*.55;
      }).slice(0,8).map(el=>({className:String(el.className).slice(0,55),height:el.clientHeight,contentHeight:el.scrollHeight}));
      const controls=[...m.querySelectorAll("input,select,button")].filter(el=>{
        const r=el.getBoundingClientRect(),cs=getComputedStyle(el);
        return cs.display!=="none"&&r.width>0&&r.width<25;
      }).slice(0,7).map(el=>String(el.className||el.id||el.tagName).slice(0,55));
      const market=viewKey=>{
       const box=selector=>m.querySelector(selector),dims=selector=>{
        const node=box(selector),r=node?.getBoundingClientRect(),style=node?getComputedStyle(node):null;
        return {exists:!!node,height:Math.round(r?.height||0),width:Math.round(r?.width||0),display:style?.display,scrollHeight:node?.scrollHeight||0,clientHeight:node?.clientHeight||0};
       };
       return {list:dims(".marketListPanel"),marketList:dims(".marketList"),quote:dims(".marketOverviewPanel"),metrics:dims(".marketOverviewPanel>.marketMetrics"),chart:dims(".marketChartPanel"),canvas:dims(".marketChartPanel .chartBox"),mainOverflow:getComputedStyle(m).overflowY};
      };
      const axis=[...m.querySelectorAll("canvas")].map(canvas=>{
       const chart=window.Chart?.getChart?.(canvas);
       if(!chart?.options?.scales?.x?.ticks)return null;
       const scales=chart.options.scales;return {canvas:canvas.id,xColor:scales.x?.ticks?.color,xWeight:scales.x?.ticks?.font?.weight,yColor:scales.y?.ticks?.color,yWeight:scales.y?.ticks?.font?.weight};
      }).filter(Boolean).slice(0,5);
      return {view:m.dataset.view,contentLen:m.innerText.trim().length,panelCount:boxes.length,clipped,whitespace,controls,
       documentOverflow:Math.max(0,document.documentElement.scrollWidth-viewport),market:m.dataset.view==="market"?market("market"):null,axis};
     });
     reports.push({...actor,...size,view,...measure});
     if(measure.contentLen===0)failures.push(actor.role+"/"+size.name+"/"+view+": empty view");
     if(measure.documentOverflow>8)failures.push(actor.role+"/"+size.name+"/"+view+": document overflow "+measure.documentOverflow);
     if(measure.controls.length)failures.push(actor.role+"/"+size.name+"/"+view+": compressed controls "+JSON.stringify(measure.controls));
     if(view==="market"){
       const a=measure.market;
       if(a.quote.height<(size.name==="phone"?240:280))failures.push(actor.role+"/"+size.name+"/market: quote clipped "+JSON.stringify(a.quote));
       if(a.chart.height<(size.name==="phone"?245:280))failures.push(actor.role+"/"+size.name+"/market: chart clipped "+JSON.stringify(a.chart));
       if(a.metrics.display==="none")failures.push(actor.role+"/"+size.name+"/market: metrics hidden");
       if(size.name==="desktop"&&a.mainOverflow!=="auto")failures.push(actor.role+"/desktop/market: page not scrollable");
       if(size.name==="phone"&&a.marketList.scrollHeight>a.marketList.clientHeight+15)failures.push(actor.role+"/phone/market: stock rows clipped");
       if(actor.role==="admin"){
         await page.locator(".marketChartPanel").scrollIntoViewIfNeeded({timeout:10000});
         await page.screenshot({path:path.join(root,"artifacts/finance-audit",actor.role+"-"+size.name+"-market-bottom.png"),animations:"disabled",timeout:18000});
       }
     }
     if(view==="shareboard"&&actor.role==="admin"){
       for(const selector of [".projectOverviewLower",".projectOverviewSummary",".projectRecordPanel .dataTable"]){
         if(!(await page.locator(selector).isVisible()))failures.push(actor.role+"/"+size.name+"/shareboard: missing "+selector);
       }
     }
    }catch(err){failures.push(actor.role+"/"+size.name+"/"+view+": "+String(err).slice(0,240));}
   }
  }finally{
   if(errors.length)failures.push(actor.role+"/"+size.name+": runtime errors "+errors.slice(0,3).join("; "));
   await context.close();
  }
 }
 const suspicious=reports.filter(r=>r.clipped.length||r.whitespace.length);
 const compact=reports.map(({role,name,view,panelCount,contentLen,clipped,whitespace,market,axis})=>({role,width:name,view,panels:panelCount,contentLen,clipped,whitespace,market,axis}));
 await writeFile(path.join(root,"artifacts/finance-audit","ui-report.json"),JSON.stringify({tested:reports.length,failures,suspicious:suspicious.length,pages:compact},null,2));
 console.log("P005_UI_DENSITY_AUDIT "+JSON.stringify({tested:reports.length,suspicious:suspicious.length,failures:failures.slice(0,15),market:reports.filter(r=>r.view==="market").map(r=>({role:r.role,size:r.name,quoteHeight:r.market?.quote.height,chartHeight:r.market?.chart.height,mainOverflow:r.market?.mainOverflow}))}));
 if(failures.length)process.exitCode=1;
}finally{if(browser)await browser.close();server.kill("SIGTERM");}
