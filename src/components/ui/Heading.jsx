import React from 'react';
import { Text, Platform } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

/**
 * Universal Accessible Heading component conforming to WCAG 2.1/2.2 AA and SI 5568-1 Clause 2.4.10.
 *
 * @param {1 | 2 | 3 | 4} level - Heading level (1 = h1/page title, 2 = section, 3 = subsection, 4 = card title)
 * @param {React.ReactNode} children - Heading text or elements
 * @param {object} style - Additional styles
 * @param {string} accessibilityLabel - Optional screen reader label override
 */
export function Heading({
  level = 2,
  children,
  style,
  accessibilityLabel,
  numberOfLines,
  ...rest
}) {
  const { sizes, colors } = useTheme();

  const typographyStyle = (() => {
    switch (level) {
      case 1:
        return sizes.typography.h1;
      case 2:
        return sizes.typography.h2;
      case 3:
        return sizes.typography.h3;
      case 4:
        return sizes.typography.h4;
      default:
        return sizes.typography.h2;
    }
  })();

  const webAccessibilityProps = Platform.OS === 'web' ? {
    role: 'heading',
    'aria-level': level,
  } : {};

  return (
    <Text
      accessibilityRole="header"
      accessibilityLevel={level}
      accessibilityLabel={accessibilityLabel}
      allowFontScaling={true}
      numberOfLines={numberOfLines}
      style={[
        typographyStyle,
        { color: colors.n900 },
        style,
      ]}
      {...webAccessibilityProps}
      {...rest}
    >
      {children}
    </Text>
  );
}
