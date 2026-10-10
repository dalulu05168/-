import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const read=p=>readFile(new URL("../"+p,import.meta.url),"utf8");

test("All Chart.js axes use black normal-weight numeric labels",async()=>{
 const app=await read("app.js");
 const block=app.slice(app.indexOf("function chartOpts()"),app.indexOf("function customerTable(",app.indexOf("function chartOpts()")));
 assert.match(block,/scales:\{x:\{ticks:\{color:"#111111",font:\{family:"Arial, Microsoft YaHei, sans-serif",weight:"normal",size:11\}/);
 assert.match(block,/y:\{ticks:\{color:"#111111",font:\{family:"Arial, Microsoft YaHei, sans-serif",weight:"normal",size:11\}/);
 assert.match(block,/legend:\{position:"top",align:"end",labels:\{color:"#111111",font:\{size:11,weight:"normal"\}/);
 assert.match(app,/marketRange==="1D"/);
 assert.match(app,/year:marketRange==="1W"\|\|marketRange==="1M"\?undefined:"numeric"/);
});

test("Stock market layout grows naturally and keeps quote details and bottom chart",async()=>{
 const [html,css]=await Promise.all([read("index.html"),read("ui-finance-density-20261011.css")]);
 assert.match(html,/ui-finance-density-20261011\.css\?v=20261011-market-complete-v1/);
 assert.ok(html.lastIndexOf("ui-finance-density-20261011.css")>html.lastIndexOf("responsive-mobile-system.css"));
 assert.match(css,/data-view="market"\] \{\s*overflow-y:auto!important/);
 assert.match(css,/grid-template-rows:minmax\(52px,auto\) minmax\(139px,auto\) minmax\(330px,auto\) minmax\(330px,auto\)/);
 assert.match(css,/\.marketOverviewPanel[\s\S]*min-height:330px!important/);
 assert.match(css,/\.marketChartPanel[\s\S]*min-height:330px!important/);
 assert.match(css,/\.marketMetrics \{[\s\S]*grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
 assert.match(css,/@media \(max-width:899px\)/);
 assert.match(css,/marketListPanel[\s\S]*height:auto!important/);
 assert.doesNotMatch(css,/display:none!important/);
});
