export const MAGIC = {
 natural: ['자연','Natural','#356443'], ceremonial:['의식','Ceremonial','#85404d'],
 charm:['매혹','Charm','#ac467b'], illusion:['환영','Illusion','#657aa9'],
 divine:['신성','Divine','#ab842c'], sympathy:['공감','Sympathy','#b65730'],
 time:['시간','Time','#466d88'], artifice:['기계','Artifice','#79704f'], astral:['천체','Astral','#635397']
};
export const TYPES = {'Ally':'동료','Ready Spell':'준비 주문','Action Spell':'행동 주문','Reaction Spell':'반응 주문','Alteration Spell':'변화 주문','Phoenixborn':'피닉스본','Conjuration':'소환물','Conjured Alteration Spell':'소환 변화 주문'};
export const PLAYABLE = ['Ally','Ready Spell','Action Spell','Reaction Spell','Alteration Spell'];
export const count = (items) => Object.values(items || {}).reduce((n,v)=>n+v,0);
export const uid = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
export function emptyDeck() { return {id:uid(),name:'새 덱',phoenixborn:'',mode:'casual',cards:{},dice:{},firstFive:[],notes:'',updatedAt:new Date().toISOString()}; }
export function fromPrecon(p,mode='casual') {
 const d=emptyDeck();d.name=p.name;d.phoenixborn=p.phoenixborn[0].id;d.mode=mode;
 d.cards=Object.fromEntries(p.cards.map(c=>[c.id,c.count]));d.dice=Object.fromEntries(p.dicepool.map(c=>[c.magic,c.count]));d.firstFive=p.cards.filter(c=>c.ff).map(c=>c.id);return d;
}
export function setQuantity(deck, card, n) {
 if(!card || !PLAYABLE.includes(card.type)) throw Error('이 카드는 메인 덱에 넣을 수 없습니다.');
 if(!Number.isInteger(n)||n<0||n>3)throw Error('카드는 0–3장으로 설정해주세요.');
 if(n)deck.cards[card.stub]=n;else{delete deck.cards[card.stub];deck.firstFive=deck.firstFive.filter(id=>id!==card.stub);}
}
export function validate(deck, map) {
 const issues=[];const pb=map.get(deck.phoenixborn);
 if(!pb||pb.type!=='Phoenixborn')issues.push('피닉스본을 선택해주세요.');
 if(count(deck.cards)!==30)issues.push(`메인 덱 ${count(deck.cards)}/30장`);
 if(count(deck.dice)!==10)issues.push(`주사위 ${count(deck.dice)}/10개`);
 if(deck.firstFive.length!==5)issues.push(`First Five ${deck.firstFive.length}/5장`);
 let uniques=0,firstUniques=0;
 for(const [id,n] of Object.entries(deck.cards)) {
  const c=map.get(id);if(!c||!PLAYABLE.includes(c.type)){issues.push(`덱에 넣을 수 없는 카드: ${id}`);continue;}
  if(n<1||n>3||!Number.isInteger(n))issues.push(`${c.name}: 최대 3장`);
  if(c.phoenixborn){uniques+=n;if(deck.firstFive.includes(id))firstUniques++;if(c.phoenixborn!==pb?.name)issues.push(`${c.name}: ${c.phoenixborn} 전용`);}
 }
 if(uniques>3)issues.push('피닉스본 전용 카드는 합계 최대 3장입니다.');
 if(firstUniques>1)issues.push('First Five에는 전용 카드를 최대 1종 선택하세요.');
 if(new Set(deck.firstFive).size!==deck.firstFive.length)issues.push('First Five는 서로 다른 카드여야 합니다.');
 for(const id of deck.firstFive){if(!deck.cards[id])issues.push('First Five에 덱에 없는 카드가 있습니다.');if(deck.mode==='pvp'&&map.get(id)?.chained)issues.push(`${map.get(id).name}: Chained — 대전 First Five 제외`);}
 return issues;
}
export function conjurations(deck,map) {
 const result=new Map(),seen=new Set();
 function visit(id) {if(seen.has(id))return;seen.add(id);for(const ref of map.get(id)?.conjurations||[]){const c=map.get(ref.stub);if(c){result.set(c.stub,c);visit(c.stub);}}}
 visit(deck.phoenixborn);Object.keys(deck.cards).forEach(visit);return [...result.values()].sort((a,b)=>a.name.localeCompare(b.name));
}
export function filterCards(cards,{query='',type='',magic='',release='',compatible=false,ownedOnly=false,owned=[],deck=null,map=null}={}) {
 const terms=query.toLowerCase().trim().split(/\s+/).filter(Boolean);const pb=map?.get(deck?.phoenixborn);
 return cards.filter(c=>{
  if(type==='playable'&&!PLAYABLE.includes(c.type))return false;
  if(type&&type!=='playable'&&c.type!==type)return false;
  if(magic&&!c.dice?.includes(magic)&&!c.altDice?.includes(magic))return false;
  if(release&&c.release?.stub!==release)return false;
  if(ownedOnly&&!owned.includes(c.release?.stub))return false;
  if(compatible&&c.phoenixborn&&c.phoenixborn!==pb?.name)return false;
  const hay=`${c.name} ${c.text||''} ${c.type} ${TYPES[c.type]||''} ${c.release?.name||''} ${c.phoenixborn||''}`.toLowerCase();
  return terms.every(t=>hay.includes(t));
 });
}
export function importDecks(raw,map) {
 let input;try{input=JSON.parse(raw);}catch{throw Error('JSON 형식의 덱 파일을 선택해주세요.');}
 const arr=Array.isArray(input)?input:input.decks||[input.deck||input];
 if(!Array.isArray(arr)||arr.length<1||arr.length>200)throw Error('한 번에 1–200개 덱을 가져올 수 있습니다.');
 return arr.map(x=>{
  if(!x||typeof x!=='object'||typeof x.name!=='string'||!x.cards||typeof x.cards!=='object'||Array.isArray(x.cards))throw Error('올바른 Ashes DB 덱 파일이 아닙니다.');
  const d=emptyDeck();d.name=x.name.slice(0,120);d.notes=typeof x.notes==='string'?x.notes.slice(0,20000):'';
  if(x.phoenixborn&&map.get(x.phoenixborn)?.type!=='Phoenixborn')throw Error(`알 수 없는 피닉스본: ${x.phoenixborn}`);
  d.phoenixborn=x.phoenixborn||'';d.mode=x.mode==='pvp'?'pvp':'casual';
  for(const [id,n] of Object.entries(x.cards)){if(!map.has(id))throw Error(`현재 데이터에 없는 카드: ${id}`);setQuantity(d,map.get(id),n);}
  if(x.dice&&(typeof x.dice!=='object'||Array.isArray(x.dice)))throw Error('주사위 구성이 올바르지 않습니다.');
  for(const [m,n] of Object.entries(x.dice||{})){if(!Object.hasOwn(MAGIC,m)||!Number.isInteger(n)||n<0||n>10)throw Error('주사위 구성이 올바르지 않습니다.');if(n)d.dice[m]=n;}
  if(x.firstFive&&(!Array.isArray(x.firstFive)||x.firstFive.length>5||new Set(x.firstFive).size!==x.firstFive.length))throw Error('First Five 구성이 올바르지 않습니다.');
  d.firstFive=x.firstFive||[];if(d.firstFive.some(id=>typeof id!=='string'||!d.cards[id]))throw Error('First Five에 덱에 없는 카드가 있습니다.');return d;
 });
}
export function exportText(d,map) {
 const lines=[d.name,`Phoenixborn: ${map.get(d.phoenixborn)?.name||'선택 전'}`,'',`Dice (${count(d.dice)}):`,...Object.entries(d.dice).map(([k,v])=>`${v} ${MAGIC[k][1]}`),'',`Main deck (${count(d.cards)}):`];
 for(const t of PLAYABLE){const group=Object.entries(d.cards).filter(([id])=>map.get(id)?.type===t);if(group.length)lines.push('',t,...group.map(([id,n])=>`${n}x ${map.get(id).name}${d.firstFive.includes(id)?' * First Five':''}`));}
 lines.push('','Conjurations:',...conjurations(d,map).map(c=>`${c.copies||'?'}x ${c.name}`));if(d.notes)lines.push('','Notes:',d.notes);return lines.join('\n');
}
