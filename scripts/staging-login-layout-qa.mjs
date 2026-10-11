/* Real Chromium geometry and screenshots for P005's isolated preview login.
   No production credentials, real account access or Supabase traffic. */
import {chromium} from "playwright";
import {spawn} from "node:child_process";
import {createServer} from "node:net";
import {mkdir,writeFile} from "node:fs/promises";
import {fileURLToPath} from "node:url";
import path from "node:path";
import assert from "node:assert/strict";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const port=await new Promise((resolve,reject)=>{
  const s=createServer();s.once("error",reject);
  s.listen(0,"127.0.0.1",()=>{const n=s.address().port;s.close(()=>resolve(n));});
});
const origin="http://127.0.0.1:"+port;
const username="qa-login-fit",password="qa-password-for-private-staging-2026";
const server=spawn(process.execPath,["server.js"],{
  cwd:root,
  env:{...process.env,PORT:String(port),STAGING_PREVIEW:"1",STAGING_PREVIEW_USERNAME:username,STAGING_PREVIEW_PASSWORD:password},
  stdio:["ignore","pipe","pipe"]
});
let stderr="";server.stderr.on("data",x=>stderr+=x.toString());
const sizes=[
  {name:"desktop-2048x1152",width:2048,height:1152},
  {name:"desktop-1920x1080",width:1920,height:1080},
  {name:"desktop-1600x900",width:1600,height:900},
  {name:"desktop-1440x900",width:1440,height:900},
  {name:"laptop-1366x768",width:1366,height:768},
  {name:"short-laptop-1024x576",width:1024,height:576},
  {name:"tablet-820x1180",width:820,height:1180},
  {name:"phone-390x844",width:390,height:844},
  {name:"phone-360x780",width:360,height:780}
];
let browser;const results=[],failures=[];
try{
  let ready=false;
  for(let i=0;i<100;i++){
    try{const r=await fetch(origin+"/healthz");if(r.status===200){ready=true;break}}catch{}
    if(server.exitCode!==null)throw new Error("Server stopped: "+stderr);
    await new Promise(ok=>setTimeout(ok,120));
  }
  assert.ok(ready,"Server must be reachable");
  browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
  const dir=path.join(root,"artifacts/login-fit");
  await mkdir(dir,{recursive:true});
  for(const size of sizes){
    const context=await browser.newContext({viewport:{width:size.width,height:size.height},deviceScaleFactor:1});
    const page=await context.newPage();
    const errors=[],external=[];
    page.on("pageerror",e=>errors.push(String(e)));
    page.on("request",r=>{if(r.url().includes(".supabase.co"))external.push(r.url());});
    try{
      await page.goto(origin+"/",{waitUntil:"domcontentloaded",timeout:30000});
      await page.locator("#username").fill(username);
      await page.locator("#password").fill(password);
      await page.locator('form[action="/_preview/login"] button[type="submit"]').click();
      await page.waitForSelector("#stagingDemoRole",{timeout:30000});
      await page.waitForTimeout(180);
      const m=await page.evaluate(()=>{
        const rect=s=>{const n=document.querySelector(s);if(!n)return null;
          const b=n.getBoundingClientRect();
          return {x:b.x,y:b.y,width:b.width,height:b.height,right:b.right,bottom:b.bottom,scrollHeight:n.scrollHeight,clientHeight:n.clientHeight,display:getComputedStyle(n).display};
        };
        const logo=document.querySelector(".loginPage .brandLogo");
        return {
          viewport:{width:innerWidth,height:innerHeight},
          bodyDesktopFrame:document.body.classList.contains("desktopFrame"),
          scrollWidth:document.documentElement.scrollWidth,
          page:rect(".loginPage"),hero:rect(".loginHero"),side:rect(".loginSide"),
          logo:rect(".heroMark"),intro:rect(".loginHeroIntro"),modules:rect(".loginHeroModules"),
          card:rect(".loginCard"),button:rect(".loginSubmit"),
          role:rect("#stagingDemoRole"),
          logoLoaded:!!(logo&&logo.naturalWidth>0),
          bodyScroll:document.documentElement.scrollHeight
        };
      });
      assert.equal(m.bodyDesktopFrame,false,"Login must not inherit the scaled 1600×900 dashboard frame");
      assert.ok(m.logoLoaded,"Original logo must load");
      assert.ok(m.page&&Math.abs(m.page.x)<=2&&Math.abs(m.page.y)<=2,"Login must begin at viewport top-left");
      assert.ok(Math.abs(m.page.width-size.width)<=3,"Outer login must use full viewport width");
      assert.ok(m.scrollWidth<=size.width+3,"No horizontal overflow");
      assert.ok(m.button?.width>=200&&m.button?.height>=45,"Primary action must be usable");
      assert.ok(m.card?.x>=0&&m.card?.right<=size.width+2,"Card must not extend beyond viewport");
      assert.ok(m.role?.width>=200,"Role selector must remain readable");
      assert.ok(m.side?.width>0&&m.hero?.width>0,"Login columns must exist");
      if(size.width>=900){
        assert.ok(m.hero.width/size.width>.38,"Hero too narrow for desktop");
        assert.ok(m.side.width/size.width>.34,"Right form section too narrow");
        assert.ok(m.modules?.display!=="none","Desktop feature zone missing");
        assert.ok(m.logo?.bottom<m.intro?.y+10,"Top logo overlaps editorial content");
        assert.ok(m.intro?.bottom<m.modules?.y+10,"Editorial content overlaps feature zone");
        assert.ok(m.hero.scrollHeight<=m.hero.clientHeight+10,"Hero text is clipped");
        assert.ok(m.side.scrollHeight<=m.side.clientHeight+10,"Right login content is clipped");
        if(size.height>700)assert.ok(Math.abs(m.page.height-size.height)<=3,"Desktop must fill the viewport, without letterboxing");
        else assert.ok(m.page.height>=size.height,"Short laptop must remain scrollable instead of clipping");
      }else{
        assert.ok(m.page.height>=size.height-2,"Mobile page must occupy viewport");
        assert.equal(m.intro?.display,"none","Phone should use compact logo first layout");
        assert.ok(m.button.bottom<=Math.max(size.height+80,900),"Phone CTA is buried far below the first screen");
      }
      assert.deepEqual(external,[],"Preview must never call live Supabase");
      assert.deepEqual(errors,[],"No runtime errors allowed");
      await page.screenshot({path:path.join(dir,size.name+".png"),fullPage:true,animations:"disabled"});
      results.push({size:size.name,status:"pass",metrics:m});
    }catch(error){
      failures.push({size:size.name,error:String(error)});
      await page.screenshot({path:path.join(dir,size.name+"-failed.png"),fullPage:true,animations:"disabled"}).catch(()=>{});
    }finally{await context.close();}
  }
  await writeFile(path.join(dir,"geometry.json"),JSON.stringify({results,failures},null,2));
  console.log("P005_LOGIN_FIT_BROWSER_QA "+JSON.stringify({
    tested:results.length+failures.length,passed:results.length,failed:failures.length,
    reports:results.map(r=>({size:r.size,viewport:r.metrics.viewport,page:r.metrics.page,hero:r.metrics.hero,side:r.metrics.side})),
    failures
  }));
  if(failures.length)process.exitCode=1;
}finally{await browser?.close();server.kill("SIGTERM");}
