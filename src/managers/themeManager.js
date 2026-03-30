import { useMemo, useState } from 'react';
import { useWindowDimensions, Platform } from 'react-native';
import { scaleByHeight, scaleByHeightMobile } from '../utils/resizeFuncs';

const lightColors = {
  p500: '#19D2B5', 
  p400: '#7EF1E4',
  p300: '#80EEDD',
  p200: '#B3FBF1',
  p100: '#E5FFFC',
  sCoral: '#FF8A65',
  sYell: '#FFD54F',
  sBlue: '#64B5F6',
  sPink: '#F06292',
  n900: '#172B2E',
  n700: '#4B5E62',
  n500: '#8E9EA1',
  n400: '#B6C4C6',
  n300: '#D5DFE1',
  n200: '#F0F5F6',
  n100: '#F6FAFB',
  white: '#FFFFFF',
  bg: '#F6FAFB', 
  success: '#47C27B',
  warning: '#F5A623',
  danger: '#FF7E7E',
  info: '#3F83F8',
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
        bodyMedium: { fontFamily: 'Manrope_500Medium', fontSize: scale(15), lineHeight: scale(18), letterSpacing: 0.1 },
        bodySmall: { fontFamily: 'Manrope_400Regular', fontSize: scale(14), lineHeight: scale(18), letterSpacing: 0.2 },
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
