const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'pages');
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.html'));

function processHtmlFile(filePath, isRoot) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix encoding artifact and rename to S K ERP
    // Example: <title>S K Agro Chemical â€” Dashboard</title> -> <title>S K ERP - Dashboard</title>
    content = content.replace(/<title>.*?Chemical.*?([A-Za-z\s]+)<\/title>/g, (match, p1) => {
        let pageName = p1.replace(/â€”/g, '').replace(/â€“/g, '').replace(/—/g, '').trim();
        if (pageName.toLowerCase() === 'loading' || pageName === '') pageName = 'Loading';
        return `<title>S K ERP - ${pageName}</title>`;
    });

    // Fallback if regex didn't catch due to previous replacements
    content = content.replace(/<title>S K Agro Chemical.*?<\/title>/g, `<title>S K ERP</title>`);
    
    // Add favicon if not exists
    const iconPath = isRoot ? './assets/images/sk-logo.jpg' : '../assets/images/sk-logo.jpg';
    if (!content.includes('rel="icon"')) {
        content = content.replace('</head>', `\n  <link rel="icon" type="image/jpeg" href="${iconPath}">\n</head>`);
    }

    fs.writeFileSync(filePath, content, 'utf8');
}

files.forEach(file => {
    processHtmlFile(path.join(pagesDir, file), false);
});

// Process index.html at root
const rootIndex = path.join(__dirname, 'index.html');
if (fs.existsSync(rootIndex)) {
    processHtmlFile(rootIndex, true);
}

// Update manifest.json
const manifestPath = path.join(__dirname, 'manifest.json');
if (fs.existsSync(manifestPath)) {
    let manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    manifest.name = "S K ERP";
    manifest.short_name = "S K ERP";
    // Ensure icons have purpose to satisfy PWA criteria perfectly
    manifest.icons.forEach(icon => {
       icon.purpose = "any maskable";
    });
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
}

console.log('HTML titles, favicons, and manifest updated successfully.');
