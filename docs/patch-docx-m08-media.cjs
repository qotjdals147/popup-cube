/**
 * docx 내 m08 이미지(image9.png)만 교체 — 전체 재생성 없음
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DOCX = path.join(__dirname, '온라인-팝업스토어-플랫폼-시안.docx');
const M08 = path.join(__dirname, 'pdf-assets', 'm08-shop-panel-mobile.png');
const TMP = path.join(__dirname, '_docx_m08_tmp');
const EXTRACTED = path.join(TMP, 'extracted');
const TARGET = path.join(EXTRACTED, 'word', 'media', 'image9.png');

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
  const ZIP = path.join(TMP, 'patched.zip');
  try {
    fs.unlinkSync(ZIP);
  } catch {}
  const ps = `Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::CreateFromDirectory('${EXTRACTED.replace(/'/g, "''")}', '${ZIP.replace(/'/g, "''")}', [System.IO.Compression.CompressionLevel]::Optimal, $false)`;
  execSync(`powershell -NoProfile -Command "${ps}"`, { stdio: 'inherit' });
  fs.copyFileSync(ZIP, DOCX);
}

unzip();
fs.copyFileSync(M08, TARGET);
zipBack();
console.log('OK replaced docx media/image9.png only');
