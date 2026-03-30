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
    backgroundColor: '#EBF4F4', // Light background pill
    borderRadius: 20,
    padding: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 16,
  },
  activeSegment: {
    backgroundColor: theme.colors.p500,
    // Subtle shadow for the active pill
    shadowColor: theme.colors.p500,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  segmentText: {
    ...theme.sizes.typography.bodyMedium,
    color: '#8A9999',
    fontWeight: '600',
  },
  activeSegmentText: {
    color: theme.colors.white,
  },
});
