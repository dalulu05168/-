import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');

test('CRM card spacing loads after legacy !important delivery layout',async()=>{
  const [html,css,delivery]=await Promise.all([
    read('index.html'),read('crm-card-spacing-1mm.css'),read('delivery-layout.css')
  ]);
  const lastCss=[...html.matchAll(/rel="stylesheet" href="([^"]+)"/g)].map(match=>match[1]);
  assert.match(lastCss.at(-2),/^\/delivery-layout\.css\?v=/);
  assert.match(lastCss.at(-1),/^\/crm-card-spacing-1mm\.css\?v=/);
  assert.match(css,/--crm-card-gap:\s*1mm\s*;/);
  assert.match(css,/#main\s*\{[\s\S]*?gap:\s*var\(--crm-card-gap\)\s*!important/);
  for(const box of ['.grid2','.grid3','.projectOverviewCards','.projectOverviewLower','.projectLauncherList','.marketUnifiedGrid']){
    assert.ok(css.includes(box),'Business box grid missing 1mm spacing: '+box);
  }
  assert.match(delivery,/gap:20px!important/,'Test must cover historical delivery override');
  assert.doesNotMatch(css,/\.panelBody\s*\{\s*padding:\s*1mm/,'Card inner padding must not be reduced to 1mm');
});

test('CRM desktop navigation contracts to 64px, expands to 200px and keeps routes',async()=>{
  const [html,app,css]=await Promise.all([
    read('index.html'),read('app.js'),read('crm-card-spacing-1mm.css')
  ]);
  assert.match(css,/--crm-sidebar-open:\s*200px/);
  assert.match(css,/--crm-sidebar-closed:\s*64px/);
  assert.match(css,/@media\s*\(min-width:\s*900px\)/);
  assert.match(css,/#toggleNavigation\s*\{\s*display:\s*inline-flex\s*!important/,'Collapse control must appear on every desktop page');
  assert.match(css,/body\.navigationHidden[^\{]+\.navFrame/);
  assert.match(css,/body\.navigationHidden[^\{]+\.shell/);
  assert.match(app,/id="crmNavigation"/);
  assert.match(app,/aria-controls="crmNavigation"/);
  assert.match(app,/navToggle\.onclick=.*classList\.toggle\("navigationHidden"\)/);
  for(const route of ['dashboard','customers','personnel','trades','positions','market','reports','shareboard','settings']){
    assert.ok(css.includes('.nav button[data-view="'+route+'"]::before'),'Missing collapsed navigation icon: '+route);
  }
  for(const label of ['收缩导航','展开导航','Collapse sidebar','Expand sidebar','Restrânge meniul','Extinde meniul']){
    assert.ok(app.includes(label),'Missing translation: '+label);
  }
  assert.match(html,/app\.js\?v=20261013-collapsible-nav-v1/);
});

test('New 1mm spacing stylesheet has balanced braces and no executable data access',async()=>{
  const css=await read('crm-card-spacing-1mm.css');
  const uncommented=css.replace(/\/\*[\s\S]*?\*\//g,'');
  assert.equal([...uncommented].filter(ch=>ch==='{').length,[...uncommented].filter(ch=>ch==='}').length);
  assert.doesNotMatch(css,/https?:\/\/|fetch\(|supabase\.|localStorage/);
});
