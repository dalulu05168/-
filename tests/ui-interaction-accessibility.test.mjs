import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const read=path=>readFile(new URL("../"+path,import.meta.url),"utf8");

test("Login and bootstrap report errors inline and expose accessible states",async()=>{
  const app=await read("app.js");
  const login=app.slice(app.indexOf("function renderLogin(initialized)"),app.indexOf("async function loadProfileAndStart()"));
  assert.ok(login.includes('aria-describedby="loginUsernameHelp loginError"'));
  assert.ok(login.includes('id="loginUsernameHelp"'));
  assert.ok(login.includes('aria-describedby="loginError"'));
  assert.ok(login.includes('class="loginError" role="alert" tabindex="-1" hidden'));
  assert.ok(login.includes('input[aria-invalid="true"]'));
  assert.ok(login.includes('btn.setAttribute("aria-busy","true")'));
  assert.ok(login.includes('btn.removeAttribute("aria-busy")'));
  assert.ok(login.includes('errorBox.focus({preventScroll:true})'));
  assert.ok(login.includes('btn.form.querySelector("#loginError")'),
    "Async bootstrap must not use Event.currentTarget after awaiting");
  assert.ok(login.includes('btn.form.querySelectorAll('),
    "Async login must keep a stable reference to the form");
  assert.ok(login.includes("supabase.auth.signInWithPassword"),
    "No change to production authentication");
});

test("Navigation exposes and maintains the active view",async()=>{
  const app=await read("app.js");
  assert.ok(app.includes('aria-current="${id===state.activeView?"page":"false"}"'));
  assert.ok(app.includes('b.setAttribute("aria-current",active?"page":"false")'));
  for(const page of ["dashboard","customers","personnel","trades","positions","market","reports","shareboard","settings"])
    assert.ok(app.includes('["'+page+'"'),"Keep route "+page);
});

test("Keyboard focus, finance numerals and reduced-motion preferences are styled",async()=>{
  const css=await read("login-redesign.css");
  assert.ok(css.includes("/* Nuvexa UI QA: focus, error feedback, navigation and financial readability */"));
  for(const selector of [":focus-visible",'[aria-invalid="true"]','[aria-current="page"]',"[aria-busy=\"true\"]","font-variant-numeric:tabular-nums","prefers-reduced-motion:reduce"])
    assert.ok(css.includes(selector),"Missing CSS accessibility control "+selector);
  let depth=0,inComment=false,quote=null;
  for(let i=0;i<css.length;i++){
    const a=css[i],b=css[i+1];
    if(inComment){if(a==="*"&&b==="/"){inComment=false;i++}continue}
    if(quote){if(a==="\\"){i++;continue}if(a===quote)quote=null;continue}
    if(a==="/"&&b==="*"){inComment=true;i++;continue}
    if(a==="\""||a==="'"){quote=a;continue}
    if(a==="{")depth++;
    if(a==="}"){depth--;assert.ok(depth>=0)}
  }
  assert.equal(depth,0);assert.equal(inComment,false);assert.equal(quote,null);
});
