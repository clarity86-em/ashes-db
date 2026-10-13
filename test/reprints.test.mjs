import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {filterCards,cardReleases} from '../src/core.js';
import {REPRINT_SETS} from '../src/reprints.js';
const cards=JSON.parse(fs.readFileSync(new URL('../data/cards.json',import.meta.url)));
const precons=JSON.parse(fs.readFileSync(new URL('../data/precons.json',import.meta.url)));
test('all seven verified Red Rains rosters match the four bundled preconstructed heroes',()=>{
 const groups=['corpse','scourge','blight','siege','spawn','flood','argaia'];
 assert.equal(REPRINT_SETS.length,7);
 REPRINT_SETS.forEach((set,i)=>{
  const expected=precons.filter(p=>p.group==='Red Rains'&&p.precon_set===groups[i]).map(p=>p.phoenixborn[0].id).sort();
  assert.equal(expected.length,4);
  const found=filterCards(cards,{release:set.stub,type:'Phoenixborn'});
  assert.deepEqual(found.map(c=>c.stub).sort(),expected);
  assert.deepEqual(filterCards(cards,{ownedOnly:true,owned:[set.stub],type:'Phoenixborn'}).map(c=>c.stub).sort(),expected);
  for(const c of found){assert.ok(filterCards(cards,{release:c.release.stub}).includes(c));assert.equal(cardReleases(c).length,2);}
 });
});
test('owning a reprint never grants the original set or duplicate cards',()=>{
 const owned=['the-corpse-of-viros'];
 const found=filterCards(cards,{ownedOnly:true,owned});
 assert.ok(found.some(c=>c.stub==='noah-redmoon'));
 const oldUnique=cards.find(c=>c.phoenixborn==='Noah Redmoon'&&c.release.stub==='master-set');
 assert.ok(oldUnique);assert.ok(!found.includes(oldUnique));
 const union=filterCards(cards,{ownedOnly:true,owned:[...owned,'master-set']});
 assert.equal(union.filter(c=>c.stub==='noah-redmoon').length,1);
 assert.equal(new Set(union.map(c=>c.stub)).size,union.length);
 assert.ok(filterCards(cards,{query:'corpse viros',type:'Phoenixborn'}).some(c=>c.stub==='noah-redmoon'));
});
