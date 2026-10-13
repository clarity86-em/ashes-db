// Refresh intentionally: the app never silently changes a saved deck's card pool.
import {writeFile,readFile} from 'node:fs/promises';
const old=JSON.parse(await readFile('data/meta.json','utf8'));
const ref=process.argv.includes('--latest')?'master':old.commit;
const root=`https://raw.githubusercontent.com/Ashteki/ashteki/${ref}/data/`;
async function load(p){const r=await fetch(root+p);if(!r.ok)throw Error(`${p}: HTTP ${r.status}`);return r.json();}
const cardFiles=['all-cards.json','kanna-galeheart.json','maeve-luminvale.json'];
const deckFiles=['precon-core.json','precon-pve.json','precon-ascendancy.json'];
const payload=await Promise.all([...cardFiles.map(f=>load('cards/'+f)),...deckFiles.map(f=>load('decks/'+f))]);
const byId=new Map();
for(let i=0;i<cardFiles.length;i++)for(const c of payload[i].results){if(!c.stub||!c.name||!c.type)throw Error('Unexpected card schema');c.release??={name:'Ascendancy: Natural Magic',stub:'ascendancy-natural-magic'};if(!byId.has(c.stub))byId.set(c.stub,c);}
const cards=[...byId.values()].sort((a,b)=>a.name.localeCompare(b.name));
const precons=deckFiles.flatMap((f,i)=>payload[3+i].filter(p=>byId.has(p.phoenixborn[0].id)&&p.cards.every(c=>byId.has(c.id))).map(p=>({...p,group:f.includes('pve')?'Red Rains':f.includes('ascendancy')?'Ascendancy':'Reborn'})));
await writeFile('data/cards.json',JSON.stringify(cards));await writeFile('data/precons.json',JSON.stringify(precons));
await writeFile('data/meta.json',JSON.stringify({updated:new Date().toISOString().slice(0,10),source:'https://github.com/Ashteki/ashteki',commit:ref,cardCount:cards.length,missingText:cards.filter(c=>!c.text).length,sources:cardFiles}));
console.log(`Updated ${cards.length} cards and ${precons.length} preconstructed decks from ${ref}.`);
