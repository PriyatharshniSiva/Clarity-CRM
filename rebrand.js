const fs = require('fs');
const path = require('path');

const walkSync = function(dir, filelist) {
  const files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (!['node_modules', '.git', 'dist'].includes(file)) {
        filelist = walkSync(fullPath, filelist);
      }
    }
    else {
      if (['.js', '.jsx', '.ts', '.tsx', '.css', '.html', '.json', '.env'].includes(path.extname(fullPath))) {
        filelist.push(fullPath);
      }
    }
  });
  return filelist;
};

const dirs = ['./frontend', './backend'];
const files = [];
dirs.forEach(d => {
  if(fs.existsSync(d)) {
    files.push(...walkSync(d));
  }
});

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  // Replace text
  content = content.replace(/INNOVEITY/g, 'CLARITY INFOTECH');
  content = content.replace(/Clarity/g, 'Clarity InfoTech');
  content = content.replace(/clarity/g, 'clarity-infotech');
  
  // Specific replacements for the CRM name (if MRF is used as the project name)
  content = content.replace(/MRF-crm/g, 'Clarity-CRM');
  
  // Replace CSS Variables in index.css
  if (file.endsWith('index.css')) {
    // Light Mode Primary
    content = content.replace(/--primary: 5, 122, 85;/g, '--primary: 56, 189, 248;');
    content = content.replace(/--primary-hover: 4, 106, 74;/g, '--primary-hover: 37, 99, 235;');
    
    // Dark Mode
    content = content.replace(/--background: 13, 19, 16;/g, '--background: 10, 14, 57;');
    content = content.replace(/--primary: 16, 185, 129;/g, '--primary: 56, 189, 248;');
    content = content.replace(/--primary-hover: 52, 211, 153;/g, '--primary-hover: 37, 99, 235;');
  }

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated: ${file}`);
  }
});
console.log('Rebranding script complete.');
