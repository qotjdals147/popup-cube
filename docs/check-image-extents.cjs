const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const xml = fs.readFileSync(path.join(__dirname, '_docx_broken/e/word/document.xml'), 'utf8');
const rels = fs.readFileSync(path.join(__dirname, '_docx_broken/e/word/_rels/document.xml.rels'), 'utf8');
const map = {};
for (const m of rels.matchAll(/Id="(rId\d+)"[^>]*Target="media\/([^"]+)"/g)) map[m[1]] = m[2];

const files = ['image1.png', 'image2.png', 'image3.png', 'image6.png', 'image7.png', 'image8.png', 'image10.png', 'image18.jpg', 'image21.png', 'image12.png'];
const media = path.join(__dirname, '_docx_broken/e/word/media');

(async () => {
  for (const [rid, file] of Object.entries(map)) {
    if (!files.includes(file)) continue;
    const parts = xml.split(`r:embed="${rid}"`);
    const chunk = parts[1]?.slice(0, 1200) || '';
    const cx = chunk.match(/wp:extent[^>]*cx="(\d+)"/)?.[1];
    const cy = chunk.match(/wp:extent[^>]*cy="(\d+)"/)?.[1];
    let meta = 'missing';
    try {
      const m = await sharp(path.join(media, file)).metadata();
      meta = `${m.width}x${m.height}`;
    } catch (e) {
      meta = 'BROKEN';
    }
    console.log(file, `extent ${cx}x${cy}`, 'file', meta);
  }
})();
