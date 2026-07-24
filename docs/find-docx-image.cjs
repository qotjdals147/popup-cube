const fs = require('fs');
const path = require('path');
const x = fs.readFileSync(
  path.join(__dirname, '_docx_media_tmp/extracted/word/document.xml'),
  'utf8'
);
for (const k of ['매장 전체 상품 목록', '5-1', '전체 상품 ·']) {
  const i = x.indexOf(k);
  console.log(k, i);
  if (i > 0) {
    const chunk = x.slice(i - 3000, i + 500);
    const embeds = [...chunk.matchAll(/r:embed="([^"]+)"/g)].map((m) => m[1]);
    console.log('embeds before caption:', embeds.slice(-2));
  }
}
