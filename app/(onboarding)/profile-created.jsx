import React, { useState } from 'react';
import { View, Text, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '../../src/components/ui/Screen';
import { Button } from '../../src/components/ui/Button';
import { useTheme } from '../../src/theme/ThemeContext';
import { useStyles } from '../../src/theme/useStyles';
import { Images } from '../../src/assets';
import { useSession } from '../../src/context/SessionContext';

export default function ProfileCreated() {
  const router = useRouter();
  const { t } = useTranslation();
  const { sizes } = useTheme();
  const styles = useStyles(themeStyles);
  const { session, updateSession } = useSession();

  const [loading, setLoading] = useState(false);
  const isDoctor = session?.role === 'doctor';

  const handleToHome = async () => {
    setLoading(true);
    // Mark the user as fully onboarded so the NavigationManager lets them through
    await updateSession({ onboarded: true });
    setLoading(false);
    router.replace('/home');
  };

  return (
    <Screen style={styles.container}>
      <View style={styles.content}>
        <View style={styles.imageContainer}>
          <Image source={Images.profileCreated} style={styles.image} resizeMode="contain" />
        </View>
        <Text style={styles.title}>{t('auth.profile_created_title')}</Text>
        <Text style={styles.description}>
          {isDoctor ? t('auth.profile_created_doctor_desc') : t('auth.profile_created_patient_desc')}
        </Text>
      </View>

      <View style={styles.footer}>
        <Button
          title={t('auth.to_home_btn')}
          variant="primary"
          onPress={handleToHome}
          loading={loading}
          style={styles.button}
        />
      </View>
    </Screen>
  );
}

const themeStyles = (theme) => ({
  container: {
    paddingHorizontal: theme.sizes.spacing.m,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width: theme.sizes.scale(340),
    height: theme.sizes.scale(340),
    marginBottom: theme.sizes.scale(45),
  },
  image: {
    width: '100%',
    height: '100%',
  },
  title: {
    ...theme.sizes.typography.h2,
    color: theme.colors.n700,
    marginBottom: theme.sizes.spacing.s,
    textAlign: 'center',
  },
  description: {
    ...theme.sizes.typography.h4,
    color: theme.colors.n500,
    textAlign: 'center',
    paddingHorizontal: theme.sizes.spacing.xl,
    lineHeight: theme.sizes.scale(28),
  },
  footer: {
    paddingBottom: theme.sizes.scale(40),
  },
  button: {
    width: '100%',
  }
});
