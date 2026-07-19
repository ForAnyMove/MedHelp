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

let filesNeedingFix = [];

for (const file of allFiles) {
  const content = fs.readFileSync(file, 'utf8');
  
  // Find all occurrences of "colors." that are NOT preceded by a dot or word char
  // e.g. " colors.", "(colors.", "{colors.", "=colors."
  const hasNakedColors = /(^|[^.\w])colors\./.test(content);
  
  if (hasNakedColors) {
    // Check if colors is declared:
    // "const colors ="
    // "let colors ="
    // "var colors ="
    // "{ colors }"
    // "{ colors,"
    // ", colors }"
    // " colors:" (in some contexts, but usually destructuring is { colors } or { themeController: { colors } })
    // "colors = "
    
    // A simpler heuristic: if the word "colors" appears exactly, and is used as a standalone identifier.
    // Actually, just check if `colors` is destructured or defined
    const isDeclared = /const\s+[^=]*\bcolors\b[^=]*=/.test(content) || 
                       /let\s+[^=]*\bcolors\b[^=]*=/.test(content) || 
                       /import\s+[^'"]*\bcolors\b[^'"]*from/.test(content) ||
                       /function\s+\w+\s*\([^)]*\bcolors\b/.test(content) ||
                       /(\(\s*|\{\s*|\,\s*)\bcolors\b\s*(\)|\}|,)/.test(content);
                       
    // If we have `colors.` but no obvious declaration
    if (!isDeclared) {
      filesNeedingFix.push(file);
    }
  }
}

console.log('Files potentially missing colors definition:');
filesNeedingFix.forEach(f => console.log(f.replace(__dirname, '')));
