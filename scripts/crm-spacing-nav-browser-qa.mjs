/* Read-only demo UI acceptance for exact 1mm module gaps and reversible sidebar.
   Uses isolated ?demo=1 data: never signs into or writes to production. */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { readFile } from "node:fs/promises";
const fixture=JSON.parse(await readFile(new URL("../demo-data.json",import.meta.url),"utf8"));
if (fixture.environment!=="test" || fixture.is_simulated!==true) throw Error("Must use isolated demo fixture");
const admin=fixture.profiles.find(x=>x.role==="admin");
if (!admin) throw Error("No demo admin account");

const portServer=createServer();
await new Promise((resolve,reject)=>portServer.once("error",reject).listen(0,"127.0.0.1",resolve));
const port=portServer.address().port;
await new Promise(resolve=>portServer.close(resolve));
const origin="http://127.0.0.1:"+port;
const proc=spawn(process.execPath,["server.js"],{
  cwd:new URL("..",import.meta.url).pathname,
  env:{...process.env,PORT:String(port)},stdio:["ignore","pipe","pipe"]
});
let stderr="";proc.stderr.on("data",b=>{stderr+=String(b)});
let browser;
try{
  let ready=false;
  for(let i=0;i<100;i++){
    try{const r=await fetch(origin);if(r.ok){ready=true;break}}catch{}
    await new Promise(resolve=>setTimeout(resolve,120));
  }
  if(!ready)throw Error("Local HTTP server not ready: "+stderr);
  browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
  for(const width of [1440,390]){
    const page=await browser.newPage({viewport:{width,height:width===1440?900:844}});
    const errors=[];page.on("pageerror",error=>errors.push(String(error)));
    await page.goto(origin+"/?demo=1&account="+encodeURIComponent(admin.id),{waitUntil:"domcontentloaded"});
    await page.waitForSelector("#main[data-view]",{timeout:20000});
    const toggle=page.locator("#toggleNavigation");
    await toggle.waitFor({state:"visible"});
    const layout=()=>page.evaluate(()=>{
      const el=document.querySelector("#main"), nav=document.querySelector(".navFrame");
      const shell=document.querySelector(".shell");
      const label=document.querySelector(".nav button .navLabel");
      return {mainGap:parseFloat(getComputedStyle(el).gap),
        navWidth:nav?.getBoundingClientRect().width,
        shellPadding:parseFloat(getComputedStyle(shell).paddingLeft),
        labelDisplay:getComputedStyle(label).display,
        compact:document.body.classList.contains("navigationCompact"),
        expanded:document.querySelector("#toggleNavigation").getAttribute("aria-expanded"),
        navButtons:document.querySelectorAll(".nav button").length,
        htmlOverflow:Math.max(0,document.documentElement.scrollWidth-innerWidth)};
    });
    const before=await layout();
    if(before.navButtons<8)throw Error(width+": menu missing "+JSON.stringify(before));
    if(Math.abs(before.mainGap-(96/25.4))>0.08)throw Error(width+": 1mm gap not applied "+JSON.stringify(before));
    if(width===1440 && Math.abs(before.navWidth-200)>2)throw Error("Expanded sidebar not 200px: "+JSON.stringify(before));
    await toggle.click();
    const compact=await layout();
    if(!compact.compact||compact.expanded!=="false")throw Error(width+": compact toggle not applied "+JSON.stringify(compact));
    if(width===1440 && (Math.abs(compact.navWidth-64)>2||Math.abs(compact.shellPadding-64)>2))
      throw Error("Icon-only sidebar did not shrink content: "+JSON.stringify(compact));
    if(compact.labelDisplay!=="none")throw Error(width+": compact labels still visible");
    await page.locator('.nav button[data-view="shareboard"]').click();
    await page.waitForFunction(()=>document.querySelector("#main")?.dataset.view==="shareboard",{timeout:15000});
    const stillCompact=await layout();
    if(!stillCompact.compact)throw Error(width+": navigation state lost on page switch");
    await toggle.click();
    const after=await layout();
    if(after.compact||after.expanded!=="true")throw Error(width+": expand toggle not restored");
    if(width===1440 && Math.abs(after.navWidth-200)>2)throw Error("Sidebar did not restore 200px width");
    if(errors.length)throw Error(width+": browser runtime errors: "+errors.join("; "));
    console.log("CRM_LAYOUT_QA",JSON.stringify({width,before,compact,after}));
    await page.close();
  }
}finally{if(browser)await browser.close();proc.kill("SIGTERM")}
