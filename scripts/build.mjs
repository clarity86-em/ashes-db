import {cp,mkdir,rm,readFile,writeFile,rename} from 'node:fs/promises';
import {createHash} from 'node:crypto';
await rm('dist',{recursive:true,force:true});await mkdir('dist');
for(const file of ['index.html','src','data','LICENSE','THIRD_PARTY.md'])await cp(file,`dist/${file}`,{recursive:true});
// Changing the filename prevents browsers from retaining an older stylesheet.
const css=await readFile('dist/src/styles.css');
const cssName=`styles.${createHash('sha256').update(css).digest('hex').slice(0,12)}.css`;
await rename('dist/src/styles.css',`dist/src/${cssName}`);
const html=await readFile('dist/index.html','utf8');
await writeFile('dist/index.html',html.replace('href="./src/styles.css"',`href="./src/${cssName}"`));
console.log('Built dist/ — ready for static hosting.');
