const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, 'src');

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (/\.(js|jsx|ts|tsx)$/.test(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('StyleSheet.create') && content.includes('theme.sizes.scale')) {
        console.log(fullPath);
      }
    }
  }
}

walk(targetDir);
