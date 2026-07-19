const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findFiles(filePath, fileList);
    } else if (filePath.match(/\.(js|jsx|ts|tsx)$/)) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const allFiles = findFiles(srcDir);

for (const file of allFiles) {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Replace duplicate lines exactly
  content = content.replace(/const\s+\{\s*sizes\s*\}\s*=\s*useTheme\(\);\s*const\s+\{\s*sizes,\s*colors\s*\}\s*=\s*useTheme\(\);/g, 'const { sizes, colors } = useTheme();');
  content = content.replace(/const\s+\{\s*sizes\s*\}\s*=\s*useTheme\(\);\s*const\s+\{\s*colors,\s*sizes\s*\}\s*=\s*useTheme\(\);/g, 'const { sizes, colors } = useTheme();');

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed', file.replace(__dirname, ''));
  }
}

console.log('Done.');
