import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

/**
 * ResponsiveGrid
 * Adapts children into a responsive N-column grid based on active breakpoint.
 */
export function ResponsiveGrid({
  children,
  columns = { mobile: 1, tablet: 2, desktop: 3, wide: 4 },
  gap = 16,
  style,
  itemStyle,
}) {
  const { responsive } = useTheme();

  let cols = columns.mobile || 1;
  if (responsive?.isUltrawide || responsive?.isDesktopLarge) {
    cols = columns.wide || columns.desktop || 3;
  } else if (responsive?.isDesktop) {
    cols = columns.desktop || columns.tablet || 2;
  } else if (responsive?.isTablet) {
    cols = columns.tablet || 2;
  }

  // Calculate percentage width subtracting gap
  const itemWidth = cols === 1
    ? '100%'
    : `${(100 - (cols - 1) * 2) / cols}%`;

  const childArray = React.Children.toArray(children);

  return (
    <View
      style={[
        styles.gridContainer,
        { marginHorizontal: -gap / 2 },
        style,
      ]}
    >
      {childArray.map((child, index) => (
        <View
          key={child.key || index}
          style={[
            styles.gridItem,
            {
              width: itemWidth,
              paddingHorizontal: gap / 2,
              marginBottom: gap,
            },
            itemStyle,
          ]}
        >
          {child}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'stretch',
  },
  gridItem: {
    boxSizing: 'border-box',
  },
});
