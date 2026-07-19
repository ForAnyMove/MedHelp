const fs = require('fs');
const path = require('path');
const iconNames = new Set();

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (/\.(js|jsx|tsx|ts)$/.test(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      let match;
      const regex1 = /<Icon[^>]*?name=[\"']([A-Z][a-zA-Z0-9_]*)[\"']/g;
      while ((match = regex1.exec(content)) !== null) {
        iconNames.add(match[1]);
      }
      
      const regex2 = /<Icon[^>]*?name=\{\s*[\"']([A-Z][a-zA-Z0-9_]*)[\"']\s*\}/g;
      while ((match = regex2.exec(content)) !== null) {
        iconNames.add(match[1]);
      }
      
      const regex3 = /(?:const|let|var)\s+[a-zA-Z0-9_]*\s*=\s*[\"']([A-Z][a-zA-Z0-9_]*)[\"']/g;
      while ((match = regex3.exec(content)) !== null) {
        if (['Calendar', 'Clock', 'ChevronRight', 'Star', 'FileText', 'MessageSquare', 'Stethoscope', 'CalendarX', 'ArrowLeft', 'Mic', 'MicOff', 'Video', 'VideoOff', 'PhoneOff', 'Circle', 'MoreHorizontal', 'X', 'CreditCard'].includes(match[1])) {
             iconNames.add(match[1]);
        }
      }
      
      const regex4 = /icon:\s*[\"']([A-Z][a-zA-Z0-9_]*)[\"']/g;
      while ((match = regex4.exec(content)) !== null) {
        iconNames.add(match[1]);
      }
    }
  }
}

walk(path.join(__dirname, 'src'));
console.log(Array.from(iconNames).sort().join('\n'));
