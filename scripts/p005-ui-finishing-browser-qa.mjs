/* P005 final UI acceptance: user-marked navy footer + oversized allocation header.
 * Real Chromium / isolated staging fixture / no live Supabase.
 */
import {chromium} from "playwright";
import {spawn} from "node:child_process";
import {createServer} from "node:net";
import {mkdir,writeFile} from "node:fs/promises";
import {fileURLToPath} from "node:url";
import path from "node:path";
import assert from "node:assert/strict";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const sock=createServer(),port=await new Promise((resolve,reject)=>{
  sock.once("error",reject);sock.listen(0,"127.0.0.1",()=>{const p=sock.address().port;sock.close(()=>resolve(p));});
});
const origin="http://127.0.0.1:"+port;
const user="ui-finish-audit",pass="isolated-ui-finish-audit-password-2026";
const server=spawn(process.execPath,["server.js"],{cwd:root,env:{
  ...process.env,PORT:String(port),STAGING_PREVIEW:"1",
  STAGING_PREVIEW_USERNAME:user,STAGING_PREVIEW_PASSWORD:pass
},stdio:["ignore","pipe","pipe"]});
let err="";server.stderr.on("data",c=>err+=c);
const sizes=[{name:"desktop-1600x900",width:1600,height:900},{name:"desktop-1440x900",width:1440,height:900},{name:"phone-390x844",width:390,height:844}];
const records=[],failures=[];
let browser;
const saveDir=path.join(root,"artifacts/finish-ui");
async function audit(page,label,size) {
  const data=await page.evaluate(()=>{
    const rect=el=>{const r=el?.getBoundingClientRect();return r?{x:r.x,y:r.y,w:r.width,h:r.height}:null};
    const isNavy=rgb=>{
      const m=rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if(!m)return false;const [r,g,b]=m.slice(1).map(Number);
      return r<65&&g<90&&b<120&&b>r*1.22;
    };
    const bigDark=[...document.querySelectorAll('#main *')].filter(el=>{
      const r=el.getBoundingClientRect();
      if(r.width<Math.min(innerWidth*.5,300)||r.height<30)return false;
      const st=getComputedStyle(el);
      return st.display!=="none"&&st.visibility!=="hidden"&&isNavy(st.backgroundColor);
    }).slice(0,9).map(el=>({tag:el.tagName,cls:String(el.className).slice(0,90),color:getComputedStyle(el).backgroundColor,size:rect(el)}));
    const footer=[...document.querySelectorAll('#main .viewportPager:not([hidden])')].map(el=>({
      bg:getComputedStyle(el).backgroundColor,box:rect(el),
      buttons:[...el.querySelectorAll("button")].map(b=>({label:b.textContent,disabled:b.disabled}))
    }));
    const top=document.querySelector(".topbar");
    const header=document.querySelector(".projectPresentationHeader");
    const owner=document.querySelector("#projectDetailOwnerSelect");
    const capture=document.querySelector("#projectCaptureButton");
    const back=document.querySelector("#projectPresentationExit");
    return {
      url:location.href,viewport:{w:innerWidth,h:innerHeight},
      scrollWidth:document.documentElement.scrollWidth,
      mainRect:rect(document.querySelector("#main")),
      topVisible:!!top&&getComputedStyle(top).display!=="none",
      headerDisplay:header?getComputedStyle(header).display:null,
      ownerInTopbar:!!owner?.closest(".topbar"),
      captureInTopbar:!!capture?.closest(".topbar"),
      backInTopbar:!!back?.closest(".topbar"),
      ownerVisible:!!owner&&owner.getBoundingClientRect().width>0,
      captureVisible:!!capture&&capture.getBoundingClientRect().width>0,
      backVisible:!!back&&back.getBoundingClientRect().width>0,
      bigDark,footer
    };
  });
  records.push({view:label,size:size.name,data});
  assert.ok(data.scrollWidth<=size.width+5,label+": page overflow "+data.scrollWidth);
  assert.equal(data.bigDark.length,0,label+": navy background remains "+JSON.stringify(data.bigDark));
  for(const p of data.footer){
    assert.match(p.bg,/255, 255, 255/,label+": old navy paginator "+JSON.stringify(p));
    assert.ok(p.box.w<=Math.max(350,size.width-12),label+": paginator spans full row "+JSON.stringify(p));
  }
  await page.screenshot({path:path.join(saveDir,size.name+"-"+label+".png"),fullPage:true,animations:"disabled"});
  return data;
}
try{
  let ready=false;
  for(let i=0;i<85;i++){try{const response=await fetch(origin+"/healthz");if(response.status===200){ready=true;break}}catch{}
    if(server.exitCode!==null)break;await new Promise(r=>setTimeout(r,120))}
  assert.ok(ready,"Server did not start "+err);
  browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
  await mkdir(saveDir,{recursive:true});
  for(const size of sizes){
    const ctx=await browser.newContext({viewport:{width:size.width,height:size.height}});
    const page=await ctx.newPage(),errors=[];
    page.on("pageerror",e=>errors.push(String(e)));
    try{
      await page.goto(origin+"/");
      await page.locator("#username").fill(user);
      await page.locator("#password").fill(pass);
      await page.locator('form[action="/_preview/login"] button').click();
      await page.waitForSelector("#stagingDemoRole",{timeout:22000});
      await page.goto(origin+"/?demo=1&account=TEST-ADMIN");
      await page.waitForSelector('#main[data-view="dashboard"]',{timeout:22000});
      await audit(page,"dashboard",size);
      await page.locator('.nav button[data-view="personnel"]').click();
      await page.waitForSelector('#main[data-view="personnel"]',{timeout:22000});
      const personnel=await audit(page,"personnel",size);
      if(personnel.footer.some(p=>p.buttons.some(b=>!b.disabled))){
        const pager=page.locator('#main .viewportPager:not([hidden])').first();
        const before=await pager.locator('span').textContent();
        await pager.locator('button').last().click();
        const after=await pager.locator('span').textContent();
        assert.notEqual(before,after,"Personnel table next-page navigation must work");
      }
      // New CRM reports use two modules: personnel/customer statistics
      // and monthly trading. The old ownership/order charts were removed.
      await page.locator('.nav button[data-view="reports"]').click();
      await page.waitForSelector('#main[data-view="reports"] .crmReportsGrid>.crmSubPanel',{timeout:22000});
      const reports=await audit(page,"reports",size);
      const reportGeometry=await page.evaluate(()=>{
        const rect=sel=>{const r=document.querySelector(sel)?.getBoundingClientRect();return r?{top:r.top,bottom:r.bottom,width:r.width,height:r.height}:null};
        const panels=[...document.querySelectorAll(".crmReportsGrid>.crmSubPanel")].map(el=>{const r=el.getBoundingClientRect();return {top:r.top,bottom:r.bottom,width:r.width,height:r.height}});
        return {main:rect("#main"),grid:rect(".crmReportsGrid"),panels,
          peopleList:!!document.querySelector("#crmReportPeople"),
          monthlyChart:!!document.querySelector("#monthlyTradeChart"),
          monthControl:!!document.querySelector("#reportMonth"),
          currencyControl:!!document.querySelector("#reportCurrency"),
          removedLegacyPanels:document.querySelectorAll(".reportOwnershipPanel,.reportOrderPanel").length};
      });
      assert.equal(reportGeometry.panels.length,2,"Two CRM reporting modules must render");
      assert.ok(reportGeometry.peopleList&&reportGeometry.monthlyChart,"Staff and monthly-trade modules must exist");
      assert.ok(reportGeometry.monthControl&&reportGeometry.currencyControl,"Month/currency filters must remain usable");
      assert.equal(reportGeometry.removedLegacyPanels,0,"Removed legacy owner/order panels must not return");
      assert.ok(reportGeometry.panels.every(p=>p.height>185),"CRM reporting modules collapsed");
      if(size.width>=1100){
        assert.ok(Math.abs(reportGeometry.panels[0].top-reportGeometry.panels[1].top)<8,"CRM report columns must align");
        assert.ok(reportGeometry.panels.every(p=>p.bottom<=reportGeometry.main.bottom+15),"CRM reports exceed 16:9 desktop frame");
      }
      records.push({view:"reports-geometry",size:size.name,data:reportGeometry});
      await page.locator('.nav button[data-view="market"]').click();
      await page.waitForSelector('#main[data-view="market"] .marketChartPanel',{timeout:22000});
      await page.waitForSelector("#marketRows .marketRow",{timeout:22000});
      const market=await audit(page,"market",size);
      const marketGeometry=await page.evaluate(()=>{
        const rect=sel=>{const r=document.querySelector(sel)?.getBoundingClientRect();return r?{top:r.top,bottom:r.bottom,width:r.width,height:r.height}:null};
        return {main:rect("#main"),hero:rect(".referenceMarketHero"),features:rect(".referenceFeatureCards"),
          list:rect(".marketListPanel"),quote:rect(".marketOverviewPanel"),
          chart:rect(".marketChartPanel"),chartCanvas:rect(".marketCanvas"),rows:document.querySelectorAll("#marketRows .marketRow").length,metrics:[...document.querySelectorAll(".marketOverviewPanel .marketMetric")].map(x=>{const r=x.getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:r.height}})};
      });
      assert.ok(marketGeometry.rows>=1,"Stock market list must contain real or isolated fixture rows");
      assert.ok(marketGeometry.quote?.height>210,"Quote details cannot be clipped");
      assert.ok(marketGeometry.chart?.height>210,"Market chart cannot be clipped");
      assert.equal(marketGeometry.metrics.length,6,"All six stock metrics must be rendered");
      if(size.width>=900){
        assert.ok(Math.abs(marketGeometry.quote.top-marketGeometry.chart.top)<7,"Market bottom row not aligned");
        assert.ok(Math.abs(marketGeometry.quote.bottom-marketGeometry.chart.bottom)<7,"Market quote and chart heights differ");
        assert.ok(marketGeometry.chart.bottom<=marketGeometry.main.bottom+12,"Market chart extends below viewport");
        assert.ok(marketGeometry.metrics.every(m=>m.height>=25&&m.top>=marketGeometry.quote.top&&m.bottom<=marketGeometry.quote.bottom-2),"Stock metrics are clipped outside the quote panel");
      }
      records.push({view:"market-geometry",size:size.name,data:marketGeometry});
      await page.locator('.nav button[data-view="shareboard"]').click();
      await page.waitForSelector('#main[data-view="shareboard"] .projectPresentation',{timeout:22000});
      const project=await audit(page,"allocation",size);
      const twoRows=await page.evaluate(()=>{
        const bbox=sel=>{const el=document.querySelector(sel),b=el?.getBoundingClientRect();return b?{x:b.x,y:b.y,width:b.width,height:b.height,bottom:b.bottom}:null};
        const el=document.querySelector(".projectOverview");
        return {recordCount:document.querySelectorAll(".projectRecordPanel").length,
          grid:getComputedStyle(el).gridTemplateRows,cards:bbox(".projectOverviewCards"),
          lower:bbox(".projectOverviewLower"),main:bbox("#main"),top:bbox(".projectOverview"),
          lowerPanels:[...document.querySelectorAll(".projectOverviewLower>.projectPanel")].map(x=>{
            const b=x.getBoundingClientRect();return {width:b.width,height:b.height,bottom:b.bottom};
          })
        };
      });
      assert.equal(twoRows.recordCount,0,"Red-boxed bottom reservation history MUST NOT exist in the DOM");
      assert.ok(twoRows.cards?.height>220,"Top project row must remain substantial");
      assert.ok(twoRows.lower?.height>250,"Trend and details row must occupy freed vertical space");
      assert.equal(twoRows.lowerPanels.length,2,"Trend and detail panels must both remain");
      if(size.width>=900){
        assert.ok(twoRows.cards.height>=270,"Top row was not expanded after removing history strip");
        assert.ok(twoRows.lower.height>=320,"Bottom row was not expanded after removing history strip");
        assert.ok(twoRows.lower.bottom<=size.height+20,"Two-row project layout overflows the viewport");
        assert.ok(Math.abs(twoRows.lowerPanels[0].height-twoRows.lowerPanels[1].height)<20,
           "Expanded lower panels must align in height");
      }
      if(size.width>=900){
        assert.ok(Math.abs(twoRows.main.y-reportGeometry.main.top)<8,"Allocation top not aligned to reports");
        assert.ok(Math.abs(twoRows.main.bottom-reportGeometry.main.bottom)<8,"Allocation frame height differs from reports");
        assert.ok(Math.abs(twoRows.main.bottom-marketGeometry.main.bottom)<8,"Allocation frame height differs from market");
        assert.ok(twoRows.lower.bottom>=twoRows.main.bottom-35,"Allocation lower row leaves unused footer band");
      }
      records.push({view:"allocation-two-row-geometry",size:size.name,data:twoRows});
      assert.equal(project.headerDisplay,"none","Old marked allocation strip must be deleted");
      assert.equal(project.topVisible,true,"Topbar must remain visible");
      assert.ok(project.ownerInTopbar&&project.ownerVisible,"Account selector was lost");
      assert.ok(project.captureInTopbar&&project.captureVisible,"Customer confirmation action was lost");
      assert.ok(project.backInTopbar&&project.backVisible,"Back button was lost");
      await page.locator("#projectCaptureButton").click();
      await page.waitForSelector("#customerFacingRoot .cfPreview .cfSheet",{timeout:15000});
      assert.ok(await page.locator("#cfDownloadPng").isVisible(),"Client confirmation PNG export action missing");
      assert.ok(await page.locator("#cfPrintPdf").isVisible(),"Client confirmation PDF print action missing");
      await page.keyboard.press("Escape");
      await page.locator("#customerFacingRoot").waitFor({state:"detached",timeout:5000});
      const canvasByView={};
      for(const view of ["reports","market"]){
        await page.locator('.nav button[data-view="'+view+'"]').click();
        await page.waitForSelector('#main[data-view="'+view+'"]',{timeout:20000});
        await page.waitForTimeout(250);
        const metric=await page.evaluate(view=>{
          const rect=selector=>{const el=document.querySelector(selector),b=el?.getBoundingClientRect();return b?{top:b.top,bottom:b.bottom,width:b.width,height:b.height}:null};
          const main=document.querySelector("#main"),root=main?.querySelector(view==="reports"?".crmReportsGrid":".canvaReferenceMarket");
          const panels=[...(main?.querySelectorAll(view==="reports"?".crmReportsGrid>.crmSubPanel":".referenceFeatureCards,.marketListPanel,.marketOverviewPanel,.marketChartPanel")||[])].map(x=>{
            const b=x.getBoundingClientRect();return {name:String(x.className),height:b.height,bottom:b.bottom,
              hidden:getComputedStyle(x).display==="none",scrollHeight:x.scrollHeight,clientHeight:x.clientHeight};
          });
          return {view,main:rect("#main"),root:rect(view==="reports"?"#main>.crmReportsSection .crmReportsGrid":"#main>.canvaReferenceMarket"),
            height:main?.clientHeight,width:main?.clientWidth,
            charts:[...main.querySelectorAll("canvas")].map(c=>({id:c.id,box:{width:c.getBoundingClientRect().width,height:c.getBoundingClientRect().height}})),
            panels,scrollWidth:document.documentElement.scrollWidth};
        },view);
        canvasByView[view]=metric;
        assert.ok(metric.scrollWidth<=size.width+5,view+" horizontal overflow");
        assert.ok(metric.panels.length>=(view==="reports"?2:4),view+" modules missing");
        assert.ok(metric.panels.every(p=>p.height>65&&!p.hidden),view+" contains collapsed panel "+JSON.stringify(metric.panels));
        if(size.width>=900){
          assert.ok(metric.root?.height>350,view+" uses too little vertical space");
          assert.ok(metric.panels.every(p=>p.bottom<=size.height+18),
            view+" panels cut off below 16:9 viewport "+JSON.stringify(metric.panels));
          assert.ok(metric.charts.every(c=>c.box.width>40&&c.box.height>70),
            view+" chart clipped "+JSON.stringify(metric.charts));
        }
        await page.screenshot({path:path.join(saveDir,size.name+"-"+view+"-unified.png"),fullPage:true,animations:"disabled"});
      }
      records.push({view:"unified-three-page-geometry",size:size.name,data:canvasByView});
      assert.equal(errors.length,0,"Browser errors "+errors.join("; "));
    }catch(e){failures.push({size:size.name,error:String(e),errors});}
    finally{await ctx.close();}
  }
  await writeFile(path.join(saveDir,"audit.json"),JSON.stringify({records,failures},null,2));
  console.log("P005_UI_FINISH_ACCEPTANCE "+JSON.stringify({checks:records.length,failures,views:records.map(r=>({size:r.size,view:r.view,footer:r.data.footer?.length??0,bigDark:r.data.bigDark?.length??0,header:r.data.headerDisplay}))}));
  if(failures.length)process.exitCode=1;
}finally{await browser?.close();server.kill("SIGTERM");}
