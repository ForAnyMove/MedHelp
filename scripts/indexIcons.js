const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '../assets/icons');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.svg'));

let out = `// Generated automatically\n\nexport const CustomIcons = {\n`;
files.forEach(f => {
  const name = f.replace('.svg', '');
  out += `  '${name}': require('../../../assets/icons/${f}').default,\n`;
});
out += `};\n`;

fs.writeFileSync(path.join(__dirname, '../src/assets/icons/index.js'), out);
console.log('Done mapping SVGs!');
