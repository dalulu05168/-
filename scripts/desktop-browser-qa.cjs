// Read-only UI checks against explicitly simulated data; never authenticates to production.
const {chromium}=require('playwright');
(async()=>{
 const {createCrmServer}=await import('../server.js');const server=createCrmServer();
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
 let browser;
 try{
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
 const report=[];
 for(const [account,role] of [['TEST-ADMIN','admin'],['TEST-A002','level2']]){
  for(const width of [1440,390]){
   const page=await browser.newPage({viewport:{width,height:1000}});let errors=[];page.on('pageerror',error=>errors.push(error.message));
   await page.goto(origin+'/?demo=1&account='+account);await page.waitForSelector('#main');
   const navs=await page.locator('.nav button').evaluateAll(xs=>xs.map(x=>x.dataset.view));
   if(role==='level2'&&navs.includes('personnel'))throw Error('Personnel access exposed to level2');
   for(const view of navs){
    await page.locator('.nav [data-view="'+view+'"]').click();await page.waitForTimeout(450);
    await page.waitForFunction(v=>document.querySelector('#main')?.dataset.view===v,view);
    const state=await page.evaluate(()=>({text:document.querySelector('#main').innerText,overflow:document.documentElement.scrollWidth>innerWidth+1}));
    if(!state.text.trim()||state.text.includes('页面加载失败')||state.overflow)throw Error(`${role}/${view}/${width}: empty, failed, or overflowing layout`);
    if(view==='personnel'){
     await page.locator('#newStaff').click();if(await page.locator('#staffForm [value="level1"]').count())throw Error('Legacy role creation is available');
     if(await page.locator('#staffForm [name="role"]').inputValue()!=='level2')throw Error('Wrong account role');await page.locator('.modalCloseBtn').click();
    }
    report.push({role,view,width,pass:true});
   }
   if(errors.length)throw Error(errors.join('\n'));await page.close();
  }
 }
 console.log(JSON.stringify(report,null,2));
 }finally{await browser?.close();await new Promise(resolve=>server.close(resolve))}
})().catch(error=>{console.error(error);process.exitCode=1});
