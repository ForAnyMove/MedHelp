import { useMemo } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { useTheme } from './ThemeContext';

export function useStyles(styleFactory) {
  const theme = useTheme();
  const dimensions = useWindowDimensions();

  return useMemo(
    () => StyleSheet.create(styleFactory(theme, dimensions)),
    [theme, dimensions, styleFactory]
  );
}
