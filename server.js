import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import marketHandler from "./api/market.js";
import securityInfoHandler from "./api/security-info.js";
import securitySearchHandler from "./api/security-search.js";

const __filename=fileURLToPath(import.meta.url);
const __dirname=path.dirname(__filename);
const port=Number(process.env.PORT||3000);

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
  if(!allowed.has(target)&&!/^\/assets\/[a-z0-9-]+\.(svg|png|webp)$/.test(target)){
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

