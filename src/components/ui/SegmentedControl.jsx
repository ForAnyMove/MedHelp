import React from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { useStyles } from '../../theme/useStyles';

/**
 * Universal Segmented Control / Tab Switcher
 * @param {Array} options - Array of { label, value }
 * @param {string} value - Current active value
 * @param {function} onChange - Callback on selection
 * @param {object} style - Custom container style
 */
export function SegmentedControl({ options, value, onChange, style }) {
  const styles = useStyles(themeStyles);

  return (
    <View style={[styles.container, style]}>
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <TouchableOpacity
            key={option.value}
            style={[styles.segment, isActive && styles.activeSegment]}
            onPress={() => onChange(option.value)}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentText, isActive && styles.activeSegmentText]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const themeStyles = (theme) => ({
  container: {
    flexDirection: 'row',
    backgroundColor: theme.colors.n300, // Light background pill
    borderRadius: theme.sizes.borderRadius.full,
    padding: theme.sizes.scale(1),
  },
  segment: {
    flex: 1,
    paddingVertical: theme.sizes.spacing.s,
    paddingHorizontal: theme.sizes.spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.sizes.borderRadius.full,
  },
  activeSegment: {
    backgroundColor: theme.colors.p500,
    // Subtle shadow for the active pill
    shadowColor: theme.colors.p500,
    shadowOffset: { width: theme.sizes.scale(0), height: theme.sizes.scale(4) },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  segmentText: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n700,
    textAlign: 'center',
  },
  activeSegmentText: {
    color: theme.colors.white,
  },
});
