const fs = require('fs');

const modifiedFiles = [
  'D:\\Portfolio\\MedHelp(RN)\\front\\MedHelp\\src\\components\\common\\EmptyState.jsx',
  'D:\\Portfolio\\MedHelp(RN)\\front\\MedHelp\\src\\components\\common\\ErrorState.jsx',
  'D:\\Portfolio\\MedHelp(RN)\\front\\MedHelp\\src\\components\\doctor\\SlotPicker.jsx',
  'D:\\Portfolio\\MedHelp(RN)\\front\\MedHelp\\src\\components\\patient-dashboard\\HealthOverview.jsx',
  'D:\\Portfolio\\MedHelp(RN)\\front\\MedHelp\\src\\components\\patient-dashboard\\LabResultsBanner.jsx',
  'D:\\Portfolio\\MedHelp(RN)\\front\\MedHelp\\src\\screens\\CallScreen\\index.native.jsx',
  'D:\\Portfolio\\MedHelp(RN)\\front\\MedHelp\\src\\screens\\CallScreen\\index.web.jsx',
  'D:\\Portfolio\\MedHelp(RN)\\front\\MedHelp\\src\\screens\\chat\\ChatListScreen.native.jsx',
  'D:\\Portfolio\\MedHelp(RN)\\front\\MedHelp\\src\\screens\\doctor\\consultation\\extra-screens\\DoctorConsultationForm.jsx',
  'D:\\Portfolio\\MedHelp(RN)\\front\\MedHelp\\src\\screens\\doctor\\history\\extra-screens\\DoctorRatings.jsx',
  'D:\\Portfolio\\MedHelp(RN)\\front\\MedHelp\\src\\screens\\doctor\\history\\extra-screens\\PatientProfileSubView.jsx',
  'D:\\Portfolio\\MedHelp(RN)\\front\\MedHelp\\src\\screens\\patient\\consultation\\extra-screens\\BookingDetails.jsx',
  'D:\\Portfolio\\MedHelp(RN)\\front\\MedHelp\\src\\screens\\patient\\consultation\\extra-screens\\ConsultationCalendar.jsx',
  'D:\\Portfolio\\MedHelp(RN)\\front\\MedHelp\\src\\screens\\patient\\history\\components\\HealthMetricsCard.jsx',
  'D:\\Portfolio\\MedHelp(RN)\\front\\MedHelp\\src\\screens\\patient\\history\\components\\HistoryTimelineItem.jsx',
  'D:\\Portfolio\\MedHelp(RN)\\front\\MedHelp\\src\\screens\\patient\\history\\extra-screens\\DoctorProfileSubView.jsx',
  'D:\\Portfolio\\MedHelp(RN)\\front\\MedHelp\\src\\screens\\patient\\history\\HistoryTab.jsx',
  'D:\\Portfolio\\MedHelp(RN)\\front\\MedHelp\\src\\screens\\universal\\profile\\components\\MedicalProfileEdit.jsx'
];

for (const file of modifiedFiles) {
  const content = fs.readFileSync(file, 'utf8');
  // Check if sizes is extracted or passed as argument
  // e.g. const { sizes } = useTheme(); or (sizes) => 
  if (!/(sizes\s*=|sizes\s*,|sizes\s*:|\{\s*sizes\s*\}|sizes\)|sizes\])/.test(content)) {
    console.log('WARNING: sizes might be undefined in ' + file);
  }
}
