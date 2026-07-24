const fs = require('fs');
const path = require('path');

const xml = fs.readFileSync(path.join(__dirname, '_docx_broken/e/word/document.xml'), 'utf8');
const rels = fs.readFileSync(path.join(__dirname, '_docx_broken/e/word/_rels/document.xml.rels'), 'utf8');
const map = {};
for (const m of rels.matchAll(/Id="(rId\d+)"[^>]*Target="media\/([^"]+)"/g)) map[m[1]] = m[2];

const tokens = xml.split(/(<w:br w:type="page"\/>|<w:br w:type="page"><\/w:br>)/);
let page = 1;
const grouped = {};
for (const tok of tokens) {
  if (tok.includes('w:type="page"')) {
    page++;
    continue;
  }
  for (const m of tok.matchAll(/r:embed="(rId\d+)"/g)) {
    const rid = m[1];
    if (!map[rid]) continue;
    grouped[page] = grouped[page] || [];
    if (!grouped[page].includes(map[rid])) grouped[page].push(map[rid]);
  }
}
for (const p of Object.keys(grouped).map(Number).sort((a, b) => a - b)) {
  console.log('page', p, '->', grouped[p].join(', '));
}
