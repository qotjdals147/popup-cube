/**
 * Extract POP-UP CUBE logo from 01-landing-web-owner and stamp onto other brand screens.
 * Logo region approx: top-left of left panel.
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ASSETS = path.join(__dirname, 'pdf-assets');
const SRC = path.join(ASSETS, '01-landing-web-owner.png');

async function extractLogo() {
  const meta = await sharp(SRC).metadata();
  const w = meta.width;
  const h = meta.height;
  // Logo sits upper-left on left half — crop a square-ish region
  const left = Math.floor(w * 0.06);
  const top = Math.floor(h * 0.18);
  const size = Math.floor(Math.min(w, h) * 0.12);
  const logoPath = path.join(ASSETS, '_brand-cube-logo.png');
  await sharp(SRC)
    .extract({ left, top, width: size, height: size })
    .png()
    .toFile(logoPath);
  console.log('logo', size, 'from', w, 'x', h, '->', logoPath);
  return logoPath;
}

async function stamp(targetRel, opts) {
  const target = path.join(ASSETS, targetRel);
  if (!fs.existsSync(target)) {
    console.warn('skip missing', targetRel);
    return;
  }
  const logoPath = opts.logoPath;
  const img = sharp(target);
  const meta = await img.metadata();
  const logoW = Math.floor(meta.width * (opts.scale || 0.08));
  const logoBuf = await sharp(logoPath).resize(logoW, logoW, { fit: 'contain' }).png().toBuffer();
  const left = Math.floor(meta.width * (opts.leftPct ?? 0.42));
  const top = Math.floor(meta.height * (opts.topPct ?? 0.12));
  const out = await sharp(target)
    .composite([{ input: logoBuf, left, top }])
    .png()
    .toFile(target + '.tmp.png');
  fs.renameSync(target + '.tmp.png', target);
  console.log('stamped', targetRel, 'at', left, top, 'w', logoW);
}

(async () => {
  // copy generated assets first from cursor assets if present
  const srcDir = 'C:\\Users\\LYJ\\.cursor\\projects\\c-Users-LYJ-Desktop-popup-store\\assets';
  for (const f of ['02-login-web-owner.png', 'm02-login-autologin-mobile.png', '02-login-autologin-sian.png', 'm01-landing-dual-roles.png']) {
    const p = path.join(srcDir, f);
    if (fs.existsSync(p)) {
      fs.copyFileSync(p, path.join(ASSETS, f));
      console.log('copied', f);
    }
  }

  const logoPath = await extractLogo();
  // After extract, visually may need adjust — stamp on phones centered
  await stamp('m01-landing-dual-roles.png', { logoPath, scale: 0.14, leftPct: 0.43, topPct: 0.14 });
  await stamp('m02-login-autologin-mobile.png', { logoPath, scale: 0.1, leftPct: 0.44, topPct: 0.1 });
  await stamp('02-login-web-owner.png', { logoPath, scale: 0.07, leftPct: 0.44, topPct: 0.08 });
  await stamp('02-login-autologin-sian.png', { logoPath, scale: 0.07, leftPct: 0.44, topPct: 0.08 });
  console.log('done');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
