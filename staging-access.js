// Private staging only: browser-compatible form login, with signed HttpOnly cookie.
// All assets and APIs remain protected. This file never connects to production data.
import {createHmac,timingSafeEqual} from "node:crypto";

const COOKIE="p005_preview_session";
const SESSION_SECONDS=60*60*2;
const FAIL_WINDOW=15*60*1000;
const FAIL_LIMIT=8;

function constantEquals(a,b){
  const x=Buffer.from(String(a)),y=Buffer.from(String(b));
  return x.length===y.length&&timingSafeEqual(x,y);
}
function htmlPage(error=false,locked=false){
  const message=locked?"尝试次数过多，请稍后再试。":"用户名或密码不正确，请重试。";
  return \`<!doctype html>
<html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow,noarchive"><meta name="color-scheme" content="light">
<title>预发布访问验证 · Brantone Veylor</title>
<style>
:root{font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#142744;background:#f5f7fa}
*{box-sizing:border-box}body{margin:0;min-height:100svh;display:grid;place-items:center;padding:26px 16px;background:radial-gradient(ellipse 90% 70% at 14% 18%,#eef2f9 0%,transparent 70%),linear-gradient(140deg,#fff,#f5f6f8)}
main{width:min(100%,432px);background:#fff;border:1px solid #e5eaf1;box-shadow:0 18px 70px #152a4718;border-radius:22px;padding:36px clamp(22px,6vw,40px)}
.eyebrow{font-size:11px;font-weight:800;letter-spacing:.24em;color:#a31628;text-transform:uppercase}
.brand{font-size:21px;letter-spacing:.07em;font-weight:800;margin:12px 0 24px;color:#142744}.brand span{color:#a31628}
h1{font-size:25px;margin:0 0 9px;letter-spacing:-.03em}.sub{margin:0 0 27px;color:#58697f;line-height:1.65;font-size:14px}
label{display:block;margin:18px 0 8px;font-size:13px;font-weight:700}
input{display:block;width:100%;height:49px;padding:0 14px;border:1px solid #d5dde9;border-radius:10px;background:#fff;color:#142744;font:inherit;font-size:15px;outline:none}
input:focus{border-color:#17386f;box-shadow:0 0 0 3px #17386f1c}
button{cursor:pointer;width:100%;min-height:50px;margin-top:26px;background:#17386f;color:white;border:0;border-radius:10px;font:inherit;font-size:15px;font-weight:750;letter-spacing:.02em}
button:focus-visible{outline:3px solid #7a9dd2;outline-offset:3px}button:hover{background:#102b54}
.alert{border-radius:9px;background:#fff1f2;color:#8f1424;padding:11px 13px;margin-bottom:17px;font-size:13px;line-height:1.6}
.note{font-size:12px;color:#768499;line-height:1.7;margin-top:24px;border-top:1px solid #edf0f3;padding-top:17px}
</style></head><body>
<main><div class="eyebrow">Private Staging Access</div>
<div class="brand">BRANTONE <span>VEYLOR</span></div>
<h1>访问测试版本</h1><p class="sub">请输入预发布访问账号和密码。验证成功后进入 CRM 页面预览，不会连接真实客户数据。</p>
\${error?'<div class="alert" role="alert">'+message+'</div>':''}
<form action="/_preview/login" method="POST" autocomplete="on">
<label for="username">访问账号</label><input id="username" name="username" autocomplete="username" autocapitalize="none" spellcheck="false" maxlength="100" required>
<label for="password">访问密码</label><input id="password" name="password" type="password" autocomplete="current-password" maxlength="256" required>
<button type="submit">进入预发布系统 →</button></form>
<p class="note">仅供授权测试 · 使用模拟数据 · 访问凭据与 CRM 正式账户不同</p></main>
</body></html>\`;
}

export function createStagingAccess({username,password}){
  if(!username||!password||password.length<24)throw new Error("Private staging access credentials missing");
  const failures=new Map();
  const mac=expiry=>createHmac("sha256",password).update("p005-preview-session|"+expiry).digest("hex");
  const validSession=req=>{
    const raw=String(req.headers.cookie||"").split(";").map(s=>s.trim()).find(s=>s.startsWith(COOKIE+"="));
    if(!raw)return false;
    const value=raw.slice(COOKIE.length+1);
    const parts=value.split(".");
    if(parts.length!==2||!/^\d{10}$/.test(parts[0])||!/^[a-f0-9]{64}$/.test(parts[1]))return false;
    const expiry=Number(parts[0]),now=Math.floor(Date.now()/1000);
    return expiry>now&&expiry<=now+SESSION_SECONDS&&constantEquals(parts[1],mac(parts[0]));
  };
  const page=(res,{error=false,locked=false,status=200}={})=>{
    res.statusCode=status;
    res.setHeader("Content-Type","text/html; charset=utf-8");
    res.setHeader("Content-Security-Policy","default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'");
    res.end(htmlPage(error,locked));
  };
  const unauthorized=res=>{
    res.statusCode=401;
    res.setHeader("Content-Type","text/plain; charset=utf-8");
    res.end("Private preview requires sign-in");
  };
  async function handle(req,res,url){
    res.setHeader("X-Content-Type-Options","nosniff");
    res.setHeader("X-Frame-Options","DENY");
    res.setHeader("Referrer-Policy","no-referrer");
    res.setHeader("X-Robots-Tag","noindex, nofollow, noarchive");
    res.setHeader("Cache-Control","private, no-store");
    res.setHeader("Vary","Cookie");
    if(url.pathname==="/healthz"){
      res.statusCode=200;
      res.setHeader("Content-Type","text/plain; charset=utf-8");
      res.end("OK");
      return true;
    }
    if(url.pathname==="/_preview/login"&&req.method==="POST"){
      const clientIp=String(req.socket.remoteAddress||"local");
      const before=failures.get(clientIp);
      const now=Date.now();
      if(before&&before.until<=now)failures.delete(clientIp);
      const record=failures.get(clientIp);
      if(record&&record.count>=FAIL_LIMIT){page(res,{error:true,locked:true,status:429});return true;}
      let body="";
      for await(const chunk of req){
        body+=chunk.toString("utf8");
        if(body.length>4096){res.statusCode=413;res.end("Form too large");return true;}
      }
      const form=new URLSearchParams(body);
      if(!constantEquals(form.get("username")||"",username)||!constantEquals(form.get("password")||"",password)){
        const previous=failures.get(clientIp);
        failures.set(clientIp,{count:(previous?.count||0)+1,until:now+FAIL_WINDOW});
        page(res,{error:true,status:401});
        return true;
      }
      failures.delete(clientIp);
      const expiry=String(Math.floor(Date.now()/1000)+SESSION_SECONDS);
      res.statusCode=303;
      res.setHeader("Set-Cookie",COOKIE+"="+expiry+"."+mac(expiry)+"; Path=/; Max-Age="+SESSION_SECONDS+"; HttpOnly; Secure; SameSite=Lax");
      res.setHeader("Location","/?demo=1&loginPreview=1");
      res.end();
      return true;
    }
    if(url.pathname==="/_preview/login"&&req.method==="GET"){
      if(validSession(req)){
        res.statusCode=303;res.setHeader("Location","/?demo=1&loginPreview=1");res.end();
      }else page(res);
      return true;
    }
    if(!validSession(req)){
      if((req.method==="GET"||req.method==="HEAD")&&(url.pathname==="/"||url.pathname==="/index.html"||String(req.headers.accept||"").includes("text/html"))){
        page(res);
      }else unauthorized(res);
      return true;
    }
    if(url.pathname==="/"&&!url.search){
      res.statusCode=302;
      res.setHeader("Location","/?demo=1&loginPreview=1");
      res.end();
      return true;
    }
    return false;
  }
  return handle;
}
