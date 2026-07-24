/**
 * Remove checkerboard / flat background from AI-generated avatar PNGs.
 * Flood-fill from image edges through near-neutral bright pixels.
 */
const fs = require('fs');
const path = require('path');
const sharp = require(path.join(__dirname, '../docs/node_modules/sharp'));

function isBackgroundPixel(r, g, b) {
  const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
  if (maxDiff > 18) return false;
  return r >= 175 && g >= 175 && b >= 175;
}

async function removeBackground(inputPath, outputPath) {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const visited = new Uint8Array(width * height);
  const queue = [];

  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const idx = y * width + x;
    if (visited[idx]) return;
    const o = idx * channels;
    if (!isBackgroundPixel(data[o], data[o + 1], data[o + 2])) return;
    visited[idx] = 1;
    queue.push(idx);
  };

  for (let x = 0; x < width; x += 1) {
    push(x, 0);
    push(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    push(0, y);
    push(width - 1, y);
  }

  while (queue.length > 0) {
    const idx = queue.pop();
    const x = idx % width;
    const y = (idx - x) / width;
    const o = idx * channels;
    data[o + 3] = 0;
    push(x - 1, y);
    push(x + 1, y);
    push(x, y - 1);
    push(x, y + 1);
  }

  await sharp(data, { raw: { width, height, channels } })
    .trim({ threshold: 1 })
    .png()
    .toFile(outputPath);

  const meta = await sharp(outputPath).metadata();
  console.log('processed', path.basename(outputPath), '->', meta.width, 'x', meta.height);
}

async function main() {
  const outDir = path.join(__dirname, '../apps/web/public/worlds/generated');
  const files = ['gucci-avatar-chibi-1.png', 'gucci-avatar-chibi-2.png'];
  for (const file of files) {
    const src = path.join(outDir, file);
    const tmp = path.join(outDir, file.replace('.png', '.tmp.png'));
    await removeBackground(src, tmp);
    fs.renameSync(tmp, src);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
