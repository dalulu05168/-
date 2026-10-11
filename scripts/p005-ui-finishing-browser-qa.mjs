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
      records.push({view:"allocation-two-row-geometry",size:size.name,data:twoRows});
      assert.equal(project.headerDisplay,"none","Old marked allocation strip must be deleted");
      assert.equal(project.topVisible,true,"Topbar must remain visible");
      assert.ok(project.ownerInTopbar&&project.ownerVisible,"Account selector was lost");
      assert.ok(project.captureInTopbar&&project.captureVisible,"Screenshot button was lost");
      assert.ok(project.backInTopbar&&project.backVisible,"Back button was lost");
      await page.locator("#projectCaptureButton").click();
      assert.equal(await page.evaluate(()=>document.body.classList.contains("projectCaptureMode")),true);
      await page.keyboard.press("Escape");
      assert.equal(await page.evaluate(()=>document.body.classList.contains("projectCaptureMode")),false);
      assert.equal(errors.length,0,"Browser errors "+errors.join("; "));
    }catch(e){failures.push({size:size.name,error:String(e),errors});}
    finally{await ctx.close();}
  }
  await writeFile(path.join(saveDir,"audit.json"),JSON.stringify({records,failures},null,2));
  console.log("P005_UI_FINISH_ACCEPTANCE "+JSON.stringify({checks:records.length,failures,views:records.map(r=>({size:r.size,view:r.view,footer:r.data.footer.length,bigDark:r.data.bigDark.length,header:r.data.headerDisplay}))}));
  if(failures.length)process.exitCode=1;
}finally{await browser?.close();server.kill("SIGTERM");}
