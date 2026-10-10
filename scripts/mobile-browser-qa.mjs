/*
 * Browser-level, read-only MOBILE QA against the explicitly simulated CRM.
 * NEVER authenticates to real Supabase or sends write actions.
 * Requires npm install --no-save playwright and npx playwright install chromium.
 */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { createServer } from "node:net";

const seed=JSON.parse(await readFile(new URL("../demo-data.json",import.meta.url),"utf8"));
if(seed.environment!=="test"||seed.is_simulated!==true)throw new Error("Browser QA must use test-only data");
const roles=["admin","level1","level2"];
const accounts=roles.map(role=>{
 const actor=seed.profiles.find(p=>p.role===role);
 if(!actor)throw new Error("Missing simulated role "+role);
 return {role,id:actor.id};
});
const routes=["dashboard","customers","personnel","trades","positions","market","reports","settings","shareboard"];
const dims=[{width:390,height:844},{width:768,height:1024},{width:360,height:780}];

async function freePort(){
 const listener=createServer();
 await new Promise((resolve,reject)=>listener.once("error",reject).listen(0,"127.0.0.1",resolve));
 const port=listener.address().port;
 await new Promise(resolve=>listener.close(resolve));
 return port;
}
const port=await freePort();
const origin="http://127.0.0.1:"+port;
const server=spawn(process.execPath,["server.js"],{
 cwd:new URL("..",import.meta.url).pathname,
 env:{...process.env,PORT:String(port)},
 stdio:["ignore","pipe","pipe"]
});
let stderr="";
server.stderr.on("data",data=>{stderr+=data.toString()});
let browser,failures=[];
try{
 let ready=false;
 for(let t=0;t<100;t++){
  if(server.exitCode!==null)throw new Error("Local server unexpectedly exited: "+stderr);
  try{const result=await fetch(origin+"/");if(result.ok){ready=true;break}}catch{}
  await new Promise(r=>setTimeout(r,120));
 }
 if(!ready)throw new Error("Local CRM HTTP server did not start: "+stderr);
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 await mkdir("artifacts/mobile",{recursive:true});
 const report=[];
 for(const viewport of dims){
  for(const actor of accounts){
   const page=await browser.newPage({viewport,deviceScaleFactor:1,isMobile:viewport.width<=390,hasTouch:viewport.width<=390});
   const requestErrors=[];
   page.on("pageerror",e=>requestErrors.push(String(e)));
   try{
    await page.goto(origin+"/?demo=1&account="+encodeURIComponent(actor.id),{waitUntil:"domcontentloaded",timeout:40000});
    await page.waitForSelector("#main[data-view]",{timeout:40000});
    await page.waitForTimeout(600);
    for(const view of routes){
     if(view==="personnel"&&actor.role==="level2")continue;
     const nav=page.locator('.topbar .nav button[data-view="'+view+'"]');
     if(await nav.count()!==1){
      failures.push(actor.role+"/"+view+"/"+viewport.width+": navigation missing");
      continue;
     }
     await nav.click({timeout:9000});
     await page.waitForFunction(v=>document.querySelector("#main")?.dataset.view===v,view,{timeout:15000});
     await page.waitForTimeout(450);
     const diagnostics=await page.evaluate(()=>{
      const main=document.querySelector("#main");
      const rect=main?.getBoundingClientRect();
      const logos=[...document.querySelectorAll(".brandLogo")].filter(x=>{
       const style=getComputedStyle(x),r=x.getBoundingClientRect();
       return style.display!=="none"&&style.visibility!=="hidden"&&r.width>3&&r.height>3;
      });
      const badColors=[];
      for(const el of document.querySelectorAll(".panel,.terminalPositionCard,.projectOverviewCard,.level2Metric,.referenceFeatureCard")){
       const style=getComputedStyle(el);
       const bg=style.backgroundColor;
       const fg=style.color;
       function rgb(s){const m=s.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);return m?[+m[1],+m[2],+m[3]]:null}
       const a=rgb(bg),b=rgb(fg);
       if(a&&b&&a.every(v=>v<65)&&b.every(v=>v<105)){
        badColors.push({className:el.className,background:bg,color:fg});
       }
      }
      const tableWrappers=[...document.querySelectorAll("#main .tableWrap")];
      const wideTables=tableWrappers.filter(x=>x.scrollWidth>x.clientWidth+2);
      return {
       view:main?.dataset.view,viewport:innerWidth,
       shellWidth:document.querySelector(".shell")?.getBoundingClientRect().width,
       mainWidth:rect?.width,mainContentLength:main?.textContent?.trim()?.length||0,
       htmlOverflow:Math.max(0,document.documentElement.scrollWidth-innerWidth),
       navIsScrollable:document.querySelector(".navFrame")?.scrollWidth>document.querySelector(".navFrame")?.clientWidth,
       visibleLogoCount:logos.length,
       badColors:badColors.slice(0,4),
       wideTableCount:wideTables.length,
       clippedControls:[...document.querySelectorAll("#main input,#main select,#main button")].filter(el=>{
        const r=el.getBoundingClientRect();return r.width>0&&r.width<22&&getComputedStyle(el).display!=="none";
       }).slice(0,5).map(el=>el.id||String(el.className))
      };
     });
     report.push({role:actor.role,width:viewport.width,...diagnostics});
     if(diagnostics.mainContentLength===0)failures.push(actor.role+"/"+view+"/"+viewport.width+": empty screen");
     if(diagnostics.mainWidth<260)failures.push(actor.role+"/"+view+"/"+viewport.width+": main container too narrow");
     if(diagnostics.badColors.length)failures.push(actor.role+"/"+view+"/"+viewport.width+": illegible dark panels "+JSON.stringify(diagnostics.badColors));
     if(diagnostics.htmlOverflow>8)failures.push(actor.role+"/"+view+"/"+viewport.width+": document horizontal overflow "+diagnostics.htmlOverflow);
     if(view==="shareboard"&&viewport.width<=390){
      const cards=page.locator(".projectOverviewCard");
      const count=await cards.count();
      if(count){
       const boxes=await cards.evaluateAll(els=>els.map(x=>{const r=x.getBoundingClientRect();return{x:r.x,w:r.width,y:r.y}}));
       if(boxes.some(x=>x.w>viewport.width-10))failures.push("project card width exceeds phone");
       if(boxes.length>1&&boxes[1].y<=boxes[0].y)failures.push("project cards not vertically stacked");
      }
     }
     if(view==="dashboard"||view==="positions"||view==="shareboard"||view==="market"){
      await page.screenshot({path:"artifacts/mobile/"+actor.role+"-"+viewport.width+"-"+view+".png",fullPage:viewport.width===390,animations:"disabled"});
     }
    }
   }catch(e){
    failures.push(actor.role+"/"+viewport.width+": "+String(e));
   }finally{
    if(requestErrors.length)report.push({role:actor.role,width:viewport.width,pageErrors:requestErrors.slice(0,5)});
    await page.close();
   }
  }
 }
 await writeFile("artifacts/mobile/qa-report.json",JSON.stringify({tested:report.length,report,failures},null,2));
 console.log("Mobile QA diagnostics:",JSON.stringify({tested:report.length,failures:failures.slice(0,15)}));
 if(failures.length)process.exitCode=1;
}finally{
 if(browser)await browser.close();
 server.kill("SIGTERM");
}
