const fs = require('fs');
const path = require('path');

const xml = fs.readFileSync(path.join(__dirname, '_docx_broken/e/word/document.xml'), 'utf8');
const rels = fs.readFileSync(path.join(__dirname, '_docx_broken/e/word/_rels/document.xml.rels'), 'utf8');
const ridToFile = {};
for (const m of rels.matchAll(/Id="(rId\d+)"[^>]*Target="media\/([^"]+)"/g)) ridToFile[m[1]] = m[2];

let page = 1;
let pos = 0;
const items = [];

while (pos < xml.length) {
  const pb = xml.indexOf('<w:br w:type="page"', pos);
  const embed = xml.indexOf('r:embed="', pos);
  if (embed < 0 && pb < 0) break;
  if (pb >= 0 && (embed < 0 || pb < embed)) {
    page++;
    pos = pb + 10;
    continue;
  }
  const ridM = xml.slice(embed).match(/^r:embed="(rId\d+)"/);
  if (!ridM) {
    pos = embed + 9;
    continue;
  }
  const rid = ridM[1];
  if (!ridToFile[rid]) {
    pos = embed + 9;
    continue;
  }
  const chunk = xml.slice(embed, embed + 5000);
  const capM = chunk.match(/<w:t[^>]*>([^<]{6,100})<\/w:t>/);
  items.push({ page, rid, file: ridToFile[rid], cap: capM ? capM[1] : '' });
  pos = embed + 9;
}

const byPage = {};
for (const it of items) {
  byPage[it.page] = byPage[it.page] || [];
  byPage[it.page].push(it);
}
for (const p of [3, 4, 6, 7, 21]) {
  console.log(`\n=== page ${p} ===`);
  (byPage[p] || []).forEach((it, i) => console.log(` ${i + 1}. ${it.file} (${it.rid}) ${it.cap.slice(0, 60)}`));
}
