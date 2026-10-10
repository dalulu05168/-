import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read=file=>readFile(new URL("../"+file,import.meta.url),"utf8");

test("Reservation pages never request or exit browser fullscreen",async()=>{
  const [projects,app]=await Promise.all([read("allocation-projects.js"),read("app.js")]);
  for(const [file,code] of [["allocation-projects.js",projects],["app.js",app]]){
    assert.doesNotMatch(code,/\b(?:requestFullscreen|exitFullscreen|fullscreenElement)\b/,file+" must not use browser fullscreen API");
  }
  assert.match(projects,/export async function openProject\(ctx,n\)\{ctx\.state\.activeProjectNumber=[^\n]+await ctx\.switchView\('shareboard'\)/);
  assert.match(app,/\$\$\("\.nav button"\)\.forEach\(b=>b\.onclick=\(\)=>\{switchView\(b\.dataset\.view\)\}\)/);
  assert.match(projects,/id="projectPresentationExit"/);
  assert.match(projects,/#projectPresentationExit'\)\.onclick=\(\)=>ctx\.switchView\('dashboard'\)/);
});

test("Reservation functions and translations remain available",async()=>{
  const projects=await read("allocation-projects.js");
  assert.match(projects,/open:'查看项目'/);
  assert.match(projects,/open:'View Project'/);
  assert.match(projects,/open:'Vezi proiectul'/);
  assert.doesNotMatch(projects,/全屏查看|Full-screen View|Vizualizare pe tot ecranul/);
  assert.match(projects,/allocationReservationForm/);
  assert.match(projects,/customerReservationForm|editCustomerReservation/);
  assert.match(projects,/projectNameForm/);
  assert.match(projects,/\[data-project-select\]/);
});
