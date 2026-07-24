/**
 * image9.png — 담기(빨강) 버튼 위치를 스캔해 바로 아래에 상세페이지 보기 버튼 배치
 * docx 전용 (image9.png → docx 교체)
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SRC = path.join(__dirname, '_docx_media_tmp/extracted/word/media/image9.png');
const OUT = path.join(__dirname, '_docx_m08_fixed.png');
const BTN = '#E8A04A';
const STROKE = '#C4882E';
const LABEL = '상세페이지 보기';

async function findRedButtons(data, w, h) {
  const regions = [];
  const visited = new Uint8Array(w * h);
  const idx = (x, y) => y * w + x;
  const isRed = (x, y) => {
    const i = idx(x, y) * 4;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    return r > 170 && g < 110 && b < 110 && r - g > 60;
  };

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (visited[idx(x, y)] || !isRed(x, y)) continue;
      let minX = x,
        maxX = x,
        minY = y,
        maxY = y;
      const stack = [[x, y]];
      visited[idx(x, y)] = 1;
      while (stack.length) {
        const [cx, cy] = stack.pop();
        minX = Math.min(minX, cx);
        maxX = Math.max(maxX, cx);
        minY = Math.min(minY, cy);
        maxY = Math.max(maxY, cy);
        for (const [nx, ny] of [
          [cx + 1, cy],
          [cx - 1, cy],
          [cx, cy + 1],
          [cx, cy - 1],
        ]) {
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const k = idx(nx, ny);
          if (visited[k] || !isRed(nx, ny)) continue;
          visited[k] = 1;
          stack.push([nx, ny]);
        }
      }
      const rw = maxX - minX + 1;
      const rh = maxY - minY + 1;
      if (rw > 200 && rh > 28 && rh < 80) {
        regions.push({ x: minX, y: minY, w: rw, h: rh });
      }
    }
  }
  return regions.sort((a, b) => a.y - b.y || a.x - b.x);
}

function btnSvg(r) {
  const gap = 6;
  const h = Math.min(34, Math.round(r.h * 0.85));
  const y = r.y + r.h + gap;
  const pad = 4;
  const x = r.x + pad;
  const w = r.w - pad * 2;
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="7" ry="7" fill="${BTN}" stroke="${STROKE}" stroke-width="1.5"/>
    <text x="${x + w / 2}" y="${y + h / 2 + 5}" text-anchor="middle" font-family="Malgun Gothic, Gulim, sans-serif" font-size="15" font-weight="700" fill="#1a1a2e">${LABEL}</text>
  `;
}

async function main() {
  const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const buttons = await findRedButtons(data, info.width, info.height);
  if (buttons.length < 4) {
    console.error('Found only', buttons.length, 'red buttons:', buttons);
    process.exit(1);
  }
  console.log('red buttons:', buttons);

  const svg = Buffer.from(
    `<svg width="${info.width}" height="${info.height}" xmlns="http://www.w3.org/2000/svg">${buttons
      .slice(0, 4)
      .map(btnSvg)
      .join('')}</svg>`
  );

  await sharp(SRC).composite([{ input: svg, top: 0, left: 0 }]).png().toFile(OUT);
  console.log('OK', OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
