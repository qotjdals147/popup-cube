const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

const DOCX = path.join(__dirname, '온라인-팝업스토어-플랫폼-시안.docx');

(async () => {
  const zip = await JSZip.loadAsync(fs.readFileSync(DOCX));
  const names = Object.keys(zip.files).sort();
  const bad = names.filter((n) => n.includes('\\'));
  console.log('entries', names.length, 'backslash paths', bad.length);
  if (bad.length) console.log(bad.slice(0, 5));

  const xml = await zip.file('word/document.xml').async('string');
  const rels = await zip.file('word/_rels/document.xml.rels').async('string');
  const map = {};
  for (const m of rels.matchAll(/Id="(rId\d+)"[^>]*Target="media\/([^"]+)"/g)) map[m[1]] = m[2];

  const targets = [3, 4, 6, 7, 21];
  const byOrder = [];
  let page = 1;
  for (const m of xml.matchAll(/<w:br w:type="page"\/>|<w:br w:type="page"[^/]*\/>|r:embed="(rId\d+)"/g)) {
    if (m[0].startsWith('r:embed')) {
      const rid = m[1];
      if (map[rid]) byOrder.push({ page, rid, file: map[rid] });
    } else page++;
  }
  const grouped = {};
  byOrder.forEach((x) => {
    grouped[x.page] = grouped[x.page] || [];
    grouped[x.page].push(x);
  });
  for (const p of targets) {
    console.log('\npage', p);
    (grouped[p] || []).forEach((x, i) => {
      const chunk = xml.split(`r:embed="${x.rid}"`)[1]?.slice(0, 800) || '';
      const ext = chunk.match(/cx="(\d+)" cy="(\d+)"/);
      console.log(` ${i + 1}. ${x.file} cx=${ext?.[1]} cy=${ext?.[2]}`);
    });
  }
})();
