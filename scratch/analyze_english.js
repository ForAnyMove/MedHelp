const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');
const outputFile = path.join(__dirname, 'english_hardcoded.md');

// Matches basic English text: letters, spaces, basic punctuation.
// We require at least one lowercase english letter and one uppercase or just some word characters.
// To avoid matching code like `flexDirection`, `styles.container`, we ensure it has spaces or is a known UI prop,
// but finding text in JSX is better done by parsing or regexing JSX text nodes.

// Regex to find JSX text nodes: >Text here<
// It will match >  Something  <
const jsxTextRegex = />([^<>{]+)</g;

// Regex to find common props: title="Some text" or placeholder='Some text'
const propsRegex = /\b(title|placeholder|label|error|text|message|fallback|subtitle)=["']([^"']+[a-zA-Z]+[^"']*)["']/g;

const results = {};

function isEnglishText(text) {
  // Trim and check if it has alphabet characters
  const trimmed = text.trim();
  if (!trimmed) return false;
  // Ignore single characters or purely numeric/symbol strings
  if (trimmed.length < 2) return false;
  // Ignore if it's purely uppercase (often constants, but could be text. let's be careful)
  // Ignore camelCase or snake_case
  if (/^[a-z]+[A-Z][a-zA-Z]*$/.test(trimmed)) return false; // camelCase
  if (/^[a-zA-Z_]+$/.test(trimmed) && trimmed.includes('_')) return false; // snake_case
  if (/^[A-Z\-]+$/.test(trimmed)) return false; // UPPER-CASE-ID
  
  // Must contain some english alphabet
  if (!/[a-zA-Z]/.test(trimmed)) return false;
  
  // If it's something like "2024" or "10%" it was already caught by not having alphabet.
  // We want to avoid catching code snippets that accidentally made it here
  return true;
}

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let match;
  let fileMatches = new Set();
  
  const lines = content.split('\n');
  
  // Search for JSX text
  while ((match = jsxTextRegex.exec(content)) !== null) {
    const text = match[1].trim();
    if (isEnglishText(text)) {
      // ignore if it's already cyrillic (we did that)
      if (/[А-Яа-яЁё]/.test(text)) continue;
      
      // Let's find line number
      const index = match.index;
      const lineNo = content.substring(0, index).split('\n').length;
      fileMatches.add(`Line ${lineNo}: JSX Text: "${text}"`);
    }
  }

  // Search for Props
  while ((match = propsRegex.exec(content)) !== null) {
    const text = match[2].trim();
    if (isEnglishText(text)) {
      if (/[А-Яа-яЁё]/.test(text)) continue;
      const index = match.index;
      const lineNo = content.substring(0, index).split('\n').length;
      fileMatches.add(`Line ${lineNo}: Prop (${match[1]}): "${text}"`);
    }
  }

  // Find strings passed to Alert.alert('Title', 'Message')
  // We'll just do a simple search for Alert.alert(
  const alertRegex = /Alert\.alert\(\s*['"`]([^'"`]+)['"`](?:\s*,\s*['"`]([^'"`]+)['"`])?/g;
  while ((match = alertRegex.exec(content)) !== null) {
      const title = match[1];
      const msg = match[2];
      const index = match.index;
      const lineNo = content.substring(0, index).split('\n').length;
      
      if (title && isEnglishText(title) && !/[А-Яа-яЁё]/.test(title)) {
          fileMatches.add(`Line ${lineNo}: Alert Title: "${title}"`);
      }
      if (msg && isEnglishText(msg) && !/[А-Яа-яЁё]/.test(msg)) {
          fileMatches.add(`Line ${lineNo}: Alert Msg: "${msg}"`);
      }
  }

  if (fileMatches.size > 0) {
    results[filePath] = Array.from(fileMatches);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      // ignore locales and components/ui if we want, but let's check everywhere
      if (file !== 'locales' && file !== 'node_modules') {
        walkDir(filePath);
      }
    } else if (/\.(js|jsx|ts|tsx)$/.test(file)) {
      processFile(filePath);
    }
  }
}

walkDir(srcDir);

let output = '# Hardcoded English Text\n\n';
for (const [file, matches] of Object.entries(results)) {
  const relativePath = path.relative(__dirname, file);
  output += `## ${relativePath}\n`;
  for (const match of matches) {
    output += `- ${match}\n`;
  }
  output += '\n';
}

fs.writeFileSync(outputFile, output, 'utf8');
console.log('Analysis saved to ' + outputFile);
