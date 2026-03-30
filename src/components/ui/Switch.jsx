import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, Animated, StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export function Switch({ value, onValueChange, style }) {
  const { colors, sizes } = useTheme();
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
    outputRange: [colors.n100, colors.p500], // n100 is very light teal/grey
  });

  const thumbColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.p500, colors.white],
  });

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 22], // adjust based on widths
  });

  return (
    <TouchableOpacity 
      activeOpacity={0.8} 
      onPress={toggleSwitch}
      style={[style]}
    >
      <Animated.View style={[styles.track, { backgroundColor: trackColor }]}>
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

const styles = StyleSheet.create({
  track: {
    width: 48,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    padding: 2,
  },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
});
