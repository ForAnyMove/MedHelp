const fs = require('fs');
const path = require('path');

const filesToFix = [
  'D:\\Portfolio\\MedHelp(RN)\\front\\MedHelp\\src\\screens\\CallScreen\\index.native.jsx',
  'D:\\Portfolio\\MedHelp(RN)\\front\\MedHelp\\src\\screens\\doctor\\consultation\\components\\AvailabilityModal.jsx',
  'D:\\Portfolio\\MedHelp(RN)\\front\\MedHelp\\src\\screens\\doctor\\history\\extra-screens\\PatientProfileSubView.jsx',
  'D:\\Portfolio\\MedHelp(RN)\\front\\MedHelp\\src\\screens\\patient\\consultation\\extra-screens\\BookingDetails.jsx',
  'D:\\Portfolio\\MedHelp(RN)\\front\\MedHelp\\src\\screens\\patient\\consultation\\extra-screens\\ConsultationCalendar.jsx',
  'D:\\Portfolio\\MedHelp(RN)\\front\\MedHelp\\src\\screens\\patient\\history\\extra-screens\\DoctorProfileSubView.jsx',
  'D:\\Portfolio\\MedHelp(RN)\\front\\MedHelp\\src\\screens\\universal\\profile\\components\\ProfileItem.jsx'
];

const themeContextPath = 'D:\\Portfolio\\MedHelp(RN)\\front\\MedHelp\\src\\theme\\ThemeContext';

for (const file of filesToFix) {
  let content = fs.readFileSync(file, 'utf8');

  // Skip if it's already using sizes from useTheme (just in case)
  if (content.includes('const { sizes } = useTheme();') || content.includes('const { colors, sizes } = useTheme();')) {
     // Actually, if it's missing the var, we NEED to inject it somewhere. 
     // We will just do a targeted inject.
  }

  // 1. Inject import if useTheme is not imported
  if (!content.includes('useTheme')) {
    const relativePath = path.relative(path.dirname(file), themeContextPath).replace(/\\/g, '/');
    const importStatement = `import { useTheme } from '${relativePath}';\n`;
    const lastImportIndex = content.lastIndexOf('import ');
    const nextLineIndex = content.indexOf('\n', lastImportIndex);
    content = content.slice(0, nextLineIndex + 1) + importStatement + content.slice(nextLineIndex + 1);
  }

  // 2. Inject `const { sizes } = useTheme();` into the main component(s).
  content = content.replace(/(?:export )?(?:function ([A-Z][a-zA-Z0-9_]*)\s*\([^)]*\)\s*\{|const ([A-Z][a-zA-Z0-9_]*)\s*=\s*(?:\([^)]*\)|[a-zA-Z0-9_]+)\s*=>\s*\{)/g, (match) => {
    return `${match}\n  const { sizes } = useTheme();`;
  });

  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed and injected sizes into ' + file);
}
