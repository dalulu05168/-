import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

test("Canva layout pass preserves every original font, data, logo and chart colour", async()=>{
  const css=await readFile(new URL("../p005-canva-boundary-audit.css",import.meta.url),"utf8");
  const html=await readFile(new URL("../index.html",import.meta.url),"utf8");
  assert.match(html,/p005-canva-boundary-audit\.css\?v=20261011-colors-preserved-v1/);
  assert.match(css,/border-style:\s*dashed\s*!important;/);
  assert.match(css,/border-style:\s*solid\s*!important;/);
  assert.match(css,/\.projectOverviewCard/);
  assert.match(css,/\.referenceFeatureCard/);
  assert.match(css,/\.terminalChartCard/);
  assert.match(css,/\.panel/);
  assert.doesNotMatch(css,/(?:^|[;{}\n])\s*(?:color|background(?:-color|-image)?|font(?:-[a-z]+)?|fill|stroke|filter|text-shadow)\s*:/mi);
  assert.doesNotMatch(css,/#[0-9a-f]{3,8}\b/i);
});
