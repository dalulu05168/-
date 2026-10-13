/*
 * Read-only, isolated CRM 16:9 desktop acceptance.
 * No production authentication, database writes or external deployments.
 */
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {createServer} from 'node:net';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const fixture=JSON.parse(await readFile(path.join(root,'demo-data.json'),'utf8'));
if(fixture.environment!=='test'||fixture.is_simulated!==true)throw Error('Only isolated simulated fixtures allowed');
const admin=fixture.profiles.find(actor=>actor.role==='admin');
if(!admin)throw Error('No simulated administrator account');
const port=await new Promise((resolve,reject)=>{
  const s=createServer();
  s.once('error',reject);
  s.listen(0,'127.0.0.1',()=>{const number=s.address().port;s.close(()=>resolve(number));});
});
const base='http://127.0.0.1:'+port;
const server=spawn(process.execPath,['server.js'],{cwd:root,env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','pipe']});
let stderr='';
server.stderr.on('data',chunk=>{stderr+=chunk.toString()});
let browser;
function approx(actual,target,label){
 if(!Number.isFinite(actual)||Math.abs(actual-target)>1.5)throw Error(label+' expected '+target+'px, got '+actual+'px');
}
try{
  let ready=false;
  for(let i=0;i<100;i++){
    if(server.exitCode!==null)throw Error('CRM server exited: '+stderr);
    try{const r=await fetch(base+'/');if(r.ok){ready=true;break}}catch{}
    await new Promise(r=>setTimeout(r,100));
  }
  if(!ready)throw Error('CRM test server did not start: '+stderr);
  browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:1600,height:900},deviceScaleFactor:1});
  const jsErrors=[];
  page.on('pageerror',error=>jsErrors.push(String(error)));
  await page.goto(base+'/?demo=1&account='+encodeURIComponent(admin.id),{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForSelector('#main[data-view]',{timeout:20000});
  const measure=()=>page.evaluate(()=>{
    const nav=document.querySelector('.navFrame'),shell=document.querySelector('.shell');
    const main=document.querySelector('#main');
    const navStyle=nav?getComputedStyle(nav):null;
    return {
      navWidth:nav?.getBoundingClientRect().width,
      navDisplay:navStyle?.display,
      shellPadding:parseFloat(getComputedStyle(shell).paddingLeft),
      mainGap:parseFloat(getComputedStyle(main).gap),
      mainView:main?.dataset.view,
      buttonLabels:[...document.querySelectorAll('.nav button')].map(x=>x.getAttribute('aria-label')),
      rootOverflow:document.documentElement.scrollWidth-innerWidth,
      collapsed:document.body.classList.contains('navigationHidden')
    };
  });
  let expanded=await measure();
  approx(expanded.navWidth,200,'Expanded navigation width');
  approx(expanded.shellPadding,200,'Expanded shell content offset');
  approx(expanded.mainGap,96/25.4,'1mm module box gap');
  if(expanded.buttonLabels.length!==9)throw Error('Unexpected admin navigation modules: '+expanded.buttonLabels.length);
  if(expanded.rootOverflow>2)throw Error('Desktop viewport overflows horizontally: '+expanded.rootOverflow);
  await page.locator('#toggleNavigation').click();
  await page.waitForTimeout(350);
  let collapsed=await measure();
  approx(collapsed.navWidth,64,'Collapsed navigation width');
  approx(collapsed.shellPadding,64,'Collapsed shell content offset');
  if(!collapsed.collapsed||collapsed.navDisplay==='none')throw Error('Collapsed navigation became hidden or lost its controls');
  if(await page.locator('#toggleNavigation').getAttribute('aria-expanded')!=='false')throw Error('ARIA state out of sync after collapsing');
  const navCustomer=page.locator('.nav button[data-view="customers"]');
  await navCustomer.click();
  await page.waitForFunction(()=>document.querySelector('#main')?.dataset.view==='customers',{timeout:20000});
  if(!await navCustomer.evaluate(el=>el.classList.contains('active')))throw Error('Active module not highlighted in collapsed state');
  await page.locator('#toggleNavigation').click();
  await page.waitForTimeout(350);
  expanded=await measure();
  approx(expanded.navWidth,200,'Navigation width after re-expanding');
  approx(expanded.shellPadding,200,'Shell offset after re-expanding');
  if(await page.locator('#toggleNavigation').getAttribute('aria-expanded')!=='true')throw Error('ARIA state out of sync after expansion');
  await page.locator('.nav button[data-view="shareboard"]').click();
  await page.waitForFunction(()=>document.querySelector('#main')?.dataset.view==='shareboard',{timeout:20000});
  await page.waitForTimeout(300);
  const cardGap=await page.evaluate(()=>{
    const grid=document.querySelector('#main .projectOverviewCards')||document.querySelector('#main .projectLauncherList');
    return grid?{className:grid.className,gap:parseFloat(getComputedStyle(grid).gap)}:null;
  });
  if(cardGap)approx(cardGap.gap,96/25.4,'Allocation card grid gap');
  if(jsErrors.length)throw Error('Runtime JS errors: '+JSON.stringify(jsErrors));
  console.log('CRM_DESKTOP_1MM_NAV_QA',JSON.stringify({expanded,collapsed,cardGap,jsErrors}));
  await page.close();
} finally {
  if(browser)await browser.close();
  server.kill('SIGTERM');
}
