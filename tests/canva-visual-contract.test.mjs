import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const read=(name)=>readFile(new URL("../"+name,import.meta.url),"utf8");

test("Canva visual contract: final stylesheet, readable cream tokens and original logo",async()=>{
 const [html,css,app,legacyLogo]=await Promise.all([
   read("index.html"),read("canva-unified-ui-audit.css"),read("app.js"),read("brand-logo-light-fix.css")
 ]);
 const cssLinks=[...html.matchAll(/href="(\/[^"]+\.css[^"]*)"/g)].map(match=>match[1]);
 assert.match(cssLinks.at(-7),/^\/canva-unified-ui-audit\.css\?v=/,"Canva audit must load after base themes");
 assert.match(cssLinks.at(-6),/^\/brand-logo-light-fix\.css\?v=/,"Original logo contrast loads before mobile adjustments");
 assert.match(cssLinks.at(-5),/^\/canva-mobile-qa-fix\.css\?v=/,"Mobile QA stylesheet must load before final contrast");
 assert.match(cssLinks.at(-4),/^\/contrast-guard\.css\?v=/,"Contrast guard loads before targeted review");
 assert.match(cssLinks.at(-3),/^\/canva-fullsite-qa\.css\?v=/,"Fullsite Canva QA before mobile layout");
 assert.match(cssLinks.at(-2),/^\/responsive-mobile-system\.css\?v=/,"Mobile-specific responsive system is last");
 assert.match(cssLinks.at(-1),/^\/login-redesign\.css\?v=/,"Login theme is last");
 for(const token of ["--bv-page:#FAF9F5","--bv-paper:#FFFEFA","--bv-line:#E6EAE5",
                     "--bv-ink:#24312E","--bv-teal:#128D7F","--bv-font:Inter"]){
   assert.ok(css.includes(token),"Missing standard design token "+token);
 }
 for(const size of ["font-size:22px!important","font-size:15px!important","font-size:13px!important",
                    "font-size:12px!important"]){
   assert.ok(css.includes(size),"Missing standardized type scale "+size);
 }
 assert.ok(css.includes("border:1px solid var(--bv-line)"),"Uniform hairline border");
 assert.ok(css.includes("@media(max-width:899px)"),"Mobile layout must be accessible");
 assert.match(app,/brand-logo-transparent-color\.svg/,"Existing BV logo must remain");
 assert.match(legacyLogo,/mix-blend-mode:normal/,"Logo remains unfiltered and visible");
 assert.doesNotMatch(css,/https?:\/\/|price:\s*[0-9]/,"Presentation styles should not fabricate data or embed external resources");
});

test("Canva visual CSS braces and comments remain balanced",async()=>{
 const css=await read("canva-unified-ui-audit.css");
 let depth=0,comment=false,quote=null;
 for(let i=0;i<css.length;i++){
   const c=css[i],n=css[i+1];
   if(comment){if(c==="*"&&n==="/"){comment=false;i++;}continue}
   if(quote){if(c==="\\"){i++;continue}if(c===quote)quote=null;continue}
   if(c==="/"&&n==="*"){comment=true;i++;continue}
   if(c==='"'||c==="'"){quote=c;continue}
   if(c==="{")depth++;
   if(c==="}"){depth--;assert.ok(depth>=0,"CSS has stray closing brace")}
 }
 assert.equal(depth,0,"CSS rule braces must be balanced");
 assert.equal(comment,false,"CSS comment must be closed");
 assert.equal(quote,null,"CSS string must be closed");
});
