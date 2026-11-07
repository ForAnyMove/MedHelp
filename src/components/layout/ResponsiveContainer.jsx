import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useStyles } from '../../theme/useStyles';

/**
 * ResponsiveContainer
 * Centers content horizontally on large displays (desktop, ultrawide)
 * while maintaining 100% fluid width on mobile and portrait.
 */
export function ResponsiveContainer({
  children,
  style,
  maxWidth,
  paddingHorizontal,
  centerContent = true,
}) {
  const { responsive, sizes } = useTheme();
  const styles = useStyles(themeStyles);

  const resolvedMaxWidth = maxWidth !== undefined
    ? maxWidth
    : responsive?.containerMaxWidth || null;

  const resolvedPadding = paddingHorizontal !== undefined
    ? paddingHorizontal
    : (responsive?.contentPadding || sizes.spacing.m);

  return (
    <View
      style={[
        styles.outer,
        centerContent && styles.centerOuter,
      ]}
    >
      <View
        style={[
          styles.inner,
          resolvedMaxWidth ? { maxWidth: resolvedMaxWidth } : null,
          { paddingHorizontal: resolvedPadding },
          style,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const themeStyles = () => ({
  outer: {
    width: '100%',
    flex: 1,
  },
  centerOuter: {
    alignItems: 'center',
  },
  inner: {
    width: '100%',
    flex: 1,
  },
});
