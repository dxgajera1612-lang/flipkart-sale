const fs = require('fs');
const path = require('path');

function walk(dir) {
  fs.readdirSync(dir).forEach(file => {
    const p = path.join(dir, file);
    if (fs.statSync(p).isDirectory()) {
      walk(p);
    } else if (p.endsWith('.js')) {
      const content = fs.readFileSync(p, 'utf8');
      const matches = content.match(/fbq\s*\(\s*['"]track['"]\s*,\s*['"]([^'"]+)['"]/g);
      if (matches) {
        console.log(p, '->', matches);
      }
    }
  });
}

console.log("Checking all Meta Pixel events tracked in project:");
walk('./src');
