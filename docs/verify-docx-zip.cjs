const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');
const sharp = require('sharp');

const DOCX = path.join(__dirname, '온라인-팝업스토어-플랫폼-시안.docx');
const SUSPECT = [
  'image3.png',
  'image2.png',
  'image8.png',
  'image18.jpg',
  'image10.png',
  'image5.png',
  'image21.png',
];

(async () => {
  const zip = await JSZip.loadAsync(fs.readFileSync(DOCX));
  const bad = Object.keys(zip.files).filter((n) => n.includes('\\'));
  console.log('zip entries', Object.keys(zip.files).length, 'bad paths', bad.length);
  for (const f of SUSPECT) {
    const entry = zip.file(`word/media/${f}`);
    if (!entry) {
      console.log(f, 'MISSING in zip');
      continue;
    }
    const buf = await entry.async('nodebuffer');
    try {
      const m = await sharp(buf).metadata();
      console.log(f, 'OK', m.width + 'x' + m.height, buf.length);
    } catch (e) {
      console.log(f, 'BROKEN in zip', e.message);
    }
  }
})();
