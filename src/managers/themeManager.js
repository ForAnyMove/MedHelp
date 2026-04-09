import { useMemo, useState } from 'react';
import { useWindowDimensions, Platform } from 'react-native';
import { scaleByHeight, scaleByHeightMobile } from '../utils/resizeFuncs';

const lightColors = {
  p500: '#23D3C2', 
  p400: '#4EE6D8',
  p300: '#84F2E8',
  p200: '#CEF9F1',
  p100: '#E6FAF8',
  sCoral: '#FF7062',
  sYell: '#FFCF65',
  sBlue: '#47A4FF',
  sPink: '#FF5EA4',
  sCoral2: '#FB5607',
  sYell2: '#FFBE0B',
  sBlue2: '#3A86FF',
  sPink2: '#FF006E',
  n900: '#151515',
  n700: '#0D4036',
  n500: '#8FA3A0',
  n400: '#C5CFCD',
  n300: '#DCE9E8',
  n200: '#EEF6F5',
  n100: '#F6FAFB',
  sn700: '#4D4D4D',
  sn500: '#8F9BA3',
  sn300: '#DCE4E9',
  white: '#FFFFFF',
  bg: '#F3F9FE', 
  success: '#3CC480',
  warning: '#FFB547',
  danger: '#FF6B6B',
  info: '#4A9CFF',
  pinkBorder: '#FFDFED',
  opacityP400: '#40DDCC33',
};

export default function themeManager() {
  const { height, width } = useWindowDimensions();
  const [isDark, setIsDark] = useState(false);

  // Simple check for web landscape oriented screens, otherwise treat as mobile
  const isWebLandscape = Platform.OS === 'web' && width > height;

  const sizes = useMemo(() => {
    const webScale = (size) => scaleByHeight(size, height);
    const mobileScale = (size) => scaleByHeightMobile(size, height);
    const scale = isWebLandscape ? webScale : mobileScale;

    return {
      scale,
      typography: {
        displayL: { fontFamily: 'Manrope_700Bold', fontSize: scale(52), lineHeight: scale(60), letterSpacing: -0.25 },
        displayM: { fontFamily: 'Manrope_700Bold', fontSize: scale(42), lineHeight: scale(52) },
        displayS: { fontFamily: 'Manrope_700Bold', fontSize: scale(32), lineHeight: scale(40) },
        h1: { fontFamily: 'Manrope_700Bold', fontSize: scale(28), lineHeight: scale(36) },
        h2: { fontFamily: 'Manrope_600SemiBold', fontSize: scale(24), lineHeight: scale(32) },
        h3: { fontFamily: 'Manrope_600SemiBold', fontSize: scale(20), lineHeight: scale(28) },
        h4: { fontFamily: 'Manrope_600SemiBold', fontSize: scale(18), lineHeight: scale(24) },
        bodyLarge: { fontFamily: 'Manrope_500Medium', fontSize: scale(16), lineHeight: scale(20) },
        bodyMedium: { fontFamily: 'Manrope_500Medium', fontSize: scale(14), lineHeight: scale(18), letterSpacing: 0.1 },
        bodySmall: { fontFamily: 'Manrope_400Regular', fontSize: scale(12), lineHeight: scale(14), letterSpacing: 0.2 },
        caption: { fontFamily: 'Manrope_400Regular', fontSize: scale(12), lineHeight: scale(16), letterSpacing: 0.4 },
      },
      spacing: {
        xs: scale(4),
        s: scale(8),
        m: scale(16),
        l: scale(24),
        xl: scale(32),
        xxl: scale(48),
      },
      borderRadius: {
        small: scale(8),
        medium: scale(12),
        large: scale(24),
        full: 9999,
      }
    };
  }, [height, width, isWebLandscape]);

  const current = useMemo(() => ({
    colors: lightColors, // Future: add darkColors and toggle
    sizes,
  }), [sizes]);

  return {
    isTheme: isDark ? 'dark' : 'light',
    current,
    colors: lightColors, // Shortcut for easier access
    sizes, // Shortcut
    switchTheme: () => setIsDark(!isDark),
  };
}
