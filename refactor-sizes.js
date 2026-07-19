const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, 'src');

const dimensionProps = [
  'width', 'height', 'minWidth', 'maxWidth', 'minHeight', 'maxHeight',
  'margin', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight', 'marginVertical', 'marginHorizontal',
  'padding', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight', 'paddingVertical', 'paddingHorizontal',
  'top', 'bottom', 'left', 'right',
  'gap', 'rowGap', 'columnGap',
  'borderRadius', 'borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomLeftRadius', 'borderBottomRightRadius',
  'fontSize', 'lineHeight'
];

const propsRegex = new RegExp('(\\b(?:' + dimensionProps.join('|') + '))\\s*:\\s*(-?\\d+(?:\\.\\d+)?)\\b', 'g');

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
  let newContent = originalContent;
  
  // We want to replace properties ONLY inside style objects.
  // A reasonable heuristic is to replace matching props if they look like object properties.
  // This regex matches exactly 'prop: number' with optional spaces.
  newContent = newContent.replace(propsRegex, (match, prop, numberStr) => {
    // If it's already 0, we can leave it as 0 or scale it. Usually 0 is fine without scale, but let's scale it to be safe, or skip.
    // Let's replace all to be consistent, wait, 0 is fine as 0 but scale(0) is also 0. Let's just scale it.
    
    // Check if we are inside a file that has `theme.sizes.scale` available.
    // Actually, we'll blindly replace with `theme.sizes.scale(NUMBER)` and then manually fix the imports if needed.
    return `${prop}: theme.sizes.scale(${numberStr})`;
  });

  if (newContent !== originalContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Modified: ${filePath}`);
    modifiedFiles++;
  }
}

walk(targetDir);
console.log(`\nFinished! Modified ${modifiedFiles} files.`);
