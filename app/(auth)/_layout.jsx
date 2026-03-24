import { Stack } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeContext';

export default function AuthLayout() {
  const { colors } = useTheme();

  return (
    <Stack 
      screenOptions={{ 
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg }
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" />
      <Stack.Screen name="verify" />
      <Stack.Screen name="patient-onboarding" />
      <Stack.Screen name="doctor-upload" />
      <Stack.Screen name="doctor-pending" />
    </Stack>
  );
}
