import React, { useRef, useState } from 'react';
import { View, Text } from 'react-native';
import PagerView from '../../src/components/ui/PagerView';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '../../src/components/ui/Screen';
import { Button } from '../../src/components/ui/Button';
import { Icon } from '../../src/components/ui/Icon';
import LogoSvg from '../../assets/logo.svg';
import { useTheme } from '../../src/theme/ThemeContext';
import { useStyles } from '../../src/theme/useStyles';

export default function PatientOnboarding() {
  const router = useRouter();
  const { t } = useTranslation();
  const pagerRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(0);
  const { sizes } = useTheme();
  const styles = useStyles(themeStyles);

  const ONBOARDING_DATA = [
    {
      key: '1',
      title: t('onboarding.slide1_title'),
      description: t('onboarding.slide1_desc'),
      icon: 'Activity',
    },
    {
      key: '2',
      title: t('onboarding.slide2_title'),
      description: t('onboarding.slide2_desc'),
      icon: 'Stethoscope',
    },
    {
      key: '3',
      title: t('onboarding.slide3_title'),
      description: t('onboarding.slide3_desc'),
      icon: 'UserPlus',
    }
  ];

  const handleNext = () => {
    if (currentPage < ONBOARDING_DATA.length - 1) {
      pagerRef.current?.setPage(currentPage + 1);
    } else {
      router.replace('/(patient)/');
    }
  };

  const handleSkip = () => {
    router.replace('/(patient)/');
  };

  return (
    <Screen style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <LogoSvg width={sizes.scale(64)} height={sizes.scale(48)} />
        </View>
        <Text style={styles.skipText} onPress={handleSkip}>{t('auth.skip')}</Text>
      </View>

      {/* Pager */}
      <PagerView
        ref={pagerRef}
        style={styles.pagerView}
        initialPage={0}
        onPageSelected={(e) => setCurrentPage(e.nativeEvent.position)}
      >
        {ONBOARDING_DATA.map((page) => (
          <View key={page.key} style={styles.page}>
            <View style={styles.illustration}>
              <Icon name={page.icon} size={sizes.scale(80)} color={styles.iconColor.color} />
            </View>
            <Text style={styles.title}>{page.title}</Text>
            <Text style={styles.description}>{page.description}</Text>
          </View>
        ))}
      </PagerView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.pagination}>
          {ONBOARDING_DATA.map((_, index) => (
            <View 
              key={index} 
              style={[styles.dot, currentPage === index && styles.dotActive]} 
            />
          ))}
        </View>
        
        <Button 
          title={currentPage === ONBOARDING_DATA.length - 1 ? t('onboarding.start_btn') : t('onboarding.next_btn')} 
          variant="primary" 
          onPress={handleNext}
        />
      </View>
    </Screen>
  );
}

const themeStyles = (theme) => ({
  container: {
    paddingHorizontal: theme.sizes.spacing.l,
    paddingTop: theme.sizes.spacing.s,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: theme.sizes.scale(50),
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoColor: {
    color: theme.colors.p500,
  },
  logoText: {
    ...theme.sizes.typography.h4,
    color: theme.colors.n900,
    marginLeft: theme.sizes.spacing.xs,
  },
  skipText: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n900,
  },
  pagerView: {
    flex: 1,
  },
  page: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustration: {
    width: theme.sizes.scale(200),
    height: theme.sizes.scale(200),
    borderRadius: theme.sizes.scale(100),
    backgroundColor: theme.colors.p100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.sizes.scale(40),
  },
  iconColor: {
    color: theme.colors.p400,
  },
  title: {
    ...theme.sizes.typography.h2,
    color: theme.colors.n900,
    textAlign: 'center',
    marginBottom: theme.sizes.spacing.m,
  },
  description: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n700,
    textAlign: 'center',
    paddingHorizontal: theme.sizes.spacing.l,
  },
  footer: {
    paddingBottom: theme.sizes.scale(40),
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.sizes.spacing.xl,
  },
  dot: {
    width: theme.sizes.scale(8),
    height: theme.sizes.scale(8),
    borderRadius: theme.sizes.scale(4),
    backgroundColor: theme.colors.n300,
    marginHorizontal: theme.sizes.scale(4),
  },
  dotActive: {
    backgroundColor: theme.colors.p500,
    width: theme.sizes.scale(16),
  }
});
