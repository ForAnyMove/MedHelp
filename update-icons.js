const fs = require('fs');
const path = require('path');

const map = {
  Activity: { name: 'loader-circle', size: 24, spin: true },
  AlertCircle: { name: 'warning' },
  ArrowLeft: { name: 'arrow-back' },
  Calendar: { name: 'calendar', size: 24 },
  ChevronRight: { name: 'arrow-right' },
  Circle: { name: 'record', size: 24 },
  Clock: { name: 'time', size: 24 },
  CreditCard: { name: 'price', size: 24 },
  Droplet: { name: 'Droplet' },
  FileText: { name: 'note', size: 24 },
  Loader: { name: 'loader-circle' },
  Maximize: { name: 'Maximize' },
  MessageSquare: { name: 'MessageSquare' },
  MicOff: { name: 'mic-off', size: 24 },
  Minimize2: { name: 'Minimize2' },
  MoreHorizontal: { name: 'MoreHorizontal' },
  Phone: { name: 'phone-on', size: 24 },
  PhoneOff: { name: 'phone-off', size: 24 },
  RefreshCcw: { name: 'RefreshCcw', size: 20 },
  Smartphone: { name: 'phone-on' },
  Star: { name: 'star' },
  Stethoscope: { name: 'stethoscope', size: 24 },
  Trash2: { name: 'Trash2' },
  Upload: { name: 'upload', size: 24 },
  User: { name: 'profile', size: 24 },
  X: { name: 'close', size: 24 }
};

let modifiedFiles = 0;

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (/\.(js|jsx|tsx|ts)$/.test(fullPath)) {
      processFile(fullPath);
    }
  }
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;

  // Pattern 1: <Icon name="OldName" ... />
  // We need to parse <Icon ... > properly because it can have multiple props.
  // Using a regex to match the Icon tag and then replacing within it.
  
  newContent = newContent.replace(/<Icon([\s\S]*?)\/?>/g, (match, propsStr) => {
    // Extract name
    const nameMatch = propsStr.match(/name=[\"']([A-Z][a-zA-Z0-9_]*)[\"']/);
    const nameExprMatch = propsStr.match(/name=\{\s*[\"']([A-Z][a-zA-Z0-9_]*)[\"']\s*\}/);
    
    const matchedName = nameMatch ? nameMatch[1] : (nameExprMatch ? nameExprMatch[1] : null);
    
    if (matchedName && map[matchedName]) {
      const spec = map[matchedName];
      let newPropsStr = propsStr;
      
      // Update name
      if (nameMatch) {
        newPropsStr = newPropsStr.replace(`name="${matchedName}"`, `name="${spec.name}"`).replace(`name='${matchedName}'`, `name="${spec.name}"`);
      } else {
        newPropsStr = newPropsStr.replace(nameExprMatch[0], `name="${spec.name}"`);
      }
      
      // Handle size replacement ONLY if a new size was specified by user (e.g. 24)
      if (spec.size) {
        // Find existing size prop
        const sizeMatch = newPropsStr.match(/size=\{([^}]+)\}/);
        const sizeNumberMatch = newPropsStr.match(/size=([0-9]+)/);
        
        if (sizeMatch) {
            // Already has size={...}
            // Replace with size={sizes.scale(spec.size)}
            newPropsStr = newPropsStr.replace(sizeMatch[0], `size={sizes.scale(${spec.size})}`);
        } else if (sizeNumberMatch) {
            newPropsStr = newPropsStr.replace(sizeNumberMatch[0], `size={sizes.scale(${spec.size})}`);
        } else {
            // No size prop exists, we inject it
            newPropsStr = newPropsStr + ` size={sizes.scale(${spec.size})}`;
        }
      }
      
      // Add spin prop if needed
      if (spec.spin && !newPropsStr.includes('spin')) {
        newPropsStr += ' spin={true}';
      }
      
      // Edge case: if we added props, ensure there's a space if needed, handled by injection.
      return `<Icon${newPropsStr}${match.endsWith('/>') ? ' />' : '>'}`;
    }
    
    return match;
  });
  
  // Also replace variable assignments if they match exactly
  // e.g. let iconName = 'Calendar';
  Object.keys(map).forEach(oldName => {
     const spec = map[oldName];
     // match assignments or object properties
     // e.g. icon: 'Calendar' -> icon: 'calendar'
     //      iconName = 'Calendar' -> iconName = 'calendar'
     // This is a bit risky globally, so we restrict it to specific patterns
     const re1 = new RegExp(`(icon|name|iconName|iconRight):\\s*[\"']${oldName}[\"']`, 'g');
     newContent = newContent.replace(re1, `$1: '${spec.name}'`);
     
     const re2 = new RegExp(`(icon|name|iconName|iconRight)\\s*=\\s*[\"']${oldName}[\"']`, 'g');
     newContent = newContent.replace(re2, `$1 = '${spec.name}'`);
     
     const re3 = new RegExp(`iconName\\s*===\\s*[\"']${oldName}[\"']`, 'g');
     newContent = newContent.replace(re3, `iconName === '${spec.name}'`);
  });

  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Updated icons in ${filePath}`);
    modifiedFiles++;
  }
}

walk(path.join(__dirname, 'src'));
console.log(`Finished updating ${modifiedFiles} files.`);
