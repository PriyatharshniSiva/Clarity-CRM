const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        if (file === 'node_modules' || file === '.git' || file === 'dist' || file === '.next' || file.endsWith('.db') || file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.svg') || file.endsWith('.ico')) return;
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.html') || file.endsWith('.json') || file.endsWith('.md')) {
                results.push(file);
            }
        }
    });
    return results;
}

const allFiles = walk(path.join(__dirname));

allFiles.forEach(file => {
    try {
        let content = fs.readFileSync(file, 'utf8');
        let original = content;
        
        content = content.replace(/Clarity/g, 'Clarity');
        content = content.replace(/clarity/g, 'clarity');
        content = content.replace(/Clarity/g, 'Clarity');
        content = content.replace(/clarity/g, 'clarity');
        content = content.replace(/Clarity/g, 'Clarity');
        content = content.replace(/clarity/g, 'clarity');

        if (content !== original) {
            fs.writeFileSync(file, content, 'utf8');
            console.log('Updated:', file);
        }
    } catch (e) {
        // Ignore read errors
    }
});
console.log('Rebranding complete.');
