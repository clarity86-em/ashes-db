import {readFile,writeFile} from 'node:fs/promises';
const core=(await readFile('src/core.js','utf8')).replace(/^export /gm,'');
const symbols=(await Promise.all(['src/ashes-symbols.js','src/symbols.js'].map(p=>readFile(p,'utf8')))).join('\n').replace(/^import .*?;\n/gm,'').replace(/^export /gm,'');
const data=await Promise.all(['cards','precons','meta'].map(async k=>JSON.parse(await readFile(`data/${k}.json`,'utf8'))));
let app=(await readFile('src/app.js','utf8')).replace(/^import .*?;\n/gm,'').replace("const responses=await Promise.all(['cards','precons','meta'].map(async p=>{const r=await fetch(`./data/${p}.json`);if(!r.ok)throw Error('카드 데이터 파일을 읽을 수 없습니다.');return r.json();}));",'const responses=window.ASHES_DATA;');
let html=await readFile('index.html','utf8');const css=await readFile('src/styles.css','utf8');
html=html.replace('<link rel="stylesheet" href="./src/styles.css">',`<style>${css}</style>`).replace('<script type="module" src="./src/app.js"></script>',`<script>window.ASHES_DATA=${JSON.stringify(data).replaceAll('<','\\u003c')};</script><script type="module">${core}\n${symbols}\nconst ONLINE_URL='https://ashes-db-online.silver-bud-3267.chatgpt.site';\n${app}</script>`).replaceAll('href="./THIRD_PARTY.md"','href="https://github.com/Ashteki/ashteki"');
html+='\n<!-- Ashes DB: AGPL-3.0-or-later. Card data and symbol outlines derived from Ashteki. Game content, symbols and art © Plaid Hat Games. Full source and attribution supplied in ashes-db-source.zip. -->';
await writeFile('../Ashes_DB.html',html);console.log('Built ../Ashes_DB.html');
