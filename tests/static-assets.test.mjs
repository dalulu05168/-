import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { fileURLToPath } from "node:url";
import path from "node:path";

const projectRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");

async function availablePort(){
  const listener=createServer();
  await new Promise((resolve,reject)=>listener.once("error",reject).listen(0,"127.0.0.1",resolve));
  const port=listener.address().port;
  await new Promise(resolve=>listener.close(resolve));
  return port;
}

test("new Canva/milk-white CSS files are actually served as CSS, never HTML", {timeout:20000}, async t=>{
  const port=await availablePort();
  const origin="http://127.0.0.1:"+port;
  const server=spawn(process.execPath,["server.js"],{
    cwd:projectRoot,
    env:{...process.env,PORT:String(port)},
    stdio:["ignore","pipe","pipe"]
  });
  t.after(()=>{if(server.exitCode===null)server.kill("SIGTERM")});
  let ready=false;
  let output="";
  server.stderr.on("data",chunk=>{output+=chunk.toString()});
  for(let i=0;i<75;i++){
    if(server.exitCode!==null)throw new Error("Server died before listening: "+output);
    try{
      const response=await fetch(origin+"/",{signal:AbortSignal.timeout(1000)});
      if(response.ok){ready=true;break}
    }catch{}
    await new Promise(resolve=>setTimeout(resolve,100));
  }
  assert.ok(ready,"Local application server must start");
  const themes=[
    "/styles.css",
    "/reference-theme.css?v=20261009-brighter",
    "/unified-ui.css?v=20261009-brighter",
    "/canva-market-light.css?v=20261010-canva-final-v1",
    "/canva-reference-layout.css?v=20261010-reference-v2",
    "/milk-white-theme.css?v=20261010-cream-v1"
  ];
  for(const asset of themes){
    const response=await fetch(origin+asset);
    const body=await response.text();
    assert.equal(response.status,200,asset+" HTTP status");
    assert.match(response.headers.get("content-type")||"",/^text\/css\b/,asset+" MIME type");
    assert.ok(body.length>500,asset+" must contain actual CSS");
    assert.doesNotMatch(body,/<!doctype html>/i,asset+" must not return SPA HTML");
  }
  const milk=await (await fetch(origin+"/milk-white-theme.css")).text();
  assert.match(milk,/--cream-base:\s*#fbfaf6/,"Milk-white palette must be present");
  const missing=await fetch(origin+"/not-a-real-theme.css");
  assert.equal(missing.status,404,"Missing CSS must not be masked by HTML fallback");
  const deepLink=await fetch(origin+"/nishizhege");
  assert.equal(deepLink.status,200,"Existing customer-facing route must continue working");
  assert.match(deepLink.headers.get("content-type")||"",/^text\/html\b/);
  assert.match(await deepLink.text(),/milk-white-theme\.css/);
});
