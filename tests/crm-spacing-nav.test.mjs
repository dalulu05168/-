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

test("navigation remains in DOM, expands and compacts without being hidden", () => {
  assert.match(app, /id="sideNavigation"/);
  assert.match(app, /class="navGlyph"/);
  assert.match(app, /class="navLabel"/);
  assert.match(app, /aria-controls="sideNavigation"/);
  assert.match(app, /classList\.toggle\("navigationCompact"\)/);
  assert.doesNotMatch(app, /classList\.toggle\("navigationHidden"\)/);
  assert.match(css, /--crm-sidebar-expanded:\s*200px/);
  assert.match(css, /--crm-sidebar-collapsed:\s*64px/);
  assert.match(css, /navigationCompact[\s\S]*\.navFrame/);
});
