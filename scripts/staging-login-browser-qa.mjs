/**
 * Render P005 private preview: real Chromium click-through, isolated local server.
 * No Supabase credentials or real account information are supplied.
 */
import {chromium} from "playwright";
import {spawn} from "node:child_process";
import {createServer} from "node:net";
import {fileURLToPath} from "node:url";
import path from "node:path";
import assert from "node:assert/strict";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const username="qa-review",password="staging-test-very-long-qa-secret";
const port=await new Promise((resolve,reject)=>{
  const s=createServer();
  s.once("error",reject);
  s.listen(0,"127.0.0.1",()=>{const port=s.address().port;s.close(()=>resolve(port))});
});
const origin="http://127.0.0.1:"+port;
const server=spawn(process.execPath,["server.js"],{
 cwd:root,
 env:{...process.env,PORT:String(port),STAGING_PREVIEW:"1",STAGING_PREVIEW_USERNAME:username,STAGING_PREVIEW_PASSWORD:password},
 stdio:["ignore","pipe","pipe"]
});
let err="";
server.stderr.on("data",v=>err+=v.toString());
const issues=[],screens=[];
let browser;
try{
  let ready=false;
  for(let i=0;i<80;i++){
    try{const res=await fetch(origin+"/healthz");if(res.status===200){ready=true;break}}catch{}
    if(server.exitCode!==null)throw new Error("Server died: "+err);
    await new Promise(ok=>setTimeout(ok,150));
  }
  assert.ok(ready,"Staging server readiness failed "+err);
  browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
  for(const size of [{name:"desktop",width:1440,height:900},{name:"phone",width:390,height:844}]){
    const context=await browser.newContext({viewport:{width:size.width,height:size.height},httpCredentials:{username,password}});
    const page=await context.newPage();
    const errors=[],external=[];
    page.on("pageerror",e=>errors.push(String(e)));
    page.on("request",req=>{
      if(req.url().includes(".supabase.co"))external.push(req.url().split("/")[2]);
    });
    try{
      await page.goto(origin+"/",{waitUntil:"domcontentloaded",timeout:25000});
      await page.waitForSelector("#stagingDemoRole",{timeout:20000});
      assert.equal(await page.locator('input[name="password"]').count(),0,"Preview must not request an actual password");
      assert.equal(await page.locator('input[name="username"]').count(),0,"Preview must not request an actual username");
      assert.ok(await page.locator(".loginDemoNotice").isVisible(),"Preview warning must be visible");
      const roles=await page.locator("#stagingDemoRole option").count();
      assert.ok(roles>=2,"Demo role selector missing fixture accounts");
      await page.locator("#stagingDemoRole").selectOption({index:0});
      await page.locator("#loginForm button[type=submit]").click();
      await page.waitForURL(/account=/,{timeout:20000});
      await page.waitForSelector(".app .topbar",{timeout:20000});
      assert.ok(await page.locator(".app .topbar").isVisible(),"Dashboard must open after demo button");
      // Reservation pages must stay inside the browser (no native fullscreen).
      const projectLauncher=page.locator('[data-project-open="1"]').first();
      await projectLauncher.waitFor({state:"visible",timeout:15000});
      await projectLauncher.click();
      await page.waitForSelector('#main[data-view="shareboard"] .projectPresentation',{timeout:20000});
      // A supervisor with no own projects must see a permitted subordinate's complete detail page.
      const activeOwner=page.locator("#projectDetailOwnerSelect");
      await activeOwner.waitFor({state:"visible",timeout:15000});
      const ownerOptions=await activeOwner.locator("option").count();
      assert.ok(ownerOptions>=2,"Supervisor must be able to choose a subordinate account");
      assert.notEqual(await activeOwner.inputValue(),"TEST-ADMIN","Admin must not be stuck on three empty cards");
      await page.locator(".projectOverviewLower .projectTrendPanel").waitFor({state:"visible",timeout:15000});
      await page.locator(".projectOverviewSummary").waitFor({state:"visible",timeout:15000});
      await page.locator(".projectRecordPanel .dataTable").waitFor({state:"visible",timeout:15000});
      assert.ok(await page.locator(".projectOverviewCards .projectOverviewCard").count()===3,"Three overview cards must remain");
      const ownerBefore=await activeOwner.inputValue();
      const nextOwner=await activeOwner.locator("option").nth(1).getAttribute("value");
      if(nextOwner&&nextOwner!==ownerBefore){
        await activeOwner.selectOption(nextOwner);
        await page.waitForFunction(id=>document.querySelector("#projectDetailOwnerSelect")?.value===id,nextOwner,{timeout:15000});
        await page.locator(".projectRecordPanel .dataTable").waitFor({state:"visible",timeout:15000});
      }
      const projectFullscreen=await page.evaluate(()=>!!document.fullscreenElement);
      assert.equal(projectFullscreen,false,"Project detail opened browser fullscreen");
      assert.ok(await page.locator("#projectPresentationExit").isVisible(),"Project back action missing");
      await page.locator("#projectPresentationExit").click();
      await page.waitForSelector('#main[data-view="dashboard"]',{timeout:20000});
      const navProject=page.locator('.nav button[data-view="shareboard"]').first();
      await navProject.click();
      await page.waitForSelector('#main[data-view="shareboard"] .projectPresentation',{timeout:20000});
      assert.equal(await page.evaluate(()=>!!document.fullscreenElement),false,"Navbar opened browser fullscreen");
      await page.locator("#projectPresentationExit").click();
      await page.waitForSelector('#main[data-view="dashboard"]',{timeout:20000});
      // Stock-market audit: lower quotes, axes canvas and all list columns must be reachable.
      await page.locator('.nav button[data-view="market"]').click();
      await page.waitForSelector('#main[data-view="market"] .marketChartPanel',{timeout:25000});
      const marketLayout=await page.evaluate(()=>{
        const main=document.querySelector('#main[data-view="market"]');
        const grid=main?.querySelector('.canvaReferenceMarket');
        const list=main?.querySelector('.marketListPanel');
        const summary=main?.querySelector('.marketOverviewPanel');
        const metrics=main?.querySelector('.marketMetrics');
        const chart=main?.querySelector('.marketChartPanel');
        const canvas=main?.querySelector('#marketChart');
        const bounds=node=>node?.getBoundingClientRect();
        const style=node=>node?getComputedStyle(node):null;
        return {
          mainOverflow:style(main)?.overflowY,
          gridHeight:Math.round(bounds(grid)?.height||0),
          listHeight:Math.round(bounds(list)?.height||0),
          summaryHeight:Math.round(bounds(summary)?.height||0),
          chartHeight:Math.round(bounds(chart)?.height||0),
          canvasHeight:Math.round(bounds(canvas)?.height||0),
          metricPanelVisible:style(metrics)?.display!=="none",
          marketRows:main?.querySelectorAll("#marketRows .marketRow").length||0,
          minChartHeight:sizeHint(),
          chartHidden:style(chart)?.display==="none",
          bodyOverflow:document.documentElement.scrollWidth-innerWidth
        };
        function sizeHint(){return window.innerWidth<900?245:300}
      });
      assert.equal(marketLayout.chartHidden,false,"Market bottom chart is hidden");
      assert.ok(marketLayout.summaryHeight>=245,"Stock quote detail is cut off "+JSON.stringify(marketLayout));
      assert.ok(marketLayout.chartHeight>=marketLayout.minChartHeight,"Stock chart bottom is cut off "+JSON.stringify(marketLayout));
      assert.ok(marketLayout.metricPanelVisible,"Six stock stats are hidden");
      assert.ok(marketLayout.bodyOverflow<=3,"Market overflows the entire viewport");
      if(size.width>=900){
        assert.equal(marketLayout.mainOverflow,"auto","Desktop must scroll to reveal all bottom market panels");
        assert.ok(marketLayout.listHeight>=320,"Stock list is compressed");
      }
      await page.locator('.marketChartPanel').scrollIntoViewIfNeeded({timeout:10000});
      assert.ok(await page.locator('.marketChartPanel').isVisible(),"Bottom chart cannot be reached");
      await page.locator('.nav button[data-view="dashboard"]').click();
      await page.waitForSelector('#main[data-view="dashboard"]',{timeout:20000});
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
      assert.ok(overflow<=3,"Horizontal overflow: "+overflow);
      assert.deepEqual(external,[],"No live Supabase requests allowed");
      assert.deepEqual(errors,[],"Runtime errors: "+errors.join(" ; "));
      screens.push({size:size.name,roleOptions:roles,openedDemo:true,reservationLauncherNoFullscreen:true,reservationNavNoFullscreen:true,detailsVisible:true,reservationTableVisible:true,supervisorOwnerChooser:true,marketLayoutAudited:true,returnedToDashboard:true,noCredentialFields:true,externalSupabaseCalls:0,overflow});
    }catch(e){issues.push(size.name+": "+String(e)+" ; JS errors: "+errors.join(" | "));}
    await context.close();
  }
  console.log("P005_STAGING_BROWSER_QA "+JSON.stringify({screens,issues}));
  if(issues.length)process.exitCode=1;
}finally{if(browser)await browser.close();server.kill("SIGTERM");}
