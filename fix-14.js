const fs = require('fs');

const filesToRevert = [
  'D:\\Portfolio\\MedHelp(RN)\\front\\MedHelp\\src\\components\\chat\\ChatFloatingButton.jsx',
  'D:\\Portfolio\\MedHelp(RN)\\front\\MedHelp\\src\\components\\Stream\\CallOverlay\\index.native.jsx',
  'D:\\Portfolio\\MedHelp(RN)\\front\\MedHelp\\src\\components\\Stream\\CallOverlay\\index.web.jsx',
  'D:\\Portfolio\\MedHelp(RN)\\front\\MedHelp\\src\\components\\ui\\InAppNotification.jsx',
  'D:\\Portfolio\\MedHelp(RN)\\front\\MedHelp\\src\\context\\GlobalContext.js',
  'D:\\Portfolio\\MedHelp(RN)\\front\\MedHelp\\src\\screens\\CallScreen\\index.native.jsx',
  'D:\\Portfolio\\MedHelp(RN)\\front\\MedHelp\\src\\screens\\CallScreen\\index.web.jsx',
  'D:\\Portfolio\\MedHelp(RN)\\front\\MedHelp\\src\\screens\\chat\\ChatListScreen.native.jsx',
  'D:\\Portfolio\\MedHelp(RN)\\front\\MedHelp\\src\\screens\\chat\\ChatListScreen.web.jsx',
  'D:\\Portfolio\\MedHelp(RN)\\front\\MedHelp\\src\\screens\\chat\\ChatRoomScreen.native.jsx',
  'D:\\Portfolio\\MedHelp(RN)\\front\\MedHelp\\src\\screens\\chat\\ChatRoomScreen.web.jsx'
];

const filesToChangeToSizes = [
  'D:\\Portfolio\\MedHelp(RN)\\front\\MedHelp\\src\\screens\\patient\\home\\extra-screens\\symptom-checker\\CheckerLayout.jsx',
  'D:\\Portfolio\\MedHelp(RN)\\front\\MedHelp\\src\\screens\\patient\\home\\extra-screens\\symptom-checker\\Step4Severity.jsx',
  'D:\\Portfolio\\MedHelp(RN)\\front\\MedHelp\\src\\screens\\patient\\home\\extra-screens\\symptom-checker\\Step6Result.jsx'
];

// Revert theme.sizes.scale(NUMBER) to NUMBER
for (const file of filesToRevert) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/theme\.sizes\.scale\((.*?)\)/g, '$1');
  fs.writeFileSync(file, content, 'utf8');
  console.log('Reverted ' + file);
}

// Change theme.sizes.scale to sizes.scale
for (const file of filesToChangeToSizes) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/theme\.sizes\.scale\(/g, 'sizes.scale(');
  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed sizes ' + file);
}

console.log('Done.');
