import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const read=file=>readFile(new URL("../"+file,import.meta.url),"utf8");

test("Project allocation overview includes detail panels and supervisor owner chooser",async()=>{
  const js=await read("allocation-projects.js");
  assert.match(js,/const available=\(state\.allocationProjects\|\|\[\]\)\.filter\(p=>allowed\.has\(p\.owner_user_id\)\)/);
  assert.match(js,/if\(available\.length&&!available\.some\(p=>p\.owner_user_id===requestedOwner\)\)state\.allocationOwnerId=available\[0\]\.owner_user_id/);
  assert.match(js,/id="projectDetailOwnerSelect"/);
  assert.match(js,/ownerSelect\.onchange=\(\)=>/);
  assert.match(js,/class="projectOverviewLower"/);
  assert.match(js,/class="projectTrendPanel"/);
  assert.match(js,/class="projectPanel projectRecordPanel"/);
  assert.match(js,/class="projectEmptyDetail"/);
  assert.match(js,/id="projectAddRecord"/);
  assert.match(js,/attachCustomerRanking\(ctx,project\)/);
  assert.match(js,/id="projectPresentationExit"/);
});

test("Phone renders reservation details and does not silently hide the history table",async()=>{
 const [css,html]=await Promise.all([read("responsive-mobile-system.css"),read("index.html")]);
 assert.match(html,/responsive-mobile-system\.css\?v=20261011-project-details-v2/);
 const marker="/* P005: Keep allocation details visible";
 const patch=css.slice(css.lastIndexOf(marker));
 assert.ok(patch.length>1000,"Detail repair must be after legacy mobile panorama display rules");
 assert.match(patch,/\.projectRecordPanel\s*\{[\s\S]*?display:block!important/);
 assert.match(patch,/\.projectRecordPanel \.tableWrap\s*\{[\s\S]*?overflow-x:auto!important/);
 assert.match(patch,/\.projectDetailOwner select/);
 assert.match(patch,/max-width:899px/);
});
