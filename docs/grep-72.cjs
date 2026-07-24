const fs = require('fs');
const x = fs.readFileSync('_docx_work/extracted/word/document.xml', 'utf8');
const i = x.indexOf('7-3. 착용 상품');
const j = x.indexOf('7-4. 구매와 장착');
console.log(x.slice(i, j).replace(/<w:p[^>]*>/g, '\n---\n').replace(/<[^>]+>/g, ''));
