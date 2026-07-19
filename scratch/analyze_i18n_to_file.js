const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');
const ruLocalePath = path.join(srcDir, 'locales/ru.json');
const outputPath = path.join(__dirname, 'i18n_analysis.md');

const ruJson = JSON.parse(fs.readFileSync(ruLocalePath, 'utf8'));

function keyExists(obj, keyPath) {
  const keys = keyPath.split('.');
  let current = obj;
  for (const k of keys) {
    if (current === undefined || current === null) return false;
    current = current[k];
  }
  return current !== undefined;
}

const filesWithCyrillic = [];
const missingTranslationKeys = [];

function walkDir(dir) {
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

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  const noComments = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
  
  if (/[А-Яа-яЁё]/.test(noComments)) {
    filesWithCyrillic.push(filePath);
  }

  const tRegex = /\bt\(\s*['"`]([^'"`$]+)['"`]/g;
  let match;
  while ((match = tRegex.exec(content)) !== null) {
    const key = match[1];
    if (!keyExists(ruJson, key) && !missingTranslationKeys.some(k => k.key === key)) {
      missingTranslationKeys.push({ key, file: filePath });
    }
  }
}

walkDir(srcDir);

let output = '## FILES WITH CYRILLIC\n\n';
filesWithCyrillic.forEach(f => {
  output += `- ${f.replace(srcDir, '')}\n`;
});

output += '\n## MISSING TRANSLATION KEYS\n\n';
missingTranslationKeys.forEach(k => {
  output += `- \`${k.key}\` (in ${k.file.replace(srcDir, '')})\n`;
});

fs.writeFileSync(outputPath, output, 'utf8');
console.log('Analysis saved to', outputPath);
