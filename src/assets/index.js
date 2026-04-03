// Centralized static assets for preloading and easy access
export const Images = {
  logo: require('../../assets/logo.png'),
  welcomeBackground: require('../../assets/backgrounds/welcome-background.png'),
  onboardingBg1: require('../../assets/onboarding/onboarding-bg-1.png'),
  onboardingBg2: require('../../assets/onboarding/onboarding-bg-2.png'),
  onboardingBg3: require('../../assets/onboarding/onboarding-bg-3.png'),
  onboardingMask1: require('../../assets/onboarding/onboarding-mask-1.png'),
};

// Return as an array for use with Asset.loadAsync
export const allImages = Object.values(Images);
