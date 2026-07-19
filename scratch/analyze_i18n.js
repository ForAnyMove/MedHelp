const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');
const ruLocalePath = path.join(srcDir, 'locales/ru.json');

const ruJson = JSON.parse(fs.readFileSync(ruLocalePath, 'utf8'));

// Helper to check if key exists in nested JSON
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
  
  // 1. Find Cyrillic characters outside of comments
  // Removing comments roughly (single and multi-line)
  const noComments = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
  
  if (/[А-Яа-яЁё]/.test(noComments)) {
    filesWithCyrillic.push(filePath);
  }

  // 2. Find t('key') or t("key") or t(`key`)
  const tRegex = /\bt\(\s*['"`]([^'"`]+)['"`]/g;
  let match;
  while ((match = tRegex.exec(content)) !== null) {
    const key = match[1];
    if (!keyExists(ruJson, key) && !missingTranslationKeys.some(k => k.key === key)) {
      missingTranslationKeys.push({ key, file: filePath });
    }
  }
}

walkDir(srcDir);

console.log('--- FILES WITH CYRILLIC ---');
filesWithCyrillic.forEach(f => console.log(f.replace(srcDir, '')));
console.log('\n--- MISSING TRANSLATION KEYS ---');
missingTranslationKeys.forEach(k => console.log(`${k.key} (in ${k.file.replace(srcDir, '')})`));
