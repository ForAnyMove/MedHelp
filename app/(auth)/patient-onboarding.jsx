import React, { useRef, useState } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import PagerView from '../../src/components/ui/PagerView';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '../../src/components/ui/Screen';
import { Button } from '../../src/components/ui/Button';
import { useTheme } from '../../src/theme/ThemeContext';
import { useStyles } from '../../src/theme/useStyles';
import { useSession } from '../../src/context/SessionContext';
import { Images } from '../../src/assets';

export default function PatientOnboarding() {
  const router = useRouter();
  const { t } = useTranslation();
  const pagerRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(0);
  const { sizes } = useTheme();
  const styles = useStyles(themeStyles);
  const { updateSession } = useSession();

  const ONBOARDING_DATA = [
    {
      key: '1',
      title: t('onboarding.slide1_title'),
      description: t('onboarding.slide1_desc'),
      image: Images.onboardingBg1,
      mask: Images.onboardingMask1,
    },
    {
      key: '2',
      title: t('onboarding.slide2_title'),
      description: t('onboarding.slide2_desc'),
      image: Images.onboardingBg2,
    },
    {
      key: '3',
      title: t('onboarding.slide3_title'),
      description: t('onboarding.slide3_desc'),
      image: Images.onboardingBg3,
    }
  ];

  const goToPage = (page) => {
    setCurrentPage(page);
    pagerRef.current?.setPage(page);
  };

  const handleNext = async () => {
    if (currentPage < ONBOARDING_DATA.length - 1) {
      goToPage(currentPage + 1);
    } else {
      // Mark onboarded — NavigationManager will redirect to /home
      await updateSession({ onboarded: true });
    }
  };

  const handleSkip = async () => {
    // Mark onboarded — NavigationManager will redirect to /home
    await updateSession({ onboarded: true });
  };

  const handlePageSelected = (e) => {
    setCurrentPage(e.nativeEvent.position);
  };

  function imageSize(index) {
    switch (index) {
      case 0:
        return { width: sizes.scale(400), height: sizes.scale(400) };
      case 1:
        return { width: sizes.scale(550), height: sizes.scale(400) };
      case 2:
        return { width: sizes.scale(500), height: sizes.scale(400), opacity: 0.8, filter: 'brightness(1.1)' };
    }
  }

  return (
    <Screen style={styles.container}>
      {/* Header — Skip only, no logo */}
      <View style={styles.header}>
        <View />
        <Text style={styles.skipText} onPress={handleSkip}>{t('auth.skip')}</Text>
      </View>

      {/* Pager */}
      <PagerView
        ref={pagerRef}
        style={styles.pagerView}
        initialPage={0}
        onPageSelected={handlePageSelected}
      >
        {ONBOARDING_DATA.map((page, index) => (
          <View key={page.key} style={styles.page}>
            {/* Image with optional mask overlay */}
            <View style={[styles.imageContainer, imageSize(index) ]}>
              <Image source={page.image} style={styles.slideImage} resizeMode="contain" />
              {page.mask && (
                <Image source={page.mask} style={styles.maskImage} resizeMode="contain" />
              )}
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
            <TouchableOpacity
              key={index}
              onPress={() => goToPage(index)}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            >
              <View style={[styles.dot, currentPage === index && styles.dotActive]} />
            </TouchableOpacity>
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
    height: theme.sizes.scale(44),
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
  imageContainer: {
    width: theme.sizes.scale(350),
    height: theme.sizes.scale(450),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.sizes.scale(10),
  },
  slideImage: {
    width: '100%',
    height: '100%',
  },
  maskImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
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
    marginBottom: theme.sizes.spacing.l,
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
  }
});

