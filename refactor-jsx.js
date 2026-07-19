const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, 'src');

const jsxPropsRegex = /\b(size|width|height|padding|margin|gap|top|bottom|left|right)=\{([0-9]+(?:\.[0-9]+)?)\}/g;

let modifiedFiles = 0;

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath);
    } else if (/\.(js|jsx|ts|tsx)$/.test(fullPath)) {
      processFile(fullPath);
    }
  }
}

function processFile(filePath) {
  const originalContent = fs.readFileSync(filePath, 'utf8');
  let newContent = originalContent.replace(jsxPropsRegex, (match, prop, numberStr) => {
    return `${prop}={sizes.scale(${numberStr})}`;
  });

  if (newContent !== originalContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Modified: ${filePath}`);
    modifiedFiles++;
  }
}

walk(targetDir);
console.log(`\nFinished! Modified ${modifiedFiles} files.`);
