import {uid, importDecks} from './core.js';

const plain = x => x && typeof x === 'object' && !Array.isArray(x);
export function normalizeWorkspace(input, map) {
  if (!plain(input) || !Array.isArray(input.decks) || input.decks.length > 200) throw Error('덱 저장 데이터가 올바르지 않습니다.');
  const ids = new Set();
  const decks = input.decks.length ? importDecks(JSON.stringify({decks: input.decks}), map) : [];
  decks.forEach((d, i) => {
    const raw = input.decks[i];
    if (typeof raw.id !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(raw.id) || ids.has(raw.id)) throw Error('덱 ID가 중복되거나 올바르지 않습니다.');
    ids.add(raw.id); d.id = raw.id;
    d.updatedAt = Number.isFinite(Date.parse(raw.updatedAt)) ? new Date(raw.updatedAt).toISOString() : new Date().toISOString();
  });
  if (!Array.isArray(input.owned) || input.owned.some(x => typeof x !== 'string' || x.length > 100) || input.owned.length > 500) throw Error('보유 확장 정보가 올바르지 않습니다.');
  return {decks, active: ids.has(input.active) ? input.active : decks[0]?.id || '', owned: [...new Set(input.owned)]};
}

const canonical = value => JSON.stringify(value, function(key, v) {
  if (key === 'updatedAt') return undefined;
  if (plain(v)) return Object.fromEntries(Object.keys(v).sort().map(k => [k,v[k]]));
  return v;
});
export const sameWorkspace = (a,b) => canonical(a) === canonical(b);
export function mergeWorkspaces(base, local, remote, makeId = uid) {
  const empty = {decks:[],active:'',owned:[]};
  base ||= empty; local ||= empty; remote ||= empty;
  const maps = [base,local,remote].map(s => new Map(s.decks.map(d => [d.id,d])));
  const [b,l,r] = maps, decks = [], conflicts = [];
  for (const id of new Set([...r.keys(),...l.keys(),...b.keys()])) {
    const before=b.get(id), left=l.get(id), right=r.get(id);
    if (canonical(left)===canonical(right)) {if(left) decks.push(structuredClone(left)); continue;}
    if (canonical(left)===canonical(before)) {if(right) decks.push(structuredClone(right)); continue;}
    if (canonical(right)===canonical(before)) {if(left) decks.push(structuredClone(left)); continue;}
    // Both devices changed this deck. Preserve both; never undo a remote deletion.
    if(right) decks.push(structuredClone(right));
    if(left) decks.push({...structuredClone(left),id:makeId(),name:(left.name+' (충돌 복사본)').slice(0,120),updatedAt:new Date().toISOString()});
    conflicts.push(left?.name || right?.name || '덱');
  }
  const owned=[...new Set([...base.owned,...local.owned,...remote.owned])].filter(id => {
    const was=base.owned.includes(id), here=local.owned.includes(id), there=remote.owned.includes(id);
    return here===was ? there : here;
  });
  const active=decks.some(d=>d.id===local.active)?local.active:decks.some(d=>d.id===remote.active)?remote.active:decks[0]?.id||'';
  return {state:{decks,active,owned},conflicts};
}
