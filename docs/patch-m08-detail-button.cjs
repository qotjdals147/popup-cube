/**
 * m08 — 담기 버튼 아래 「상세페이지 보기」 추가 (원본 복구 후 패치)
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const CLEAN = path.join(__dirname, '_docx_media_tmp/extracted/word/media/image9.png');
const IMG = path.join(__dirname, 'pdf-assets', 'm08-shop-panel-mobile.png');
const BTN_COLOR = '#E8A04A';
const BTN_TEXT = '상세페이지 보기';

// 담기(빨강) 맨 아래 → 그 아래에 상세 버튼
const BUTTONS = [
  { x: 118, y: 802, w: 348, h: 32 },
  { x: 558, y: 802, w: 348, h: 32 },
  { x: 118, y: 1222, w: 348, h: 32 },
  { x: 558, y: 1222, w: 348, h: 32 },
];

function btnSvg({ x, y, w, h }) {
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" ry="6" fill="${BTN_COLOR}" stroke="#C4882E" stroke-width="1.5"/>
    <text x="${x + w / 2}" y="${y + h / 2 + 5}" text-anchor="middle" font-family="Malgun Gothic, Gulim, sans-serif" font-size="15" font-weight="700" fill="#1a1a2e">${BTN_TEXT}</text>
  `;
}

async function main() {
  fs.copyFileSync(CLEAN, IMG);
  const meta = await sharp(IMG).metadata();
  const svg = Buffer.from(
    `<svg width="${meta.width}" height="${meta.height}" xmlns="http://www.w3.org/2000/svg">${BUTTONS.map(btnSvg).join('')}</svg>`
  );
  const tmp = IMG + '.tmp.png';
  await sharp(IMG).composite([{ input: svg, top: 0, left: 0 }]).png().toFile(tmp);
  fs.renameSync(tmp, IMG);
  console.log('OK restored+c patched', IMG);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
