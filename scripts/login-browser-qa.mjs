/*
 * Read-only, real Chromium acceptance for the redesigned login.
 * Uses ?demo=1&loginPreview=1: isolated browser-only simulator.
 * DOES NOT SEND CREDENTIALS OR REQUEST LIVE SUPABASE AUTH.
 */
import {chromium} from "playwright";
import {spawn} from "node:child_process";
import {createServer} from "node:net";
import {readFile,mkdir,writeFile} from "node:fs/promises";
import {fileURLToPath} from "node:url";
import path from "node:path";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const seed=JSON.parse(await readFile(path.join(root,"demo-data.json"),"utf8"));
if(seed.environment!=="test"||seed.is_simulated!==true)throw new Error("Login browser QA requires explicit demo seed");
async function freePort(){
 const s=createServer();await new Promise((ok,fail)=>s.once("error",fail).listen(0,"127.0.0.1",ok));
 const port=s.address().port;await new Promise(ok=>s.close(ok));return port;
}
const port=await freePort(),origin="http://127.0.0.1:"+port;
const server=spawn(process.execPath,["server.js"],{cwd:root,env:{...process.env,PORT:String(port)},stdio:["ignore","pipe","pipe"]});
let stderr="";server.stderr.on("data",d=>{stderr+=d});
let browser;const results=[],failures=[];
const sizes=[
 {name:"desktop",width:1440,height:900,mobile:false},
 {name:"tablet",width:768,height:1024,mobile:false},
 {name:"iphone",width:390,height:844,mobile:true},
 {name:"small-phone",width:360,height:780,mobile:true}
];
try{
 let ready=false;
 for(let i=0;i<90;i++){
  try{const r=await fetch(origin);if(r.ok){ready=true;break}}catch{}
  if(server.exitCode!==null)throw new Error("HTTP server exited "+stderr);
  await new Promise(r=>setTimeout(r,120));
 }
 if(!ready)throw new Error("CRM test server did not start "+stderr);
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 await mkdir(path.join(root,"artifacts/login"),{recursive:true});
 for(const size of sizes){
  const page=await browser.newPage({
   viewport:{width:size.width,height:size.height},
   isMobile:size.mobile,hasTouch:size.mobile,deviceScaleFactor:size.mobile?2:1
  });
  const errors=[];page.on("pageerror",e=>errors.push(String(e)));
  try{
   await page.goto(origin+"/?demo=1&loginPreview=1",{waitUntil:"domcontentloaded",timeout:25000});
   await page.waitForSelector("#loginForm",{timeout:20000});
   await page.waitForTimeout(370);
   const a=await page.evaluate(()=>{
    const $=s=>document.querySelector(s),bounds=el=>{
     if(!el)return null;const r=el.getBoundingClientRect();
     return {x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),bottom:Math.round(r.bottom),right:Math.round(r.right)};
    };
    const computed=el=>el?{background:getComputedStyle(el).backgroundColor,color:getComputedStyle(el).color,font:getComputedStyle(el).fontSize}:null;
    const logo=$(".loginPage .brandLogo");
    const form=$("#loginForm"),card=$(".loginCard");
    return {
      innerWidth,innerHeight,
      scrollWidth:document.documentElement.scrollWidth,
      text:document.body.innerText.slice(0,800),
      logoCount:document.querySelectorAll(".loginPage .brandLogo").length,
      logoLoaded:!!logo?.naturalWidth,
      logoBounds:bounds(logo),
      hero:bounds($(".loginHero")),
      card:bounds(card),
      cardStyle:computed(card),
      heading:bounds($(".loginCard h2")),
      headingStyle:computed($(".loginCard h2")),
      username:bounds($('#loginUsername')),
      password:bounds($('#loginPassword')),
      button:bounds($('.loginSubmit')),
      buttonStyle:computed($('.loginSubmit')),
      inputStyle:computed($('#loginUsername')),
      formPresent:!!form,passToggle:!!$(".loginPasswordToggle"),
      errorHidden:$("#loginError")?.hidden,
      hiddenDuplicateLogo:document.querySelectorAll(".loginPage .brandLogo").length===1
    };
   });
   if(!a.formPresent||!a.logoLoaded||!a.hiddenDuplicateLogo)failures.push(size.name+": missing form or one original SVG logo");
   if(!a.passToggle||a.errorHidden!==true)failures.push(size.name+": password toggle/error slot incorrect");
   if(a.scrollWidth>a.innerWidth+3)failures.push(size.name+": viewport horizontal overflow "+JSON.stringify(a));
   if(a.card?.right>a.innerWidth+2||a.card?.x<0)failures.push(size.name+": form card outside viewport");
   if(a.username?.w<200||a.password?.w<200||a.button?.w<200)failures.push(size.name+": form fields too narrow");
   if(a.username?.h<42||a.password?.h<42||a.button?.h<45)failures.push(size.name+": touch targets too small");
   if(size.mobile&&a.button?.bottom>size.height+80)failures.push(size.name+": submit button buried below initial phone viewport "+a.button.bottom);
   if(size.mobile&&parseFloat(a.inputStyle?.font||"0")<16)failures.push(size.name+": iPhone input text triggers zoom");
   if(!a.buttonStyle?.background.includes("18, 136, 122"))failures.push(size.name+": primary login button is not teal "+a.buttonStyle?.background);
   if(errors.length)failures.push(size.name+": runtime JS errors "+JSON.stringify(errors));
   await page.locator("#loginPassword").fill("do-not-submit-demo-password");
   await page.locator(".loginPasswordToggle").click();
   if(await page.locator("#loginPassword").getAttribute("type")!=="text")failures.push(size.name+": show password action failed");
   await page.locator(".loginPasswordToggle").click();
   if(await page.locator("#loginPassword").getAttribute("type")!=="password")failures.push(size.name+": hide password action failed");
   await page.locator("#loginPassword").fill("");
   await page.screenshot({path:path.join(root,"artifacts/login",size.name+".png"),fullPage:true,animations:"disabled"});
   results.push({device:size.name,width:size.width,...a});
  }catch(e){failures.push(size.name+": "+String(e))}
  finally{await page.close()}
 }
 await writeFile(path.join(root,"artifacts/login","results.json"),JSON.stringify({results,failures},null,2));
 console.log("LOGIN_BROWSER_QA",JSON.stringify({tested:results.length,failures,results:results.map(x=>({device:x.device,logo:x.logoBounds,card:x.card,button:x.button,cardBackground:x.cardStyle?.background,buttonBackground:x.buttonStyle?.background,scrollWidth:x.scrollWidth,innerWidth:x.innerWidth}))}));
 if(failures.length)process.exitCode=1;
}finally{if(browser)await browser.close();server.kill("SIGTERM")}
