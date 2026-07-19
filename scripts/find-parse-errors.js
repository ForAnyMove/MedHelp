const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');

const srcDir = path.join(__dirname, '..', 'src');

function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findFiles(filePath, fileList);
    } else if (filePath.match(/\.(js|jsx)$/)) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const allFiles = findFiles(srcDir);
let errorFiles = [];

for (const file of allFiles) {
  const content = fs.readFileSync(file, 'utf8');
  try {
    babel.parseSync(content, {
      filename: file,
      presets: ['@babel/preset-react']
    });
  } catch (e) {
    console.log(`\n=== ERROR IN: ${file} ===\n${e.message}`);
    errorFiles.push(file);
  }
}

console.log(`\nTotal files with parse errors: ${errorFiles.length}`);
fs.writeFileSync(path.join(__dirname, 'parse-errors.json'), JSON.stringify(errorFiles, null, 2));
