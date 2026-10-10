import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const read=path=>readFile(new URL("../"+path,import.meta.url),"utf8");

test("The login form is the first action, with secondary utilities below submit",async()=>{
 const [js,css,html]=await Promise.all(["app.js","login-redesign.css","index.html"].map(read));
 const pos=js.indexOf("function renderLogin(initialized)");
 const end=js.indexOf("async function bootstrap(",pos);
 assert.ok(pos>=0&&end>pos,"Actual login view is present");
 const login=js.slice(pos,end);
 const iUser=login.indexOf('name="username"'),iPassword=login.indexOf('name="password"');
 const iSubmit=login.indexOf('class="btn primary loginSubmit"');
 const iUtilities=login.indexOf('class="loginUtilities"'),iLanguage=login.indexOf('id="loginLang"');
 const iClock=login.indexOf('id="romaniaClock"');
 assert.ok([iUser,iPassword,iSubmit,iUtilities,iLanguage,iClock].every(v=>v>=0),"All login and utility controls remain");
 assert.ok(iUser<iPassword&&iPassword<iSubmit&&iSubmit<iUtilities&&iUtilities<iLanguage&&iLanguage<iClock,"Login hierarchy should prioritize user/password/submit");
 assert.ok(login.includes('form.addEventListener("submit",initialized?login:bootstrap)'));
 assert.ok(login.includes('passwordField.type=visible?"text":"password"'));
 assert.ok(js.includes('email:username+"@crm.nuvexapro.com"'));
 assert.ok(js.includes("supabase.auth.signInWithPassword"));
 assert.match(html,/login-redesign\.css\?v=20261010-fintech-auth-v3/);
 assert.match(html,/app\.js\?v=20261010-fintech-auth-v3/);
 assert.match(css,/\.loginUtilities/);
 assert.match(css,/@media \(max-width:899px\)/);
 assert.match(css,/font-size:16px!important/);
});
test("The redesigned login theme remains legible and never replaces the original logo",async()=>{
 const [css,js]=await Promise.all(["login-redesign.css","app.js"].map(read));
 for(const token of ["--login-cream:#FAF9F5","--login-paper:#FFFEFA","--login-ink:#25352F","--login-accent:#12887A"]){
   assert.ok(css.includes(token),"Missing theme token: "+token);
 }
 assert.match(js,/assets\/brand-logo-transparent-color\.svg/);
 assert.ok(!css.includes("filter:blur"),"No blurry original logo");
 assert.match(css,/\.loginHero h1[\s\S]*font-size:clamp\(36px,3\.4vw,51px\)!important/);
});
