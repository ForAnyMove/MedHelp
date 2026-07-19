const fs = require('fs');

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

for (const file of filesToFix) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/theme\.([0-9]+(?:\.[0-9]+)?)/g, 'theme.sizes.scale($1)');
  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed theme.NUMBER in ' + file);
}
