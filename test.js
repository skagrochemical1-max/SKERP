
const fs = require('fs');
const content = fs.readFileSync('assets/formulations-build/index-QRE1HHUV.js', 'utf8');
const idx = content.indexOf('ingredients:(e.ingredients||[]).m');
console.log(content.substring(idx, idx + 250));

