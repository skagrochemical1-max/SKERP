const fs = require('fs');
function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = dir + '/' + file;
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory() && !fullPath.includes('node_modules') && !fullPath.includes('.git')) {
      results = results.concat(walkDir(fullPath));
    } else if (fullPath.endsWith('.html')) {
      results.push(fullPath);
    }
  });
  return results;
}
const files = walkDir('.');
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  if (!content.includes('manifest.json')) {
    const isRoot = f.split('/').length === 2; // e.g. ./index.html
    const pathPrefix = isRoot ? './' : '../';
    const linkStr = '<link rel="manifest" href="' + pathPrefix + 'manifest.json">\n  <meta name="theme-color" content="#10B981">\n';
    content = content.replace('</head>', linkStr + '</head>');
    fs.writeFileSync(f, content, 'utf8');
    console.log('Added manifest to', f);
  }
});
