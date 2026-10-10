import http from "node:http";
import { timingSafeEqual } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import marketHandler from "./api/market.js";
import securityInfoHandler from "./api/security-info.js";
import securitySearchHandler from "./api/security-search.js";

const __filename=fileURLToPath(import.meta.url);
const __dirname=path.dirname(__filename);
const port=Number(process.env.PORT||3000);
// This dedicated staging branch must never expose the production CRM publicly.
// Local test servers (without STAGING_PREVIEW) retain the original contract.
const isRender=process.env.RENDER==="true"||!!process.env.RENDER_SERVICE_ID;
const isPrivateStaging=process.env.STAGING_PREVIEW==="1";
const previewUser=process.env.STAGING_PREVIEW_USERNAME||"";
const previewPass=process.env.STAGING_PREVIEW_PASSWORD||"";
if(isRender&&!isPrivateStaging)throw new Error("P005 staging is locked: STAGING_PREVIEW must be 1");
if(isPrivateStaging&&(!previewUser||previewPass.length<24))
  throw new Error("P005 staging is locked: private access credentials are missing or too short");
function sameSecret(actual,expected){
  const a=Buffer.from(actual),b=Buffer.from(expected);
  return a.length===b.length&&timingSafeEqual(a,b);
}
function canViewStaging(req){
  const auth=String(req.headers.authorization||"");
  if(!auth.startsWith("Basic "))return false;
  try{
    const raw=Buffer.from(auth.slice(6),"base64").toString("utf8");
    const colon=raw.indexOf(":");
    if(colon<1)return false;
    return sameSecret(raw.slice(0,colon),previewUser)&&sameSecret(raw.slice(colon+1),previewPass);
  }catch{return false}
}

const apiRoutes=new Map([
  ["/api/market",marketHandler],
  ["/api/security-info",securityInfoHandler],
  ["/api/security-search",securitySearchHandler]
]);

const mime={
  ".html":"text/html; charset=utf-8",
  ".js":"text/javascript; charset=utf-8",
  ".css":"text/css; charset=utf-8",
  ".json":"application/json; charset=utf-8",
  ".png":"image/png",
  ".webp":"image/webp",
  ".jpg":"image/jpeg",
  ".jpeg":"image/jpeg",
  ".svg":"image/svg+xml"
};

function makeApiResponse(res){
  let statusCode=200;
  return {
    setHeader(name,value){res.setHeader(name,value);return this;},
    status(code){statusCode=code;return this;},
    json(payload){
      if(!res.headersSent)res.setHeader("Content-Type","application/json; charset=utf-8");
      res.statusCode=statusCode;
      res.end(JSON.stringify(payload));
    },
    send(payload){
      res.statusCode=statusCode;
      if(typeof payload==="object"&&payload!==null){
        if(!res.headersSent)res.setHeader("Content-Type","application/json; charset=utf-8");
        res.end(JSON.stringify(payload));
      }else{
        res.end(String(payload??""));
      }
    }
  };
}

async function serveStatic(req,res,url){
  const pathname=decodeURIComponent(url.pathname);
  const allowed=new Set(["/","/index.html","/app.js","/ui-features.js","/allocation-projects.js","/viewport-layout.js","/styles.css","/reference-theme.css","/unified-ui.css","/dashboard-data.js","/customer-reservations.js","/demo-client.js","/demo-data.json"]);
  let target=pathname==="/"?"/index.html":pathname;
  // Serve all safe root-level CSS files, including the Canva/cream themes.
  // The previous strict whitelist silently returned index.html for new CSS files.
  // Browsers then ignored those responses (text/html), leaving the dark theme.
  const cssAsset=/^\/[a-zA-Z0-9][a-zA-Z0-9_-]*\.css$/.test(target);
  const imageAsset=/^\/assets\/[a-z0-9-]+\.(svg|png|webp)$/.test(target);
  if(!allowed.has(target)&&!cssAsset&&!imageAsset){
    // Never disguise a missing/blocked asset as successful HTML.
    if(/\.(css|js|json|svg|png|webp|jpe?g)$/i.test(target)){
      res.statusCode=404;
      res.setHeader("Content-Type","text/plain; charset=utf-8");
      res.end("Not found");
      return;
    }
    // Keep deep links (/nishizhege, project/client routes) working.
    target="/index.html";
  }
  const filePath=path.join(__dirname,target.replace(/^\//,""));
  try{
    const s=await stat(filePath);
    if(!s.isFile())throw new Error("not file");
    const data=await readFile(filePath);
    const ext=path.extname(filePath).toLowerCase();
    res.statusCode=200;
    res.setHeader("Content-Type",mime[ext]||"application/octet-stream");
    res.setHeader("Cache-Control",ext===".html"?"no-cache":"public, max-age=300");
    res.end(data);
  }catch{
    res.statusCode=404;
    res.setHeader("Content-Type","text/plain; charset=utf-8");
    res.end("Not found");
  }
}

const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url||"/",`http://${req.headers.host||"localhost"}`);
  if(isPrivateStaging){
    res.setHeader("X-Content-Type-Options","nosniff");
    res.setHeader("X-Frame-Options","DENY");
    res.setHeader("Referrer-Policy","no-referrer");
    res.setHeader("X-Robots-Tag","noindex, nofollow, noarchive");
    res.setHeader("Vary","Authorization");
    res.setHeader("Cache-Control","no-store");
    if(url.pathname==="/healthz"){
      res.statusCode=200;res.setHeader("Content-Type","text/plain; charset=utf-8");res.end("OK");return;
    }
    if(!canViewStaging(req)){
      res.statusCode=401;
      res.setHeader("WWW-Authenticate",'Basic realm="P005 private staging", charset="UTF-8"');
      res.setHeader("Content-Type","text/plain; charset=utf-8");
      res.end("Private staging: authentication required");return;
    }
    if(url.pathname==="/"&&!url.search){
      res.statusCode=302;res.setHeader("Location","/?demo=1&loginPreview=1");
      res.end();return;
    }
  }
  const handler=apiRoutes.get(url.pathname);
  if(handler){
    try{
      const query=Object.fromEntries(url.searchParams.entries());
      await handler({query,headers:req.headers,method:req.method,url:req.url},makeApiResponse(res));
    }catch(error){
      if(!res.headersSent)res.setHeader("Content-Type","application/json; charset=utf-8");
      res.statusCode=500;
      res.end(JSON.stringify({error:error instanceof Error?error.message:"Server error"}));
    }
    return;
  }
  await serveStatic(req,res,url);
});

server.listen(port,"0.0.0.0",()=>{
  console.log(`Brantone Veylor CRM listening on ${port}`);
});

