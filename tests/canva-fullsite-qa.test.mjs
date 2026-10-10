import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const load=name=>readFile(new URL("../"+name,import.meta.url),"utf8");
const luminance=hex=>{
 const values=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
 const c=values.map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);
 return c[0]*.2126+c[1]*.7152+c[2]*.0722;
};
const contrast=(a,b)=>{
 const x=luminance(a),y=luminance(b);
 return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
};
test("Final Canva stylesheet loads after every previous theme and original SVG remains",async()=>{
 const [html,qa,app,project]=await Promise.all(["index.html","canva-fullsite-qa.css","app.js","allocation-projects.js"].map(load));
 const links=[...html.matchAll(/<link[^>]+href="(\/[^"]+\.css[^"]*)"/g)].map(x=>x[1]);
 assert.match(links.at(-3),/^\/canva-fullsite-qa\.css\?v=20261010-fullsite-qa-v1/);
 assert.match(links.at(-2),/^\/responsive-mobile-system\.css\?v=20261010-mobile-native-v1/);
 assert.match(links.at(-1),/^\/login-redesign\.css\?v=20261010-form-first-v2/);
 assert.match(app,/brand-logo-transparent-color\.svg/);
 assert.match(project,/brand-logo-transparent-color\.svg/);
 assert.match(qa,/image-rendering:auto!important/);
 assert.doesNotMatch(qa,/filter:blur|filter:grayscale|filter:invert/);
});
test("Customer holdings and all essential business modules use readable cream/dark pairs",async()=>{
 const [qa,app]=await Promise.all(["canva-fullsite-qa.css","app.js"].map(load));
 assert.ok(contrast("#24312E","#FFFEFA")>=7);
 assert.ok(contrast("#5C6D66","#FFFEFA")>=4.5);
 for(const key of [".sharePositions",".shareKpiRow",".shareServicePanel",".shareProfileGrid",
  ".shareNote",".shareServiceTimeline",".portfolioCurrencyGroup",".holdingBreakdownRow",
  ".profitBreakdownRow",".dataTable tbody td",".terminalPositionCard",
  ".level2PositionsPanel",".modulePanel",".modalCard",".loginCard",".settingsCard"]){
  assert.ok(qa.includes(key),"Need explicit contrast handling for "+key);
 }
 for(const view of ["dashboard","customers","personnel","trades","positions","market","reports","shareboard","settings"]){
  assert.ok(app.includes('["'+view+'"')||app.includes('"'+view+'"'),"Keep route "+view);
 }
 assert.match(qa,/\.up\b/);assert.match(qa,/\.down\b/);
});
test("Screenshot logo band blends into identical cream canvas and original SVG is sharp",async()=>{
 const [qa,project]=await Promise.all(["canva-fullsite-qa.css","allocation-projects.js"].map(load));
 assert.ok(qa.includes("body.projectCaptureMode"),"Must scope screenshot-only styling");
 assert.ok(qa.includes(".projectOverview>.projectPresentationHeader"));
 assert.ok(qa.includes("background:#FAF9F5!important"));
 assert.ok(qa.includes("border:0!important"));
 assert.ok(qa.includes("box-shadow:none!important"));
 assert.ok(qa.includes("object-fit:contain!important"));
 assert.ok(project.includes("body.classList.add('projectCaptureMode')"));
});
test("All 3 project gauges use new warm-gold, brighter deep-green, brighter deep-blue palette",async()=>{
 const [js,qa]=await Promise.all(["allocation-projects.js","canva-fullsite-qa.css"].map(load));
 assert.match(js,/projectEnergyColors=\['#D4A126','#279B69','#3684CA'\]/);
 for(const hex of ["#D4A126","#279B69","#3684CA","#8A6313","#116E46","#17598F"]){
  assert.ok(qa.includes(hex),"Missing project color or accessible number ink "+hex);
 }
 assert.ok(contrast("#8A6313","#FFFEFA")>=4.5);
 assert.ok(contrast("#116E46","#FFFEFA")>=4.5);
 assert.ok(contrast("#17598F","#FFFEFA")>=4.5);
 assert.match(js,/drawProjectRing\(canvas,pc,projectEnergyColors\[i\]\)/);
});
test("Final Canva CSS is syntactically balanced and contains no fake finance values",async()=>{
 const css=await load("canva-fullsite-qa.css");
 let depth=0,comment=false,quote=null;
 for(let i=0;i<css.length;i++){
  const c=css[i],n=css[i+1];
  if(comment){if(c==="*"&&n==="/"){comment=false;i++;}continue}
  if(quote){if(c==="\\"){i++;continue}if(c===quote)quote=null;continue}
  if(c==="/"&&n==="*"){comment=true;i++;continue}
  if(c==='"'||c==="'"){quote=c;continue}
  if(c==="{")depth++;
  if(c==="}"){depth--;assert.ok(depth>=0,"Extra CSS brace")}
 }
 assert.equal(depth,0);assert.equal(comment,false);assert.equal(quote,null);
 assert.doesNotMatch(css,/36,000,000|2,130,000|fake_price|fake_data/i);
});
