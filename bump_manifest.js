const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.git') processDir(fullPath);
        } else if (fullPath.endsWith('.html')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            content = content.replace(/href="\.\.\/manifest\.json"/g, 'href="../manifest.json?v=2"');
            content = content.replace(/href="\.\/manifest\.json"/g, 'href="./manifest.json?v=2"');
            content = content.replace(/href="manifest\.json"/g, 'href="manifest.json?v=2"');
            fs.writeFileSync(fullPath, content, 'utf8');
        }
    }
}
processDir(__dirname);
