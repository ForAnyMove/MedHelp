import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '../../src/components/ui/Screen';
import { Button } from '../../src/components/ui/Button';
import LogoSvg from '../../assets/logo.svg';
import { useTheme } from '../../src/theme/ThemeContext';
import { useStyles } from '../../src/theme/useStyles';
import { Icon } from '../../src/components/ui/Icon';

export default function Welcome() {
  const router = useRouter();
  const { t } = useTranslation();
  const { sizes } = useTheme();
  const styles = useStyles(themeStyles);

  return (
    <Screen style={styles.container}>
      {/* Top Logo Area */}
      <View style={styles.logoContainer}>
        <LogoSvg width={sizes.scale(100)} height={sizes.scale(75)} />
      </View>

      {/* Center content */}
      <View style={styles.contentContainer}>
        <Text style={styles.title}>{t('auth.welcome_title')}</Text>
        <Text style={styles.subtitle}>{t('auth.welcome_subtitle')}</Text>
        
        {/* Abstract Illustration Placeholder */}
        <View style={styles.illustrationPlaceholder}>
          <Icon name="Activity" size={sizes.scale(100)} color={styles.illustrationColor.color} />
        </View>
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
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: theme.sizes.scale(40),
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
    justifyContent: 'center',
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
  illustrationPlaceholder: {
    marginTop: theme.sizes.scale(60),
    width: theme.sizes.scale(240),
    height: theme.sizes.scale(240),
    borderRadius: theme.sizes.scale(120),
    backgroundColor: theme.colors.p100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationColor: {
    color: theme.colors.p300,
  },
  footer: {
    paddingBottom: theme.sizes.scale(40),
  },
  button: {
    marginBottom: theme.sizes.spacing.m,
  }
});
