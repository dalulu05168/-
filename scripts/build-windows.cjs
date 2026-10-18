const path=require('node:path');
const {execFileSync}=require('node:child_process');
const {NSIS_PATH,NsisTargetOptions}=require('app-builder-lib/out/targets/nsis/nsisUtil.js');
(async()=>{
 const root=path.resolve(__dirname,'..');
 execFileSync(process.execPath,[require.resolve('electron-builder/cli.js'),'--win','--x64','--dir'],{cwd:root,stdio:'inherit'});
 NsisTargetOptions.resolve({});
 const nsis=await NSIS_PATH();
 const compiler=path.join(nsis,process.platform==='win32'?'Bin/makensis.exe':process.platform==='darwin'?'mac/makensis':'linux/makensis');
 const prefix=process.platform==='win32'?'/':'-';
 execFileSync(compiler,[`${prefix}DAPP_DIRECTORY=${path.join(root,'dist/win-unpacked')}`,`${prefix}DOUTPUT_FILE=${path.join(root,'dist/Ellery-Westcott-CRM-Setup-2.0.0.exe')}`,`${prefix}DICON_FILE=${path.join(root,'assets/app-icon.ico')}`,path.join(root,'desktop/installer.nsi')],{cwd:root,stdio:'inherit',env:{...process.env,NSISDIR:nsis}});
})().catch(e=>{console.error(e);process.exit(1)});
