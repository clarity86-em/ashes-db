import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {emptyDeck} from '../src/core.js';
import {normalizeWorkspace,mergeWorkspaces} from '../src/cloud-state.js';
import {CloudSync} from '../src/cloud-sync.js';
import {workspaceRequest} from '../server/workspace.js';

const cards=JSON.parse(readFileSync(new URL('../data/cards.json',import.meta.url))), map=new Map(cards.map(c=>[c.stub,c]));
const snapshot=()=>{const d=emptyDeck();return {decks:[d],active:d.id,owned:[]};};
const clone=x=>structuredClone(x);
function database(){
 const sql=new DatabaseSync(':memory:');sql.exec('CREATE TABLE workspaces (user_id TEXT PRIMARY KEY, payload TEXT NOT NULL, revision INTEGER NOT NULL, updated_at TEXT NOT NULL)');
 return {prepare(query){return{bind(...args){return {async first(){return sql.prepare(query).get(...args)||null;}};}};},close:()=>sql.close()};
}
const users={a:{userId:'user-a',email:'a@example.test'},b:{userId:'user-b',email:'b@example.test'}};
function req(method,body,user='a',origin='https://ashes.test'){
 return new Request('https://ashes.test/api/workspace',{method,headers:body?{'content-type':'application/json','origin':origin,'x-ashes-request':'1','x-ashes-user':users[user]?.userId||''}:undefined,body:body?JSON.stringify(body):undefined});
}
const memory=()=>{const values=new Map();return{getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)};};
function client(db,storage=memory()){
 const observed={states:[],statuses:[],conflicts:[]};
 const c=new CloudSync({map,storage,fetcher:async(_,options)=>workspaceRequest(req(options.method,options.body?JSON.parse(options.body):undefined),{db,user:users.a,map}),onState:s=>observed.states.push(s),onStatus:s=>observed.statuses.push(s),onConflict:s=>observed.conflicts.push(...s)});
 return {c,observed,storage};
}
test('default browser fetch keeps its global receiver when loading and saving',async t=>{
 const db=database(),methods=[];
 t.after(()=>db.close());
 t.mock.method(globalThis,'fetch',async function(url,options){
  assert.ok(this===globalThis,'browser fetch requires its global receiver');
  assert.equal(url,'/api/workspace');methods.push(options.method);
  return workspaceRequest(req(options.method,options.body?JSON.parse(options.body):undefined),{db,user:users.a,map});
 });
 const c=new CloudSync({map,storage:memory(),onState:()=>{},onStatus:()=>{},onConflict:()=>{}});
 t.after(()=>clearTimeout(c.timer));
 await c.start(snapshot());
 assert.deepEqual(methods,['GET','PUT']);assert.equal(c.pending,false);
 const edited=clone(c.current);edited.decks[0].notes='saved with browser fetch';c.queue(edited);await c.flush();
 assert.equal(c.pending,false);assert.equal(c.revision,2);
 const saved=await (await workspaceRequest(req('GET'),{db,user:users.a,map})).json();
 assert.equal(saved.state.decks[0].notes,'saved with browser fetch');
});
test('cloud API requires login, isolates accounts, rejects cross-origin and stale-account writes',async()=>{
 const db=database(),state=snapshot();
 assert.equal((await workspaceRequest(req('GET'),{db,user:null,map})).status,401);
 assert.equal((await workspaceRequest(req('PUT',{revision:0,state},'a','https://evil.test'),{db,user:users.a,map})).status,403);
 assert.equal((await workspaceRequest(req('PUT',{revision:0,state}),{db,user:users.b,map})).status,401);
 assert.equal((await workspaceRequest(req('PUT',{revision:0,state}),{db,user:users.a,map})).status,200);
 assert.equal((await (await workspaceRequest(req('GET'),{db,user:users.b,map})).json()).state,null);
 assert.equal((await (await workspaceRequest(req('GET'),{db,user:users.a,map})).json()).state.decks[0].id,state.decks[0].id);db.close();
});
test('cloud API compare-and-swap prevents stale overwrite and validates uploaded cards',async()=>{
 const db=database(),state=snapshot();
 await workspaceRequest(req('PUT',{revision:0,state}),{db,user:users.a,map});
 const edited=clone(state);edited.decks[0].notes='first edit';
 assert.equal((await workspaceRequest(req('PUT',{revision:1,state:edited}),{db,user:users.a,map})).status,200);
 const stale=await workspaceRequest(req('PUT',{revision:1,state}),{db,user:users.a,map});
 assert.equal(stale.status,409);assert.equal((await stale.json()).state.decks[0].notes,'first edit');
 state.decks[0].cards['not-a-card']=1;
 assert.equal((await workspaceRequest(req('PUT',{revision:2,state}),{db,user:users.a,map})).status,400);db.close();
});
test('three-way merge keeps independent edits and preserves both versions of a conflicting deck',()=>{
 const base=snapshot(),other=emptyDeck();base.decks.push(other);const local=clone(base),remote=clone(base);
 local.decks[0].notes='phone';remote.decks[1].name='desktop';
 let result=mergeWorkspaces(base,local,remote);assert.equal(result.conflicts.length,0);assert.equal(result.state.decks[0].notes,'phone');assert.equal(result.state.decks[1].name,'desktop');
 remote.decks[0].notes='desktop';result=mergeWorkspaces(base,local,remote,()=> 'conflict-copy');
 assert.equal(result.conflicts.length,1);assert.equal(result.state.decks.length,3);assert.equal(result.state.decks.find(d=>d.id==='conflict-copy').notes,'phone');assert.equal(result.state.decks.find(d=>d.id===base.active).notes,'desktop');
});
test('remote deletion stays deleted; a concurrent local edit survives as a new copy',()=>{
 const base=snapshot(),remote={decks:[],active:'',owned:[]};
 assert.equal(mergeWorkspaces(base,base,remote).state.decks.length,0);
 const local=clone(base);local.decks[0].notes='unsent';const result=mergeWorkspaces(base,local,remote,()=> 'recovered');
 assert.equal(result.state.decks.length,1);assert.equal(result.state.decks[0].id,'recovered');assert.equal(result.state.decks[0].notes,'unsent');
});
test('two real clients sync, preserve concurrent edits, and do not overwrite edits typed during upload',async()=>{
 const db=database(),one=client(db),two=client(db),initial=snapshot();await one.c.start(initial);await two.c.start(snapshot());
 let a=clone(one.c.current);a.decks[0].notes='phone';one.c.queue(a);
 let b=clone(two.c.current);b.decks[0].notes='desktop';two.c.queue(b);
 await one.c.flush();await two.c.flush();await one.c.flush(true);
 assert.equal(one.c.current.decks.length,2);assert.equal(two.observed.conflicts.length,1);
 const normalFetch=one.c.fetcher;let release,started;
 const arrived=new Promise(r=>started=r);const gate=new Promise(r=>release=r);
 one.c.fetcher=async(url,options)=>{if(options.method==='PUT'){started();await gate;}return normalFetch(url,options);};
 a=clone(one.c.current);a.decks[0].notes='in flight';one.c.queue(a);const pending=one.c.flush();await arrived;
 a=clone(one.c.current);a.decks[0].notes='typed later';one.c.queue(a);release();await pending;clearTimeout(one.c.timer);
 const saved=await (await workspaceRequest(req('GET'),{db,user:users.a,map})).json();assert.equal(saved.state.decks[0].notes,'typed later');db.close();
});
test('offline edits survive reload and reconnect; corrupted pending data is not discarded',async()=>{
 const db=database(),one=client(db),initial=snapshot();await one.c.start(initial);
 const realFetch=one.c.fetcher;one.c.fetcher=async()=>{throw Error('offline');};const local=clone(one.c.current);local.decks[0].notes='offline draft';one.c.queue(local);await one.c.flush();assert.equal(one.c.pending,true);
 const two=client(db,one.storage);await two.c.start(snapshot());assert.equal(two.c.current.decks[0].notes,'offline draft');assert.equal(two.c.pending,false);
 one.storage.setItem(one.c.key,'{broken');const three=client(db,one.storage);await assert.rejects(three.c.start(snapshot()));assert.equal(one.storage.getItem(one.c.key),'{broken');one.c.fetcher=realFetch;db.close();
});
test('cloud normalization rejects duplicate IDs without requiring a finished deck',()=>{
 const state=snapshot();assert.equal(normalizeWorkspace(state,map).decks[0].cards.constructor,Object);
 state.decks.push(clone(state.decks[0]));assert.throws(()=>normalizeWorkspace(state,map),/ID/);
});
