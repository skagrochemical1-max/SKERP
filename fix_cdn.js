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
  
  // Remove the old CDN tag if it exists at the bottom
  content = content.replace('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>\n</body>', '</body>');
  content = content.replace('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>\r\n</body>', '</body>');
  content = content.replace('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script></body>', '</body>');
  
  // Add it to the <head> so it loads before any custom JS
  if (!content.includes('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>')) {
    content = content.replace('</head>', '  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>\n</head>');
    fs.writeFileSync(f, content, 'utf8');
    console.log('Fixed CDN placement in ' + f);
  }
});
