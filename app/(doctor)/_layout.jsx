import { Stack } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeContext';

export default function DoctorLayout() {
  const { colors } = useTheme();

  return (
    <Stack 
      screenOptions={{ 
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg }
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}
