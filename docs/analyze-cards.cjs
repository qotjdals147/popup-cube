const sharp = require('sharp');
const SRC = '_docx_media_tmp/extracted/word/media/image9.png';

function isCardBg(r, g, b) {
  // 카드 회색/남회색 배경
  return r >= 28 && r <= 75 && g >= 28 && g <= 75 && b >= 35 && b <= 95 && Math.abs(r - g) < 15;
}

(async () => {
  const { data, info } = await sharp(SRC).raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const quads = [
    { name: 'TL', x0: 90, x1: 520, y0: 320, y1: 900 },
    { name: 'TR', x0: 504, x1: 934, y0: 320, y1: 900 },
    { name: 'BL', x0: 90, x1: 520, y0: 900, y1: 1500 },
    { name: 'BR', x0: 504, x1: 934, y0: 900, y1: 1500 },
  ];
  for (const q of quads) {
    let minY = h,
      maxY = 0,
      samples = [];
    for (let y = q.y0; y < q.y1; y++) {
      let row = 0;
      for (let x = q.x0; x < q.x1; x++) {
        const i = (y * w + x) * 3;
        const r = data[i],
          g = data[i + 1],
          b = data[i + 2];
        if (isCardBg(r, g, b)) {
          row++;
          if (samples.length < 5) samples.push([r, g, b]);
        }
      }
      if (row > (q.x1 - q.x0) * 0.35) {
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
    console.log(q.name, { minY, maxY, h: maxY - minY, samples });
  }
})();
