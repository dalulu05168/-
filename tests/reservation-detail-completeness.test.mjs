import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const read=file=>readFile(new URL("../"+file,import.meta.url),"utf8");

test("Allocation page renders two content rows and retains account/capture actions",async()=>{
 const js=await read("allocation-projects.js");
 assert.match(js,/const available=\(state\.allocationProjects\|\|\[\]\)\.filter\(p=>allowed\.has\(p\.owner_user_id\)\)/);
 assert.match(js,/id="projectDetailOwnerSelect"/);
 assert.match(js,/ownerSelect\.onchange=\(\)=>/);
 assert.match(js,/class="projectOverviewCards"/);
 assert.match(js,/class="projectOverviewLower"/);
 assert.match(js,/class="projectPanel projectTrendPanel"/);
 assert.match(js,/class="projectPanel projectOverviewSummary"/);
 assert.doesNotMatch(js,/class="projectPanel projectRecordPanel"/,"The obsolete bottom history panel must not be rendered");
 assert.match(js,/id="projectAddRecord"/);
 assert.match(js,/attachCustomerRanking\(ctx,project\)/);
 assert.match(js,/id="projectPresentationExit"/);
 assert.match(js,/globalActions\.prepend\(projectOwnerControl\)/);
});

test("Desktop is exactly two expanded rows; mobile remains readable without old history panel",async()=>{
 const [css,html]=await Promise.all([read("p005-ui-finish.css"),read("index.html")]);
 assert.match(html,/p005-ui-finish\.css\?v=20261011-ui-finish-v3/);
 assert.match(css,/two-row redesign/);
 assert.match(css,/grid-template-rows:minmax\(300px,\.94fr\) minmax\(340px,1\.2fr\)!important/);
 assert.match(css,/\.projectRecordPanel\s*\{\s*display:none!important/);
 assert.match(css,/@media \(max-width:899px\)/);
 assert.match(css,/\.projectOverviewLower/);
});
