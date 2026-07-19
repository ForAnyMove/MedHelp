const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const themeManagerPath = path.join(srcDir, 'managers', 'themeManager.js');

const colorMap = {
  '#23D3C2': 'p500',
  '#4EE6D8': 'p400',
  '#84F2E8': 'p300',
  '#CEF9F1': 'p200',
  '#E6FAF8': 'p100',
  '#FF7062': 'sCoral',
  '#FFCF65': 'sYell',
  '#47A4FF': 'sBlue',
  '#FF5EA4': 'sPink',
  '#FB5607': 'sCoral2',
  '#FFBE0B': 'sYell2',
  '#3A86FF': 'sBlue2',
  '#FF006E': 'sPink2',
  '#151515': 'n900',
  '#0D4036': 'n700',
  '#8FA3A0': 'n500',
  '#C5CFCD': 'n400',
  '#DCE9E8': 'n300',
  '#EEF6F5': 'n200',
  '#F6FAFB': 'n100',
  '#4D4D4D': 'sn700',
  '#8F9BA3': 'sn500',
  '#DCE4E9': 'sn300',
  '#FFFFFF': 'white',
  '#FFF': 'white',
  '#F3F9FE': 'bg',
  '#3CC480': 'success',
  '#FFB547': 'warning',
  '#FF6B6B': 'danger',
  '#4A9CFF': 'info',
  '#FFDFED': 'pinkBorder',
  '#40DDCC33': 'opacityP400',
};

// Map short hex to long hex for easier comparison, or just normalize
function normalizeColor(color) {
  let c = color.toUpperCase().replace(/\s/g, '');
  // Expand short hex e.g. #FFF -> #FFFFFF
  if (c.match(/^#[0-9A-F]{3}$/)) {
    c = '#' + c[1] + c[1] + c[2] + c[2] + c[3] + c[3];
  }
  return c;
}

const colorRegex = /(['"`])(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))\1/g;

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

let filesModified = 0;
let totalReplacements = 0;

for (const file of allFiles) {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content;
  
  const themeStylesIndex = content.indexOf('const themeStyles = (theme) =>');
  let hasModifications = false;

  newContent = content.replace(colorRegex, (match, quote, colorVal, offset) => {
    // We skip replacing if the color is already inside a comment
    // (This is a naive check, but usually sufficient)
    const prevText = content.substring(Math.max(0, offset - 30), offset);
    if (prevText.includes('/* TODO: color */')) {
      return match;
    }

    const normColor = normalizeColor(colorVal);
    let mappedName = colorMap[normColor];

    // Some specific loose matchings or known fallbacks
    if (!mappedName) {
      // Return with comment
      totalReplacements++;
      return `/* TODO: color */ ${match}`;
    }

    // It has a mapped name!
    totalReplacements++;
    
    // Determine context
    let prefix = 'colors.';
    if (themeStylesIndex !== -1 && offset > themeStylesIndex) {
      prefix = 'theme.colors.';
    }

    return `${prefix}${mappedName}`;
  });

  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    filesModified++;
  }
}

console.log(`Replacement complete. Modified ${filesModified} files with ${totalReplacements} total replacements.`);
