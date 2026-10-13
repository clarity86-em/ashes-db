import {MAGIC} from './core.js';
import {ASHES_SYMBOLS} from './ashes-symbols.js';

const escapeSymbolText=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Printed dice colours, following Ashteki's Die.scss at the symbol snapshot.
const DICE_COLOURS={natural:['#cedb00','#004a98'],ceremonial:['#ee3342','#111821'],charm:['#f7e442','#f34f98'],illusion:['#8bc7ea','#490d67'],divine:['#b58a2b','#f2f2f2'],sympathy:['#e3c2af','#119981'],time:['#dfdfdf','#9a2e36'],artifice:['#77d0e5','#4c5257'],astral:['#fcf7cb','#685ea9']};
const SYMBOL_LABELS={main:'주행동',side:'보조행동',exhaust:'소진',basic:'기본 마법',discard:'카드 버리기'};

export function symbolHTML(token){
  const glyph=ASHES_SYMBOLS[token];if(!glyph)return escapeSymbolText(token);
  const [magic,level]=token.split(':');
  const label=MAGIC[magic]?`${MAGIC[magic][0]} · ${level==='power'?'파워':'클래스'}`:SYMBOL_LABELS[token];
  const colours=DICE_COLOURS[magic];
  const style=colours?` style="--die-ink:${colours[0]};--die-bg:${colours[1]}"`:'';
  return `<span class="ash-symbol ${colours||token==='basic'?'die-face':'action-symbol'}" data-symbol="${token}" role="img" aria-label="${label}" title="${label}"${style}><svg viewBox="${glyph.viewBox}" aria-hidden="true" focusable="false"><path d="${glyph.path}" transform="scale(1,-1)" fill="currentColor"/></svg></span>`;
}

export function magicIcon(magic,full=false){
  if(!MAGIC[magic])return '';
  return `<span class="magic-pair" data-magic-pair="${magic}" title="${MAGIC[magic][0]} · 왼쪽 파워 / 오른쪽 클래스">${symbolHTML(magic+':power')}${symbolHTML(magic+':class')}</span>${full?`<span class="magic-name">${MAGIC[magic][0]}</span>`:''}`;
}

export function textHTML(value){
  return String(value??'').split(/(\[\[[^\]]+\]\])/g).map(part=>{
    const token=part.match(/^\[\[([^\]]+)\]\]$/);
    return token?symbolHTML(token[1]):escapeSymbolText(part);
  }).join('').replace(/\n/g,'<br>');
}

export function costHTML(card){
  const part=value=>{
    if(Array.isArray(value))return `<span class="cost-alternatives" role="group" aria-label="다음 중 하나">${value.map(part).join('<span class="cost-or" aria-hidden="true">/</span><span class="sr-only">또는</span>')}</span>`;
    const quantity=String(value).match(/^(\d+|X)\s+\[\[([^\]]+)\]\]$/);
    return `<span class="cost-item">${quantity?`<b class="cost-count">${quantity[1]}</b>${symbolHTML(quantity[2])}`:textHTML(value)}</span>`;
  };
  return card.cost?.length?`<span class="cost-list">${card.cost.map(part).join('<span class="cost-sep" aria-hidden="true">·</span>')}</span>`:'<span class="no-cost">—</span>';
}

export function symbolGuideHTML(){
  return `<p class="modal-intro">주사위는 왼쪽이 파워 면, 오른쪽이 클래스 면입니다. 카드 비용에는 필요한 면과 개수를 표시합니다.</p><div class="symbol-guide">${Object.entries(MAGIC).map(([magic,info])=>`<div class="symbol-guide-row"><strong>${info[0]}<small>${info[1]}</small></strong><span>${symbolHTML(magic+':power')} 파워</span><span>${symbolHTML(magic+':class')} 클래스</span></div>`).join('')}</div><div class="action-guide">${Object.entries(SYMBOL_LABELS).map(([token,label])=>`<span>${symbolHTML(token)} ${label}</span>`).join('')}</div><p class="micro">‘/’로 연결된 비용은 그중 하나를 선택합니다.</p>`;
}
