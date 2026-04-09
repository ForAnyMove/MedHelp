import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, Animated, StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useStyles } from '../../theme/useStyles';

export function Switch({ value, onValueChange, style }) {
  const { colors, sizes } = useTheme();
  const styles = useStyles(themeStyles);
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: value ? 1 : 0,
      duration: 200,
      useNativeDriver: false, // Color and Layout animation require false
    }).start();
  }, [value]);

  const toggleSwitch = () => {
    if (onValueChange) {
      onValueChange(!value);
    }
  };

  const trackColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.n200, colors.p500], // n100 is very light teal/grey
  });

  const thumbColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.p500, colors.white],
  });

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, sizes.scale(14)], // adjust based on widths
  });

  const borderColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.n300, colors.p500],
  });

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={toggleSwitch}
      style={[style]}
    >
      <Animated.View style={[styles.track, { backgroundColor: trackColor, borderColor: borderColor }]}>
        <Animated.View
          style={[
            styles.thumb,
            {
              backgroundColor: thumbColor,
              transform: [{ translateX }]
            }
          ]}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

const themeStyles = (theme) => ({
  track: {
    width: theme.sizes.scale(36),
    height: theme.sizes.scale(22),
    borderRadius: theme.sizes.borderRadius.full,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.n300,
  },
  thumb: {
    width: theme.sizes.scale(20),
    height: theme.sizes.scale(20),
    borderRadius: theme.sizes.borderRadius.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
});
