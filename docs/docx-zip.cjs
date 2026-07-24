const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

async function zipDir(srcDir, outFile) {
  const zip = new JSZip();
  function walk(dir, base = '') {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      const rel = base ? `${base}/${name}` : name;
      if (fs.statSync(full).isDirectory()) walk(full, rel);
      else zip.file(rel.replace(/\\/g, '/'), fs.readFileSync(full));
    }
  }
  walk(srcDir);
  const buf = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
  fs.writeFileSync(outFile, buf);
  return buf.length;
}

async function unzipDocx(docxPath, destDir) {
  const zip = await JSZip.loadAsync(fs.readFileSync(docxPath));
  fs.mkdirSync(destDir, { recursive: true });
  for (const [name, entry] of Object.entries(zip.files)) {
    if (entry.dir) continue;
    const out = path.join(destDir, name.replace(/\//g, path.sep));
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, await entry.async('nodebuffer'));
  }
}

module.exports = { zipDir, unzipDocx };
