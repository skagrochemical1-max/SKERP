
const fs = require('fs');
const content = fs.readFileSync('assets/formulations-build/index-QRE1HHUV.js', 'utf8');
const idx = content.indexOf('fetch(${Ht}/formulations)');
if (idx !== -1) {
    console.log(content.substring(idx, idx + 450));
} else {
    console.log('Not found');
}

