/* Read-only SVG logo quality QA at desktop, 4K, and mobile dimensions.
   Runs only on isolated demo; never authenticates to production. */
import {chromium} from "playwright";
import {spawn} from "node:child_process";
import {createServer} from "node:net";
import {readFile} from "node:fs/promises";

const demo=JSON.parse(await readFile(new URL("../demo-data.json",import.meta.url),"utf8"));
if(demo.environment!=="test"||demo.is_simulated!==true)throw Error("Isolated test fixture required");
const admin=demo.profiles.find(p=>p.role==="admin");
if(!admin)throw Error("Missing demo admin");
const listener=createServer();
await new Promise((ok,fail)=>listener.once("error",fail).listen(0,"127.0.0.1",ok));
const port=listener.address().port;
await new Promise(ok=>listener.close(ok));
const origin="http://127.0.0.1:"+port;
const proc=spawn(process.execPath,["server.js"],{
 cwd:new URL("..",import.meta.url).pathname,env:{...process.env,PORT:String(port)},stdio:["ignore","pipe","pipe"]
});
let err="";proc.stderr.on("data",d=>{err+=String(d)});
let browser;
try{
 let ready=false;
 for(let i=0;i<100;i++){
  try{const response=await fetch(origin);if(response.ok){ready=true;break}}catch{}
  if(proc.exitCode!==null)throw Error("Demo server exited: "+err);
  await new Promise(ok=>setTimeout(ok,120));
 }
 if(!ready)throw Error("Demo server unavailable: "+err);
 const svg=await fetch(origin+"/assets/brand-logo-transparent-color.svg");
 if(!svg.ok)throw Error("Vector logo HTTP request returned "+svg.status);
 const source=await svg.text();
 if(!source.includes('viewBox="123 180 1857 430"')||source.includes("<image"))
  throw Error("Logo is not the approved path-only SVG vector");
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 for(const width of [390,1440,1600,3840]){
  const page=await browser.newPage({viewport:{width,height:width===390?844:900},deviceScaleFactor:2});
  const errors=[];page.on("pageerror",e=>errors.push(String(e)));
  try{
   await page.goto(origin+"/?demo=1&account="+encodeURIComponent(admin.id),{waitUntil:"domcontentloaded"});
   await page.waitForSelector(".topbar>.brand>img.brandLogo",{timeout:20000});
   await page.waitForFunction(()=>{
    const logo=document.querySelector(".topbar>.brand>img.brandLogo");
    return logo?.complete&&logo.naturalWidth>0;
   },{timeout:20000});
   const data=await page.evaluate(()=>{
    const logo=document.querySelector(".topbar>.brand>img.brandLogo");
    const brand=logo.parentElement;
    const r=logo.getBoundingClientRect(),br=brand.getBoundingClientRect(),style=getComputedStyle(logo);
    const head=document.querySelector(".topbar").getBoundingClientRect();
    return {src:logo.currentSrc,brandWidth:br.width,brandHeight:br.height,
      logoWidth:r.width,logoHeight:r.height,naturalWidth:logo.naturalWidth,
      naturalHeight:logo.naturalHeight,headHeight:head.height,
      objectFit:style.objectFit,objectPosition:style.objectPosition,
      filter:style.filter,transform:style.transform,imageRendering:style.imageRendering,
      opacity:style.opacity,visible:getComputedStyle(brand).visibility,
      navButtons:document.querySelectorAll(".nav button").length,
      width:innerWidth};
   });
   const fail=reason=>{throw Error(width+"px "+reason+" "+JSON.stringify(data))};
   if(!data.src.includes("brand-logo-transparent-color.svg"))fail("incorrect logo source");
   if(data.logoWidth<245||data.logoHeight<52)fail("logo too small to be legible");
   if(width>=900 && data.logoWidth>322)fail("logo overflows topbar");
   if(data.filter!=="none"||data.transform!=="none"||data.imageRendering!=="auto"||
     data.objectFit!=="contain"||data.opacity!=="1")fail("logo image being altered by theme");
   if(data.navButtons<8)fail("navigation unexpectedly missing");
   if(errors.length)fail("runtime errors "+errors.join(";"));
   console.log("CRM_VECTOR_LOGO_QA",JSON.stringify(data));
  }finally{await page.close()}
 }
}finally{if(browser)await browser.close();proc.kill("SIGTERM")}
