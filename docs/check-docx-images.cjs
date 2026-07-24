const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const EX = path.join(__dirname, '_docx_broken/e');
const mediaDir = path.join(EX, 'word/media');
const xml = fs.readFileSync(path.join(EX, 'word/document.xml'), 'utf8');
const rels = fs.readFileSync(path.join(EX, 'word/_rels/document.xml.rels'), 'utf8');

const ridToFile = {};
for (const m of rels.matchAll(/Id="(rId\d+)"[^>]*Target="media\/([^"]+)"/g)) {
  ridToFile[m[1]] = m[2];
}

function captionNear(xml, pos) {
  const chunk = xml.slice(pos, pos + 4000);
  const caps = [...chunk.matchAll(/<w:t[^>]*>([^<]{4,120})<\/w:t>/g)].map((m) => m[1].trim());
  return caps.find((t) => /앱|PC|웹|목록|로그인|홈|입장|매장|진열|착용|결제|관리|상세|월드|2D|점주/.test(t)) || caps[0] || '';
}

const embeds = [...xml.matchAll(/r:embed="(rId\d+)"/g)];
const seen = new Set();
let n = 0;

(async () => {
  for (const m of embeds) {
    const rid = m[1];
    if (seen.has(rid)) continue;
    seen.add(rid);
    n++;
    const f = ridToFile[rid];
    const p = path.join(mediaDir, f);
    let status = 'OK';
    try {
      const meta = await sharp(p).metadata();
      status = `${meta.width}x${meta.height} ${meta.format}`;
    } catch (e) {
      status = `BROKEN ${e.message}`;
    }
    const cap = captionNear(xml, m.index);
    console.log(`${String(n).padStart(2)} | ${rid} | ${f} | ${status}`);
    if (cap) console.log(`    cap: ${cap.slice(0, 80)}`);
  }
})();
