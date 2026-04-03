import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '../../src/components/ui/Screen';
import { Button } from '../../src/components/ui/Button';
import { useTheme } from '../../src/theme/ThemeContext';
import { useStyles } from '../../src/theme/useStyles';
import { Icon } from '../../src/components/ui/Icon';
import { Images } from '../../src/assets';

export default function Welcome() {
  const router = useRouter();
  const { t } = useTranslation();
  const { sizes } = useTheme();
  const styles = useStyles(themeStyles);

  return (
    <Screen style={styles.container}>
      {/* Full Screen Background */}
      <Image 
        source={Images.welcomeBackground} 
        style={[StyleSheet.absoluteFillObject, styles.backgroundImage]}
        resizeMode="cover"
      />

      {/* Top Logo Area */}
      <View style={styles.logoContainer}>
        <Image 
          source={Images.logo} 
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>

      {/* Center content */}
      <View style={styles.contentContainer}>
        <Text style={styles.title}>{t('auth.welcome_title')}</Text>
        <Text style={styles.subtitle}>{t('auth.welcome_subtitle')}</Text>
      </View>

      {/* Bottom Actions */}
      <View style={styles.footer}>
        <Button 
          title={t('auth.login_btn')} 
          variant="primary" 
          onPress={() => router.push('/(auth)/login')}
          style={styles.button}
        />
        <Button 
          title={t('auth.continue_doctor_btn')} 
          variant="outlined" 
          onPress={() => router.push('/(auth)/login?role=doctor')}
          style={styles.button}
        />
      </View>
    </Screen>
  );
}

const themeStyles = (theme) => ({
  container: {
    paddingHorizontal: theme.sizes.spacing.l,
    justifyContent: 'space-between',
    backgroundColor: theme.colors.p500+'10',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    zIndex: -1,
    opacity: 0.4,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: theme.sizes.scale(40),
  },
  logoImage: {
    width: theme.sizes.scale(100),
    height: theme.sizes.scale(76),
  },
  logoColor: {
    color: theme.colors.p500,
  },
  logoText: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n900,
    marginTop: theme.sizes.spacing.s,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: theme.sizes.scale(50),
  },
  title: {
    ...theme.sizes.typography.displayS,
    color: theme.colors.n900,
    textAlign: 'center',
    marginBottom: theme.sizes.spacing.m,
  },
  subtitle: {
    ...theme.sizes.typography.bodyLarge,
    color: theme.colors.n700,
    textAlign: 'center',
  },
  footer: {
    paddingBottom: theme.sizes.scale(40),
  },
  button: {
    marginBottom: theme.sizes.spacing.m,
  }
});
