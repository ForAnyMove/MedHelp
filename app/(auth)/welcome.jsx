import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button } from '../../src/components/ui/Button';
import { useTheme } from '../../src/theme/ThemeContext';
import { useStyles } from '../../src/theme/useStyles';
import { Images } from '../../src/assets';

export default function Welcome() {
  const router = useRouter();
  const { t } = useTranslation();
  const { sizes } = useTheme();
  const styles = useStyles(themeStyles);

  return (
    <View style={styles.screen}>
      <StatusBar style="auto" />
      {/* Full Screen Background covering 100% of the screen */}
      <Image
        source={Images.welcomeBackground}
        style={styles.backgroundImage}
        resizeMode="cover"
      />

      <SafeAreaView style={styles.container}>
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
        </View>
      </SafeAreaView>
    </View>
  );
}

const themeStyles = (theme) => ({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.p500 + '10',
  },
  container: {
    flex: 1,
    paddingHorizontal: theme.sizes.spacing.m,
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: theme.responsive?.isTablet || theme.responsive?.isDesktop || theme.responsive?.isDesktopLarge ? 480 : undefined,
    alignSelf: 'center',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
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
