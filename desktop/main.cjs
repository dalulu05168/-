const {app,BrowserWindow,Menu,shell,dialog}=require('electron');
const path=require('node:path');
const fs=require('node:fs');
const smoke=process.argv.includes('--smoke-test');
const reportDir=process.env.CRM_SMOKE_REPORT_DIR;
if(smoke){if(!reportDir)throw Error('CRM_SMOKE_REPORT_DIR is required');fs.mkdirSync(reportDir,{recursive:true});app.setPath('userData',path.join(reportDir,'profile'));}
const smokeErrors=[];
const {pathToFileURL}=require('node:url');
let server,window;
const gotLock=app.requestSingleInstanceLock();
if(!gotLock)app.quit();
app.on('second-instance',()=>{if(window){if(window.isMinimized())window.restore();window.focus();}});
app.whenReady().then(async()=>{
 app.setAppUserModelId('com.ellerywestcott.crm');
 const {createCrmServer}=await import(pathToFileURL(path.join(__dirname,'../server.js')).href);
 server=createCrmServer();
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
 const origin=`http://127.0.0.1:${server.address().port}`;
 // Block the original CRM backend even if stale application code is loaded.
 const {session}=require('electron');
 session.defaultSession.webRequest.onBeforeRequest({urls:['*://igcmvzoxminzvcgwimwi.supabase.co/*']},(_details,callback)=>callback({cancel:true}));
 window=new BrowserWindow({width:1480,height:980,minWidth:1060,minHeight:700,title:'Ellery Westcott · Capital Markets CRM',backgroundColor:'#071426',icon:path.join(__dirname,'../assets/app-icon.png'),show:false,webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true,devTools:!app.isPackaged}});
 window.once('ready-to-show',()=>window.show());
 if(smoke)window.webContents.on('console-message',(_event,level,message)=>{if(level===3)smokeErrors.push(message);});
 window.webContents.setWindowOpenHandler(({url})=>{if(url.startsWith('https://'))shell.openExternal(url);return {action:'deny'};});
 window.webContents.on('will-navigate',(e,url)=>{if(new URL(url).origin!==origin){e.preventDefault();if(url.startsWith('https://'))shell.openExternal(url);}});
 window.webContents.session.setPermissionRequestHandler((_wc,_permission,callback)=>callback(false));
 window.webContents.session.on('will-download',(_event,item)=>{item.once('done',(_e,state)=>{if(state!=='completed')dialog.showErrorBox('下载未完成','请检查网络后重试。');});});
 Menu.setApplicationMenu(Menu.buildFromTemplate([{label:'应用',submenu:[{label:'重新加载',role:'reload'},{label:'放大',role:'zoomIn'},{label:'缩小',role:'zoomOut'},{label:'重置缩放',role:'resetZoom'},{type:'separator'},{label:'退出',role:'quit'}]},{label:'编辑',submenu:[{label:'撤销',role:'undo'},{label:'重做',role:'redo'},{type:'separator'},{label:'剪切',role:'cut'},{label:'复制',role:'copy'},{label:'粘贴',role:'paste'},{label:'全选',role:'selectAll'}]}]));
 const preview=process.argv.includes('--demo')?'/?demo=1&account=TEST-ADMIN':'/';
 await window.loadURL(origin+preview);
 if(smoke){
  const result=await window.webContents.executeJavaScript(`(async()=>{
   const deadline=Date.now()+45000;
   while(!document.querySelector('#loginForm,#bootstrapForm')&&Date.now()<deadline)await new Promise(r=>setTimeout(r,250));
   const sdk=await import('/vendor-supabase.js');
   const logo=document.querySelector('.brandLogo');
   return {loginReady:!!document.querySelector('#loginForm,#bootstrapForm'),initialSetup:!!document.querySelector('#bootstrapForm'),sdkReady:typeof sdk.createClient==='function',logoReady:!!logo&&logo.complete&&logo.naturalWidth>0,title:document.title,overflow:document.documentElement.scrollWidth>innerWidth+1};
  })()`);
  result.errors=smokeErrors;result.platform=process.platform;result.version=app.getVersion();
  fs.writeFileSync(path.join(reportDir,'installed-login.png'),(await window.webContents.capturePage()).toPNG());
  result.pass=result.loginReady&&result.sdkReady&&result.logoReady&&!result.overflow&&!smokeErrors.length;
  fs.writeFileSync(path.join(reportDir,'runtime.json'),JSON.stringify(result,null,2));
  app.exit(result.pass?0:1);
 }
}).catch(error=>{if(smoke){fs.writeFileSync(path.join(reportDir,'runtime-error.txt'),error.stack);app.exit(1);}else{dialog.showErrorBox('无法启动 CRM',error.message);app.quit();}});
app.on('window-all-closed',()=>app.quit());
app.on('before-quit',()=>server?.close());
