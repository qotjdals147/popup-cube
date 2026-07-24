/**
 * Re-zip extracted docx with JSZip (forward slashes) — fixes Word broken-image (!) from PowerShell zip.
 */
const path = require('path');
const { zipDir } = require('./docx-zip.cjs');

const SRC_DIR = path.join(__dirname, process.argv[2] || '_docx_broken/e');
const OUT = path.join(__dirname, process.argv[3] || '온라인-팝업스토어-플랫폼-시안.docx');

(async () => {
  const size = await zipDir(SRC_DIR, OUT);
  console.log('OK rezip', OUT, size);
})();
