const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const themeManagerPath = path.join(srcDir, 'managers', 'themeManager.js');

const colorRegex = /#([0-9a-fA-F]{3,8})\b|rgba?\([^)]+\)/g;

function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findFiles(filePath, fileList);
    } else if (filePath.match(/\.(js|jsx|ts|tsx)$/) && filePath !== themeManagerPath) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const allFiles = findFiles(srcDir);
const colorsFound = new Set();
const colorOccurrences = {};

for (const file of allFiles) {
  const content = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = colorRegex.exec(content)) !== null) {
    const color = match[0].toUpperCase().replace(/\s/g, ''); // Normalize
    colorsFound.add(color);
    if (!colorOccurrences[color]) colorOccurrences[color] = 0;
    colorOccurrences[color]++;
  }
}

const sortedColors = Array.from(colorsFound).sort((a, b) => colorOccurrences[b] - colorOccurrences[a]);

console.log('Found colors:');
for (const c of sortedColors) {
  console.log(`${c}: ${colorOccurrences[c]} times`);
}
