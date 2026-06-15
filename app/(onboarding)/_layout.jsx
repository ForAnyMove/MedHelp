import { Stack } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeContext';

export default function OnboardingLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="choose-role" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="profile-setup" />
      <Stack.Screen name="doc-upload" />
      <Stack.Screen name="profile-created" />
    </Stack>
  );
}
