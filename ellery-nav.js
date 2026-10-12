/* Decorative icons and language metadata. No CRM data mutations. */
(()=>{"use strict";
const paths={dashboard:'<path d="m3 10 9-7 9 7v10H3z"/><path d="M9 20v-7h6v7"/>',customers:'<circle cx="9" cy="7" r="4"/><path d="M1 21v-2c0-4 3-6 8-6s8 2 8 6v2M18 8a4 4 0 0 1 0 8M19 17c2 0 4 2 4 4"/>',personnel:'<circle cx="12" cy="7" r="4"/><path d="M4 21v-3a8 8 0 0 1 16 0v3"/>',trades:'<path d="M4 20V10M10 20V5M16 20v-9M22 20V3"/>',positions:'<path d="M21 12a9 9 0 1 1-9-9v9zM12 3a9 9 0 0 1 9 9h-9z"/>',market:'<path d="M3 3v18h18M6 15l4-5 4 3 6-8"/>',reports:'<path d="M4 2h11l5 5v15H4zM15 2v5h5M8 12h8M8 16h8"/>',shareboard:'<path d="m2 7 10-5 10 5-10 5zM2 12l10 5 10-5M2 17l10 5 10-5"/>',settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15l2 1-2.5 4-2-1-2 1-1 2h-4l-1-2-2-1-2 1-2.5-4 2-1v-3l-2-1L5 7l2 1 2-1 1-2h4l1 2 2 1 2-1 2.5 4-2 1z"/>'};
let painting=false;
function paint(){if(painting)return;painting=true;try{
 document.querySelectorAll(".nav button[data-view]").forEach(b=>{if(b.querySelector(".ew-nav-icon"))return;const p=paths[b.dataset.view];if(!p)return;const i=document.createElement("span");i.className="ew-nav-icon";i.setAttribute("aria-hidden","true");i.innerHTML='<svg viewBox="0 0 24 24">'+p+'</svg>';b.prepend(i);});
 const lang=document.querySelector("#globalLang,#loginLang");if(lang)document.documentElement.lang=({zh:"zh-CN",en:"en",ro:"ro"})[lang.value]||"zh-CN";
 }finally{painting=false}}
let pending=false;const queue=()=>{if(pending)return;pending=true;queueMicrotask(()=>{pending=false;paint()})};
function start(){paint();new MutationObserver(queue).observe(document.getElementById("root")||document.body,{childList:true,subtree:true});document.addEventListener("change",e=>{if(e.target.matches("#globalLang,#loginLang"))document.documentElement.lang=({zh:"zh-CN",en:"en",ro:"ro"})[e.target.value]||"zh-CN"})}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();
