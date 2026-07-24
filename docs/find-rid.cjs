const fs = require('fs');
const path = require('path');
const rels = fs.readFileSync(
  path.join(__dirname, '_docx_media_tmp/extracted/word/_rels/document.xml.rels'),
  'utf8'
);
const m = rels.match(/Id="rId17"[^>]+Target="([^"]+)"/);
console.log('rId17 ->', m && m[1]);
