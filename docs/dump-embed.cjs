const fs = require('fs');
const xml = fs.readFileSync('_docx_broken/e/word/document.xml', 'utf8');
const i = xml.indexOf('r:embed="rId6"');
console.log(xml.slice(i, i + 1500));
