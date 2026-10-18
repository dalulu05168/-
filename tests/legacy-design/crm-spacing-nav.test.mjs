import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (name) => readFileSync(new URL("../" + name, import.meta.url), "utf8");
const html = read("index.html");
const css = read("crm-1mm-module-spacing.css");
const app = read("app.js");

test("latest stylesheet loads after legacy delivery overrides", () => {
  assert.match(html, /delivery-layout\.css[\s\S]*crm-1mm-module-spacing\.css/);
});

test("adjacent module boxes, not inner text padding, use one millimeter spacing", () => {
  assert.match(css, /--crm-module-gap:\s*1mm\s*;/);
  for (const layout of [".kpis", ".grid2", ".grid3", ".level1MetricGrid", ".level2MetricGrid",
    ".settingsGrid", ".reportsLower", ".marketUnifiedGrid", ".projectLauncherList",
    ".projectOverviewCards", ".projectOverviewLower", ".shareKpiRow"]) {
    assert.ok(css.includes(layout), `Missing layout: ${layout}`);
  }
  assert.match(css, /gap:var\(--crm-module-gap\)!important/);
});

test("navigation is permanently icon-only and cannot expand", () => {
  assert.match(app, /classList\.add\("navigationCompact"\)/);
  assert.match(app, /class="navGlyph"/);
  assert.match(app, /class="navLabel"/);
  assert.doesNotMatch(app, /id="toggleNavigation"/);
  assert.doesNotMatch(app, /classList\.toggle\("navigationCompact"\)/);
  assert.match(css, /--crm-sidebar-collapsed:\s*72px/);
  assert.match(css, /\.nav \.navLabel[\s\S]*display:none!important/);
  assert.match(css, /padding-left:var\(--crm-sidebar-collapsed\)!important/);
});

test("module content starts immediately below toolbar with no empty back-arrow header", () => {
  const projects=read("allocation-projects.js");
  assert.doesNotMatch(projects, /projectPresentationExit|class="projectExit"/);
  assert.doesNotMatch(projects, /<header class="projectPresentationHeader"/);
  assert.match(css, /#main\s*\{[\s\S]*?padding:4px 24px 12px!important/);
  assert.match(css, /\.projectOverviewCards[\s\S]*?margin-top:0!important/);
});
