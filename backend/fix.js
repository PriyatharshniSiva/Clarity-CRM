const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'controllers');
const files = fs.readdirSync(dir);

files.forEach(f => {
  if (f.endsWith('.js')) {
    const p = path.join(dir, f);
    let c = fs.readFileSync(p, 'utf8');
    c = c.replace(/,\s*mode:\s*['"]insensitive['"]/g, '');
    c = c.replace(/mode:\s*['"]insensitive['"]\s*,?/g, '');
    fs.writeFileSync(p, c, 'utf8');
  }
});
console.log('Fixed');
