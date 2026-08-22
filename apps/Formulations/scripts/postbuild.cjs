const fs = require('fs');
const path = require('path');

const srcHtml = path.join(__dirname, '../dist/index.html');
const destHtml = path.join(__dirname, '../../../pages/formulations.html');
const srcAssetsDir = path.join(__dirname, '../dist/assets');
const destAssetsDir = path.join(__dirname, '../../../assets/formulations-build');

console.log('Running postbuild copy script...');

// 1. Copy index.html to pages/formulations.html
if (fs.existsSync(srcHtml)) {
  let html = fs.readFileSync(srcHtml, 'utf8');
  
  // Replace the default asset paths with the correct relative paths inside ERP
  html = html.replace(/href="\.\/assets\//g, 'href="../assets/formulations-build/');
  html = html.replace(/src="\.\/assets\//g, 'src="../assets/formulations-build/');
  html = html.replace(/href="\/assets\//g, 'href="../assets/formulations-build/');
  html = html.replace(/src="\/assets\//g, 'src="../assets/formulations-build/');
  
  // Inject standard ERP CSS styles into head so layout/sidebar and grids render correctly
  const stylesheetInjection = `
    <link rel="stylesheet" href="../assets/css/style.css?v=41">
    <link rel="stylesheet" href="../assets/css/dashboard.css?v=41">
    <link rel="stylesheet" href="../assets/css/tables.css?v=41">
    <link rel="stylesheet" href="../assets/css/forms.css?v=41">
    <link rel="stylesheet" href="../assets/css/responsive.css?v=41">
  `;
  html = html.replace('</head>', stylesheetInjection + '</head>');

  // Inject the ERP layout wrapper and the shared layout scripts
  const injection = `
  <div class="app-layout" id="app-layout">
    <script src="../assets/js/shared-layout.js?v=41"></script>
    <script>
      document.addEventListener('DOMContentLoaded', () => {
        LAYOUT.injectLayout('Production / Batch', 'Production / Batch');
        
        // Highlight active navigation menu item
        const path = window.location.pathname.split('/').pop() || 'dashboard.html';
        document.querySelectorAll('.nav-item').forEach(item => {
          const href = item.getAttribute('href') || '';
          item.classList.toggle('active', href === path);
        });
      });
    </script>
    <main class="main-content" id="main-content">
      <div class="page-body">
  `;
  
  const closingInjection = `
      </div>
    </main>
  </div>
  `;

  // Place the React mount point inside the ERP layout wrapper
  html = html.replace('<body>', '<body>' + injection);
  html = html.replace('</body>', closingInjection + '</body>');

  fs.writeFileSync(destHtml, html);
  console.log(`✓ Injected ERP layouts, stylesheets, and copied index.html to pages/formulations.html`);
} else {
  console.error(`Error: dist/index.html not found!`);
  process.exit(1);
}

// 2. Ensure destAssetsDir exists and clean it
if (fs.existsSync(destAssetsDir)) {
  fs.rmSync(destAssetsDir, { recursive: true, force: true });
}
fs.mkdirSync(destAssetsDir, { recursive: true });

// 3. Copy assets files
if (fs.existsSync(srcAssetsDir)) {
  const files = fs.readdirSync(srcAssetsDir);
  files.forEach(file => {
    fs.copyFileSync(path.join(srcAssetsDir, file), path.join(destAssetsDir, file));
  });
  console.log(`✓ Copied ${files.length} assets to assets/formulations-build`);
} else {
  console.warn(`Warning: dist/assets not found.`);
}
