const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('elleryPreferences',Object.freeze({getNavigationHidden:()=>ipcRenderer.invoke('ui:get-navigation-hidden'),setNavigationHidden:value=>{if(typeof value!=='boolean')return Promise.reject(new TypeError('Boolean required'));return ipcRenderer.invoke('ui:set-navigation-hidden',value);}}));
