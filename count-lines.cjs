const fs = require('fs');
const path = require('path');

function countLines(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      countLines(fullPath);
    } else if (file.endsWith('.js') || file.endsWith('.html')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n').length;
      if (lines > 500) {
        console.log(fullPath + ' -> ' + lines + ' baris');
      }
    }
  }
}
countLines('js');
countLines('.');
