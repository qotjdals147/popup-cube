/**
 * docx ONLY — image9(m08) 담기 아래 상세페이지 보기 버튼 정확 배치
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const sharp = require('sharp');

const DOCX = path.join(__dirname, '온라인-팝업스토어-플랫폼-시안.docx');
const TMP = path.join(__dirname, '_docx_fix_only');
const EXTRACTED = path.join(TMP, 'extracted');
const IMAGE = path.join(EXTRACTED, 'word', 'media', 'image9.png');
// 이전에 추출해 둔 깨끗한 원본(담기만 있는 버전)
const CLEAN_FALLBACK = path.join(__dirname, '_docx_media_tmp/extracted/word/media/image9.png');

const BTN = '#E8A04A';
const STROKE = '#C4882E';
const LABEL = '상세페이지 보기';

function unzip() {
  if (fs.existsSync(TMP)) fs.rmSync(TMP, { recursive: true, force: true });
  fs.mkdirSync(EXTRACTED, { recursive: true });
  fs.copyFileSync(DOCX, path.join(TMP, 'src.zip'));
  execSync(
    `powershell -NoProfile -Command "Expand-Archive -Path '${path.join(TMP, 'src.zip').replace(/'/g, "''")}' -DestinationPath '${EXTRACTED.replace(/'/g, "''")}' -Force"`,
    { stdio: 'inherit' }
  );
}

function zipBack() {
  const zip = path.join(TMP, 'out.zip');
  try {
    fs.unlinkSync(zip);
  } catch {}
  const ps = `Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::CreateFromDirectory('${EXTRACTED.replace(/'/g, "''")}', '${zip.replace(/'/g, "''")}', [System.IO.Compression.CompressionLevel]::Optimal, $false)`;
  execSync(`powershell -NoProfile -Command "${ps}"`, { stdio: 'inherit' });
  fs.copyFileSync(zip, DOCX);
}

function findRedButtons(data, w, h) {
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
      if (rw > 200 && rh > 28 && rh < 80) regions.push({ x: minX, y: minY, w: rw, h: rh });
    }
  }
  return regions.sort((a, b) => a.y - b.y || a.x - b.x);
}

function btnSvg(r) {
  const gap = 6;
  const h = 34;
  const y = r.y + r.h + gap;
  const x = r.x + 6;
  const w = r.w - 12;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="7" ry="7" fill="${BTN}" stroke="${STROKE}" stroke-width="1.5"/>
    <text x="${x + w / 2}" y="${y + h / 2 + 5}" text-anchor="middle" font-family="Malgun Gothic, Gulim, sans-serif" font-size="15" font-weight="700" fill="#1a1a2e">${LABEL}</text>`;
}

async function buildFrom(srcPath, destPath) {
  const { data, info } = await sharp(srcPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const reds = findRedButtons(data, info.width, info.height);
  if (reds.length < 4) throw new Error(`red buttons ${reds.length} @ ${srcPath}`);
  console.log('담기 위치:', reds);
  const svg = Buffer.from(
    `<svg width="${info.width}" height="${info.height}" xmlns="http://www.w3.org/2000/svg">${reds
      .slice(0, 4)
      .map(btnSvg)
      .join('')}</svg>`
  );
  await sharp(srcPath).composite([{ input: svg, top: 0, left: 0 }]).png().toFile(destPath);
}

async function main() {
  unzip();
  // 깨진 docx 이미지 대신 깨끗한 원본에서 다시 합성
  const base = fs.existsSync(CLEAN_FALLBACK) ? CLEAN_FALLBACK : IMAGE;
  await buildFrom(base, IMAGE);
  zipBack();
  console.log('OK docx image9 only');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
