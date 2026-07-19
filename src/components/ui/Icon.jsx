import React, { useRef, useEffect } from 'react';
import { View, TouchableOpacity, Animated, Easing } from 'react-native';
import * as LucideIcons from 'lucide-react-native';
import { CustomIcons } from '../../assets/icons';

/**
 * Converts a hex color to rgba with given opacity.
 */
function hexToRgba(hex, opacity) {
  const cleaned = hex.replace('#', '');
  const r = parseInt(cleaned.substring(0, 2), 16);
  const g = parseInt(cleaned.substring(2, 4), 16);
  const b = parseInt(cleaned.substring(4, 6), 16);
  return /* TODO: color */ `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * @param {boolean}  wrapped        - Show icon inside a rounded wrapper
 * @param {string}   wrapperColor   - Override wrapper background color (default: icon color)
 * @param {number}   wrapperOpacity - Wrapper bg opacity (default: 0.2)
 * @param {number}   wrapperSize    - Wrapper dimensions (default: size * 1.8)
 * @param {number}   wrapperRadius  - Wrapper border radius (default: wrapperSize * 0.25)
 * @param {object}   wrapperStyle   - Additional wrapper styles
 */
export function Icon({ name, size = 24, color = "black", style, onPress, wrapped, wrapperColor, wrapperOpacity = 0.2, wrapperSize, wrapperRadius, wrapperStyle, spin, ...rest }) {
  // Resolve the icon component
  let iconNode = null;
  const CustomIconCmp = CustomIcons[name];
  const LucideCmp = !CustomIconCmp ? LucideIcons[name] : null;

  if (CustomIconCmp) {
    iconNode = (
      <CustomIconCmp
        width={size}
        height={size}
        color={color}
        style={[{ color: color }, style]}
        {...rest}
      />
    );
  } else if (LucideCmp) {
    iconNode = <LucideCmp size={size} color={color} style={style} {...rest} />;
  } else {
    return null;
  }

  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (spin) {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else {
      spinValue.stopAnimation();
      spinValue.setValue(0);
    }
  }, [spin]);

  if (spin) {
    const spinInterpolate = spinValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });
    iconNode = (
      <Animated.View style={{ transform: [{ rotate: spinInterpolate }] }}>
        {iconNode}
      </Animated.View>
    );
  }

  // Wrap in container if requested
  if (wrapped) {
    const ws = wrapperSize || Math.round(size * 1.8);
    const wr = wrapperRadius !== undefined ? wrapperRadius : Math.round(ws * 0.25);
    const bgColor = wrapperColor || color;
    const bg = bgColor.startsWith('#') ? hexToRgba(bgColor, wrapperOpacity) : bgColor;

    iconNode = (
      <View style={[{
        width: ws,
        height: ws,
        borderRadius: wr,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }, wrapperStyle]}>
        {iconNode}
      </View>
    );
  }

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        {iconNode}
      </TouchableOpacity>
    );
  }

  return iconNode;
}

