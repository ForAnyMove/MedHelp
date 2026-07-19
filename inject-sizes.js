const fs = require('fs');
const path = require('path');

const filesToFix = [
  'D:\\Portfolio\\MedHelp(RN)\\front\\MedHelp\\src\\components\\common\\EmptyState.jsx',
  'D:\\Portfolio\\MedHelp(RN)\\front\\MedHelp\\src\\components\\common\\ErrorState.jsx',
  'D:\\Portfolio\\MedHelp(RN)\\front\\MedHelp\\src\\screens\\CallScreen\\index.native.jsx',
  'D:\\Portfolio\\MedHelp(RN)\\front\\MedHelp\\src\\screens\\chat\\ChatListScreen.native.jsx',
  'D:\\Portfolio\\MedHelp(RN)\\front\\MedHelp\\src\\screens\\doctor\\consultation\\extra-screens\\DoctorConsultationForm.jsx',
  'D:\\Portfolio\\MedHelp(RN)\\front\\MedHelp\\src\\screens\\doctor\\history\\extra-screens\\DoctorRatings.jsx',
  'D:\\Portfolio\\MedHelp(RN)\\front\\MedHelp\\src\\screens\\doctor\\history\\extra-screens\\PatientProfileSubView.jsx',
  'D:\\Portfolio\\MedHelp(RN)\\front\\MedHelp\\src\\screens\\patient\\consultation\\extra-screens\\BookingDetails.jsx',
  'D:\\Portfolio\\MedHelp(RN)\\front\\MedHelp\\src\\screens\\patient\\consultation\\extra-screens\\ConsultationCalendar.jsx',
  'D:\\Portfolio\\MedHelp(RN)\\front\\MedHelp\\src\\screens\\patient\\history\\components\\HealthMetricsCard.jsx',
  'D:\\Portfolio\\MedHelp(RN)\\front\\MedHelp\\src\\screens\\patient\\history\\components\\HistoryTimelineItem.jsx',
  'D:\\Portfolio\\MedHelp(RN)\\front\\MedHelp\\src\\screens\\patient\\history\\extra-screens\\DoctorProfileSubView.jsx',
  'D:\\Portfolio\\MedHelp(RN)\\front\\MedHelp\\src\\screens\\universal\\profile\\components\\MedicalProfileEdit.jsx'
];

const themeContextPath = 'D:\\Portfolio\\MedHelp(RN)\\front\\MedHelp\\src\\theme\\ThemeContext';

const jsxPropsRegex = /\b(size|width|height|padding|margin|gap|top|bottom|left|right)=\{([0-9]+(?:\.[0-9]+)?)\}/g;

for (const file of filesToFix) {
  let content = fs.readFileSync(file, 'utf8');

  // Skip if it's already using sizes from useTheme (just in case)
  if (content.includes('const { sizes } = useTheme();')) {
    continue;
  }

  // 1. Inject import if useTheme is not imported
  if (!content.includes('useTheme')) {
    const relativePath = path.relative(path.dirname(file), themeContextPath).replace(/\\/g, '/');
    const importStatement = `import { useTheme } from '${relativePath}';\n`;
    
    // Find the last import
    const lastImportIndex = content.lastIndexOf('import ');
    const nextLineIndex = content.indexOf('\n', lastImportIndex);
    content = content.slice(0, nextLineIndex + 1) + importStatement + content.slice(nextLineIndex + 1);
  }

  // 2. Inject `const { sizes } = useTheme();` into the main component(s).
  // A heuristic: find `export function ` or `function ` or `const XYZ = () =>` that are components.
  // We can just inject it right after the first '{' of functions that return JSX.
  
  // Since some files have multiple components, let's inject it into all React components in the file.
  // A component is usually capitalized. `function MyComponent` or `const MyComponent =`
  content = content.replace(/(?:export )?(?:function ([A-Z][a-zA-Z0-9_]*)\s*\([^)]*\)\s*\{|const ([A-Z][a-zA-Z0-9_]*)\s*=\s*(?:\([^)]*\)|[a-zA-Z0-9_]+)\s*=>\s*\{)/g, (match) => {
    return `${match}\n  const { sizes } = useTheme();`;
  });

  // 3. Replace JSX props
  content = content.replace(jsxPropsRegex, (match, prop, numberStr) => {
    return `${prop}={sizes.scale(${numberStr})}`;
  });

  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed and injected sizes into ' + file);
}

console.log('Done.');
