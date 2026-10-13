import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {Window} from 'happy-dom';import * as core from '../src/core.js';import {CloudSync} from '../src/cloud-sync.js';
import * as symbols from '../src/symbols.js';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8').replace(/<script[^>]+src=[^>]+><\/script>/g,'').replace(/<link[^>]+>/g,'');
const app=fs.readFileSync(new URL('../src/app.js',import.meta.url),'utf8').replace(/^import \{([^}]+)\} from '\.\/core.js';/, 'const {$1}=window.testCore;').replace(/^import .*?;$/gm,'')+'\n';
const data=Object.fromEntries(['cards','precons','meta'].map(k=>[k,JSON.parse(fs.readFileSync(new URL(`../data/${k}.json`,import.meta.url)))]));
const tick=()=>new Promise(r=>setTimeout(r,30));
async function setup(stored,cloudMode=false){const w=new Window({url:'https://example.test/ashes-db/',settings:{disableCSSFileLoading:true,disableJavaScriptFileLoading:true,disableIframePageLoading:true}});w.testCore=core;Object.assign(w,symbols);w.ONLINE_URL='https://online.example.test';w.structuredClone=structuredClone;w.AbortController=AbortController;w.CloudSync=class extends CloudSync{constructor(options){super({...options,fetcher:(...args)=>w.fetch(...args)});}};w.innerWidth=1440;w.fetch=async url=>({ok:true,json:async()=>data[String(url).split('/').at(-1).replace('.json','')]});if(stored)w.localStorage.setItem('ashes-db-v1',stored);w.document.write(html);if(cloudMode){w.document.documentElement.dataset.cloud='true';let remote=null,revision=0;const readCards=w.fetch;w.fetch=async(url,options)=>{if(url!=='/api/workspace')return readCards(url);if(options.method==='PUT'){const body=JSON.parse(options.body);assert.equal(body.revision,revision);remote=body.state;revision++;w.cloudSaved=remote;return new Response(JSON.stringify({revision}));}return new Response(JSON.stringify({user:{id:'test-owner',email:'owner@example.test'},state:remote,revision}));};}w.eval(app);await tick();return w;}
function click(w,s){const e=w.document.querySelector(s);assert.ok(e,`Element exists: ${s}`);e.click();}
function input(w,s,value){const e=w.document.querySelector(s);e.value=value;e.dispatchEvent(new w.Event('input',{bubbles:true}));}
test('set catalogue opens a complete expansion and collection filtering keeps the existing deck',async t=>{
 const w=await setup();t.after(()=>w.happyDOM.close());const $=s=>w.document.querySelector(s);
 input(w,'#deck-name','Keep my deck');const before=JSON.parse(w.localStorage.getItem('ashes-db-v1')).decks[0];
 input(w,'#query','absorption');click(w,'[data-nav="sets"]');
 assert.equal(w.document.querySelectorAll('[data-set-row]').length,new Set(data.cards.map(c=>c.release.stub)).size);
 input(w,'#sets-query','Victoria');assert.ok($('[data-set-row="the-duchess-of-deception"]'));
 click(w,'[data-owned="the-duchess-of-deception"]');
 let saved=JSON.parse(w.localStorage.getItem('ashes-db-v1'));assert.deepEqual(saved.owned,['the-duchess-of-deception']);assert.deepEqual(saved.decks[0],before);
 click(w,'[data-set-cards="the-duchess-of-deception"]');
 assert.equal($('#query').value,'');assert.equal($('#type-filter').value,'');assert.equal($('#compatible').checked,false);
 assert.ok($('[data-row="victoria-glassfire"]'));assert.equal(w.document.querySelectorAll('[data-row]').length,data.cards.filter(c=>c.release.stub==='the-duchess-of-deception').length);
 click(w,'[data-nav="sets"]');click(w,'[data-action="owned-cards"]');
 for(const row of w.document.querySelectorAll('[data-row]'))assert.equal(data.cards.find(c=>c.stub===row.dataset.row).release.stub,'the-duchess-of-deception');
 click(w,'[data-nav="sets"]');click(w,'[data-action="owned-builder"]');assert.equal($('#owned-only').checked,true);
 assert.equal(w.localStorage.getItem('ashes-db-owned-filter-v1'),'true');assert.equal($('#deck-name').value,'Keep my deck');
 click(w,'[data-action="hero"]');assert.deepEqual([...w.document.querySelectorAll('[data-hero]')].map(e=>e.dataset.hero),['victoria-glassfire']);click(w,'#close-modal');
 saved=JSON.parse(w.localStorage.getItem('ashes-db-v1'));assert.deepEqual(saved.decks[0],before);
 const reload=await setup(w.localStorage.getItem('ashes-db-v1'));t.after(()=>reload.happyDOM.close());
 click(reload,'[data-nav="sets"]');assert.equal(reload.document.querySelector('[data-owned="the-duchess-of-deception"]').checked,true);
});

test('collection choices sync to the account and an empty collection never includes unowned cards',async t=>{
 const w=await setup(undefined,true);t.after(()=>w.happyDOM.close());
 click(w,'[data-nav="sets"]');click(w,'[data-owned="master-set"]');
 await new Promise(r=>setTimeout(r,1000));assert.deepEqual(w.cloudSaved.owned,['master-set']);
 click(w,'[data-owned="master-set"]');click(w,'[data-action="owned-cards"]');
 assert.ok(w.document.querySelector('.no-results'));assert.equal(w.document.querySelectorAll('[data-row]').length,0);
 await new Promise(r=>setTimeout(r,1000));assert.deepEqual(w.cloudSaved.owned,[]);
});
test('UI search, quantity editing, First Five and persistence',async()=>{const w=await setup();const $=s=>w.document.querySelector(s);assert.equal($('#deck-name').value,'The Mist Guardian');assert.ok($('.hero-banner').textContent.includes('Aradel'));input(w,'#query','abundance');assert.equal(w.document.querySelectorAll('[data-row]').length,1);click(w,'[data-qty="abundance"][data-n="2"]');assert.ok($('[data-remove="abundance"]'));input(w,'#deck-name','My <script>deck</script>');let saved=JSON.parse(w.localStorage.getItem('ashes-db-v1'));let d=saved.decks.find(d=>d.id===saved.active);assert.equal(d.cards.abundance,2);assert.equal(d.name,'My <script>deck</script>');const first=$('[data-first].is-first').dataset.first;click(w,`[data-first="${first}"]`);click(w,'[data-first="abundance"]');saved=JSON.parse(w.localStorage.getItem('ashes-db-v1'));d=saved.decks.find(d=>d.id===saved.active);assert.ok(d.firstFive.includes('abundance'));const w2=await setup(w.localStorage.getItem('ashes-db-v1'));assert.equal(w2.document.querySelector('#deck-name').value,'My <script>deck</script>');assert.equal(w2.document.querySelectorAll('script').length,0);await w.happyDOM.close();await w2.happyDOM.close();});
test('UI hero, dice, clone and deletion workflow',async()=>{const w=await setup();const $=s=>w.document.querySelector(s);click(w,'[data-action="hero"]');click(w,'[data-hero="coal-roarkwin"]');assert.ok($('.issues').textContent.includes('전용'));click(w,'[data-action="dice"]');const d=JSON.parse(w.localStorage.getItem('ashes-db-v1')).decks[0];const first=Object.keys(d.dice)[0];const initial=d.dice[first];click(w,`[data-die="${first}"][data-delta="-1"]`);assert.equal($(`#die-${first}`).textContent,String(initial-1));click(w,'[data-action="close"]');click(w,'[data-action="duplicate"]');click(w,'[data-nav="decks"]');assert.equal(w.document.querySelectorAll('.saved-deck').length,2);click(w,'[data-delete]');click(w,'[data-action="close"]');assert.equal(w.document.querySelectorAll('.saved-deck').length,2);click(w,'[data-delete]');click(w,'[data-confirm-delete]');assert.equal(w.document.querySelectorAll('.saved-deck').length,1);await w.happyDOM.close();});
test('UI base-deck chooser, mobile card modal, collection filtering',async()=>{const w=await setup();w.innerWidth=390;click(w,'[data-action="precons"]');input(w,'#precon-query','issa');assert.ok(w.document.querySelector('[data-precon]'));click(w,'[data-precon]');assert.ok(w.document.querySelector('.hero-banner').textContent.includes('Issa'));click(w,'[data-nav="cards"]');click(w,'[data-preview]');assert.ok(w.document.querySelector('#modal').open);assert.ok(w.document.querySelector('.card-modal'));click(w,'#close-modal');const owned=w.document.querySelector('#owned-only');owned.checked=true;owned.dispatchEvent(new w.Event('change'));assert.ok(w.document.querySelector('.no-results'));click(w,'[data-action="reset-filters"]');assert.ok(w.document.querySelector('[data-row]'));await w.happyDOM.close();});
test('damaged storage is preserved and recovery is offered',async()=>{const raw='{broken';const w=await setup(raw);assert.equal(w.localStorage.getItem('ashes-db-v1'),raw);assert.ok(w.document.querySelector('#recover-data'));await w.happyDOM.close();});

test('online UI saves edited decks and exposes account import and sync controls',async()=>{const w=await setup(undefined,true);assert.match(w.document.querySelector('#save-state').textContent,/내 계정에 저장/);input(w,'#deck-name','Cloud deck');input(w,'#notes','Continue on my phone');await new Promise(r=>setTimeout(r,1000));assert.equal(w.cloudSaved.decks[0].name,'Cloud deck');assert.equal(w.cloudSaved.decks[0].notes,'Continue on my phone');click(w,'#cloud-btn');assert.ok(w.document.querySelector('#modal-content').textContent.includes('owner@example.test'));assert.ok(w.document.querySelector('[data-action="sync-now"]'));assert.ok(w.document.querySelector('[data-action="import"]'));await w.happyDOM.close();});

test('dice selectors show both faces while printed card costs keep the required face',async t=>{
 const w=await setup();t.after(()=>w.happyDOM.close());const $=s=>w.document.querySelector(s);
 const faceNames=el=>[...el.querySelectorAll('[data-symbol]')].map(e=>e.dataset.symbol);
 for(const magic of Object.keys(core.MAGIC))assert.deepEqual(faceNames($(`[data-magic="${magic}"]`)),[magic+':power',magic+':class']);
 input(w,'#query','abundance');assert.deepEqual(faceNames($('td.cost-col')),['main','illusion:class']);
 assert.equal($('td.cost-col .cost-count').textContent,'1');assert.equal($('td.cost-col [data-symbol="main"]').getAttribute('aria-label'),'주행동');
 input(w,'#query','absorption');assert.deepEqual(faceNames($('td.cost-col')),['sympathy:power']);
 click(w,'[data-action="dice"]');assert.equal(w.document.querySelectorAll('.dice-editor .magic-pair').length,9);
 assert.deepEqual(faceNames($('.dice-editor [data-magic-pair="natural"]')),['natural:power','natural:class']);
 click(w,'#close-modal');click(w,'[data-action="symbols"]');assert.equal(w.document.querySelectorAll('.symbol-guide-row').length,9);
 assert.equal($('#modal-content [data-symbol="side"]').getAttribute('aria-label'),'보조행동');
});

test('cost display preserves alternative payments and costs requiring both actions',async t=>{
 const w=await setup();t.after(()=>w.happyDOM.close());const $=s=>w.document.querySelector(s);
 const faceNames=el=>[...el.querySelectorAll('[data-symbol]')].map(e=>e.dataset.symbol);
 input(w,'#query','adrenaline rush');
 assert.deepEqual(faceNames($('td.cost-col .cost-alternatives')),['ceremonial:power','sympathy:power']);
 assert.equal($('td.cost-col .cost-or').textContent,'/');
 assert.deepEqual([...$('td.cost-col .cost-list').children].filter(e=>e.classList.contains('cost-item')).flatMap(faceNames),['side','basic']);
 input(w,'#query','drain vitality');assert.deepEqual(faceNames($('td.cost-col .cost-alternatives')),['main','side']);
 input(w,'#query','generosity');
 assert.deepEqual([...$('td.cost-col .cost-list').children].filter(e=>e.classList.contains('cost-item')).flatMap(faceNames),['main','side']);
 assert.deepEqual(faceNames($('td.cost-col .cost-alternatives')),['charm:class','time:class']);
 assert.deepEqual(faceNames($('.card-mobile-cost')),faceNames($('td.cost-col')));
});

test('Red Rains expansion displays all four reprinted heroes and owns them independently of original sets',async t=>{
 const w=await setup();t.after(()=>w.happyDOM.close());const $=s=>w.document.querySelector(s);
 const expected=['brennen-blackcloud','coal-roarkwin','jessa-na-ni','noah-redmoon'];
 click(w,'[data-nav="sets"]');input(w,'#sets-query','Brennen');
 assert.ok($('[data-set-row="the-corpse-of-viros"]'));
 click(w,'[data-owned="the-corpse-of-viros"]');click(w,'[data-set-cards="the-corpse-of-viros"]');
 assert.deepEqual([...w.document.querySelectorAll('.set-heroes [data-preview]')].map(e=>e.dataset.preview).sort(),expected);
 for(const id of expected)assert.ok($(`[data-row="${id}"]`));
 click(w,'.set-heroes [data-preview="noah-redmoon"]');
 assert.ok($('#preview [data-set-cards="master-set"]'));assert.ok($('#preview [data-set-cards="the-corpse-of-viros"]'));
 click(w,'[data-nav="sets"]');click(w,'[data-action="owned-builder"]');click(w,'[data-action="hero"]');
 assert.deepEqual([...w.document.querySelectorAll('[data-hero]')].map(e=>e.dataset.hero).sort(),expected);
 click(w,'[data-hero="noah-redmoon"]');assert.ok(w.document.body.textContent.includes('Noah Redmoon'));
 const saved=JSON.parse(w.localStorage.getItem('ashes-db-v1'));assert.deepEqual(saved.owned,['the-corpse-of-viros']);assert.equal(saved.decks.find(d=>d.id===saved.active).phoenixborn,'noah-redmoon');
});
