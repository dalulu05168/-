import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const read=name=>readFile(new URL("../"+name,import.meta.url),"utf8");
function lum(hex){
 const a=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);
 return .2126*a[0]+.7152*a[1]+.0722*a[2];
}
function contrast(a,b){const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}

test("Login design is separate from shared CRM and honors Canva cream contrast",async()=>{
 const [css,html,app]=await Promise.all(["login-redesign.css","index.html","app.js"].map(read));
 const links=[...html.matchAll(/href="(\/[^"]+\.css[^"]*)"/g)].map(m=>m[1]);
 assert.equal(links.at(-1),"/login-redesign.css?v=20261010-form-first-v2");
 for(const token of ["--login-cream:#FAF9F5","--login-paper:#FFFEFA","--login-ink:#25352F","--login-accent:#12887A"]){
  assert.ok(css.includes(token),"Missing color "+token);
 }
 assert.ok(contrast("#25352F","#FFFEFA")>7);
 assert.ok(contrast("#647770","#FFFEFA")>=4.5);
 assert.ok(css.includes("@media (max-width:899px)"),"Independent phone login layout");
 assert.ok(css.includes("@media(max-width:360px)"),"Small phone layout");
 assert.match(css,/html body #root#root \.loginPage/);
 assert.ok(css.includes("font-size:16px!important"),"iOS input must not zoom");
 assert.match(app,/class="loginPasswordToggle"/);
 assert.match(app,/id="loginError"/);
 assert.ok(app.includes('demoMode&&new URLSearchParams(location.search).get("loginPreview")==="1"'),"Preview must be confined to simulated demo client");
 assert.ok(app.includes('email:username+"@crm.nuvexapro.com"'),"Original login email mapping unchanged");
 assert.ok(app.includes("supabase.auth.signInWithPassword"),"Use original Supabase authentication");
 assert.ok(app.includes("brand-logo-transparent-color.svg"),"Preserve original vector logo");
 assert.ok(!css.includes("filter:blur"),"Do not blur logo");
});
test("Styling has balanced CSS braces and no fictional market numbers",async()=>{
 const css=await read("login-redesign.css");
 let count=0,comment=false,quote=null;
 for(let i=0;i<css.length;i++){const a=css[i],b=css[i+1];
  if(comment){if(a==="*"&&b==="/"){comment=false;i++}continue}
  if(quote){if(a==="\\"){i++;continue}if(a===quote)quote=null;continue}
  if(a==="/"&&b==="*"){comment=true;i++;continue}
  if(a==='"'||a==="'"){quote=a;continue}
  if(a==="{")count++;
  if(a==="}"){count--;assert.ok(count>=0)}
 }
 assert.equal(count,0);assert.equal(comment,false);assert.equal(quote,null);
 assert.doesNotMatch(css,/fake_stock|fake_price|fake_data/i);
});
