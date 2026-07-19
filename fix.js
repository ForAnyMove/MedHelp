const fs = require('fs');
const files = [
  'd:/Portfolio/MedHelp(RN)/front/MedHelp/app/(patient)/consultations/index.jsx',
  'd:/Portfolio/MedHelp(RN)/front/MedHelp/app/(patient)/consultations/[id].jsx',
  'd:/Portfolio/MedHelp(RN)/front/MedHelp/app/(patient)/consultations/rate.jsx',
  'd:/Portfolio/MedHelp(RN)/front/MedHelp/app/(patient)/consultations/waiting.jsx'
];
files.forEach(f => {
  if (!fs.existsSync(f)) return;
  let text = fs.readFileSync(f, 'utf8');
  text = text.replace(/const \{ colors, sizes, spacing, fonts \} = useTheme\(\);/g, "const { colors, sizes } = useTheme();\n  const spacing = sizes.spacing;");
  text = text.replace(/fonts\.bold/g, "'Manrope_700Bold'");
  text = text.replace(/fonts\.medium/g, "'Manrope_600SemiBold'");
  text = text.replace(/fonts\.regular/g, "'Manrope_400Regular'");
  text = text.replace(/sizes\.font\.lg/g, "sizes.scale(20)");
  text = text.replace(/sizes\.font\.md/g, "sizes.scale(16)");
  text = text.replace(/sizes\.font\.sm/g, "sizes.scale(14)");
  text = text.replace(/sizes\.font\.xs/g, "sizes.scale(12)");
  text = text.replace(/sizes\.radius\.lg/g, "sizes.borderRadius.large");
  text = text.replace(/sizes\.radius\.md/g, "sizes.borderRadius.medium");
  text = text.replace(/sizes\.radius\.sm/g, "sizes.borderRadius.small");
  text = text.replace(/sizes\.radius\.full/g, "sizes.borderRadius.full");
  fs.writeFileSync(f, text);
});
console.log('Fixed theme properties');
