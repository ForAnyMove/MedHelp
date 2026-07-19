const fs = require('fs');
const path = require('path');

const ruJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/locales/ru.json'), 'utf8'));

function flatten(obj, prefix = '') {
  let res = {};
  for (const k in obj) {
    if (typeof obj[k] === 'object' && obj[k] !== null) {
      Object.assign(res, flatten(obj[k], prefix + k + '.'));
    } else {
      res[prefix + k] = obj[k];
    }
  }
  return res;
}

const existingKeys = flatten(ruJson);

const srcDirs = [path.join(__dirname, '../src/screens'), path.join(__dirname, '../src/components')];

const tRegex = /t\(\s*['"]([a-zA-Z0-9_\-\.]+)['"]/g;

const missing = new Set();
const usages = {};

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let match;
  while ((match = tRegex.exec(content)) !== null) {
    const key = match[1];
    if (!existingKeys[key] && !key.includes('{{') && key !== 'error' && key !== 'success') {
      missing.add(key);
      if (!usages[key]) usages[key] = [];
      usages[key].push(filePath);
    }
  }
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (/\.(js|jsx|ts|tsx)$/.test(file)) {
      processFile(filePath);
    }
  }
}

srcDirs.forEach(walkDir);

console.log('Missing keys:');
for (const key of missing) {
  console.log(key + ' -> ' + path.relative(__dirname, usages[key][0]));
}
