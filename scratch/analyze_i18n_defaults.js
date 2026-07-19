const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');

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
  
  // Find t('key', 'Default Russian Text')
  // We use a regex that captures the key and the optional default value
  const tRegex = /\bt\(\s*['"`]([^'"`]+)['"`](?:\s*,\s*['"`]([^'"`]+)['"`])?\s*\)/g;
  let match;
  while ((match = tRegex.exec(content)) !== null) {
    const key = match[1];
    const defaultValue = match[2] || '';
    missingTranslationKeys.push({ key, defaultValue, file: filePath });
  }
}

walkDir(srcDir);

let output = '## MISSING TRANSLATION KEYS WITH DEFAULTS\n\n';
missingTranslationKeys.forEach(k => {
  output += `- \`${k.key}\` | \`${k.defaultValue}\` | (in ${k.file.replace(srcDir, '')})\n`;
});

const outputPath = path.join(__dirname, 'i18n_keys_with_defaults.md');
fs.writeFileSync(outputPath, output, 'utf8');
