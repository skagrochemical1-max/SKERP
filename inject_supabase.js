const fs = require('fs');
const path = require('path');

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory() && !file.includes('node_modules')) {
      results = results.concat(walkDir(file));
    } else {
      if (file.endsWith('.html')) results.push(file);
    }
  });
  return results;
}

const files = walkDir('.');
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  if (!content.includes('@supabase/supabase-js')) {
    content = content.replace('</body>', '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>\n</body>');
    fs.writeFileSync(f, content, 'utf8');
    console.log('Updated ' + f);
  }
});
