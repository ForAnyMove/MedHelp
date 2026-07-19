const fs = require('fs');

const filesToFix = [
  'D:\\Portfolio\\MedHelp(RN)\\front\\MedHelp\\src\\components\\common\\SubViewScreen.jsx',
  'D:\\Portfolio\\MedHelp(RN)\\front\\MedHelp\\src\\components\\doctor\\SlotPicker.jsx',
  'D:\\Portfolio\\MedHelp(RN)\\front\\MedHelp\\src\\components\\doctor-dashboard\\ConsultationCard.jsx',
  'D:\\Portfolio\\MedHelp(RN)\\front\\MedHelp\\src\\screens\\doctor\\balance\\extra-screens\\BalanceDashboard.jsx',
  'D:\\Portfolio\\MedHelp(RN)\\front\\MedHelp\\src\\screens\\doctor\\consultation\\components\\AvailabilityModal.jsx',
  'D:\\Portfolio\\MedHelp(RN)\\front\\MedHelp\\src\\screens\\doctor\\consultation\\extra-screens\\DoctorConsultationForm.jsx',
  'D:\\Portfolio\\MedHelp(RN)\\front\\MedHelp\\src\\screens\\doctor\\consultation\\extra-screens\\DoctorConsultationSummary.jsx',
  'D:\\Portfolio\\MedHelp(RN)\\front\\MedHelp\\src\\screens\\doctor\\consultation\\extra-screens\\OngoingConsultation.jsx',
  'D:\\Portfolio\\MedHelp(RN)\\front\\MedHelp\\src\\screens\\doctor\\history\\extra-screens\\CompletedConsultation.jsx',
  'D:\\Portfolio\\MedHelp(RN)\\front\\MedHelp\\src\\screens\\doctor\\history\\extra-screens\\DoctorRatings.jsx',
  'D:\\Portfolio\\MedHelp(RN)\\front\\MedHelp\\src\\screens\\patient\\consultation\\extra-screens\\PatientActiveConsultation.jsx',
  'D:\\Portfolio\\MedHelp(RN)\\front\\MedHelp\\src\\screens\\patient\\history\\extra-screens\\DoctorProfileSubView.jsx',
  'D:\\Portfolio\\MedHelp(RN)\\front\\MedHelp\\src\\screens\\universal\\profile\\components\\MedicalProfileEdit.jsx',
  'D:\\Portfolio\\MedHelp(RN)\\front\\MedHelp\\src\\screens\\universal\\profile\\components\\ProfileSection.jsx',
  'D:\\Portfolio\\MedHelp(RN)\\front\\MedHelp\\src\\screens\\universal\\profile\\SettingsLanguageScreen.jsx'
];

for (const file of filesToFix) {
  let content = fs.readFileSync(file, 'utf8');
  let lines = content.split('\n');
  let insideThemeStyles = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect if we are inside themeStyles to avoid modifying it
    if (line.includes('const themeStyles = (theme)') || line.includes('const styles = (theme)')) {
      insideThemeStyles = true;
    }
    
    // Once we hit the end of the file or something, although themeStyles is usually at the bottom.
    // So if we are NOT inside themeStyles, and it's a JSX tag or inline style:
    if (!insideThemeStyles) {
      if (line.includes('theme.sizes') || line.includes('theme.colors') || line.includes('theme.80')) {
         // It's a mistake introduced by our refactoring!
         lines[i] = line.replace(/theme\.sizes/g, 'sizes').replace(/theme\.colors/g, 'colors').replace(/theme\.([0-9]+)/g, 'sizes.scale($1)');
         console.log(`Fixed line ${i + 1} in ${file}`);
      }
    }
  }

  fs.writeFileSync(file, lines.join('\n'), 'utf8');
}
