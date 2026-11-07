import React, { useRef, useEffect } from 'react';
import { View, TouchableOpacity, Animated, Easing } from 'react-native';
import * as LucideIcons from 'lucide-react-native';
import { CustomIcons } from '../../assets/icons';
import { getHitSlopForSize } from '../../utils/accessibility';

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

// Cache for resolved icon components to avoid repetitive string operations and lookups
const ALIASES = {
  person: 'User',
  user: 'User',
  pencil: 'Pencil',
};

const RESOLUTION_CACHE = new Map();

function getIconComponent(name) {
  if (!name) return null;
  if (RESOLUTION_CACHE.has(name)) {
    return RESOLUTION_CACHE.get(name);
  }

  const resolvedName = ALIASES[name] || name;
  const pascalName = (typeof resolvedName === 'string' && resolvedName.length > 0)
    ? resolvedName.charAt(0).toUpperCase() + resolvedName.slice(1)
    : resolvedName;

  const CustomIconCmp = CustomIcons[name] || CustomIcons[resolvedName];
  const LucideCmp = !CustomIconCmp ? (LucideIcons[name] || LucideIcons[resolvedName] || LucideIcons[pascalName]) : null;

  const result = CustomIconCmp 
    ? { type: 'custom', Component: CustomIconCmp } 
    : LucideCmp 
      ? { type: 'lucide', Component: LucideCmp } 
      : null;

  RESOLUTION_CACHE.set(name, result);
  return result;
}

/**
 * @param {boolean}  wrapped        - Show icon inside a rounded wrapper
 * @param {string}   wrapperColor   - Override wrapper background color (default: icon color)
 * @param {number}   wrapperOpacity - Wrapper bg opacity (default: 0.2)
 * @param {number}   wrapperSize    - Wrapper dimensions (default: size * 1.8)
 * @param {number}   wrapperRadius  - Wrapper border radius (default: wrapperSize * 0.25)
 * @param {object}   wrapperStyle   - Additional wrapper styles
 */
export function Icon({ 
  name, 
  size = 24, 
  color = "black", 
  style, 
  onPress, 
  wrapped, 
  wrapperColor, 
  wrapperOpacity = 0.2, 
  wrapperSize, 
  wrapperRadius, 
  wrapperStyle, 
  spin, 
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole,
  accessibilityState,
  disabled,
  ...rest 
}) {
  const resolved = getIconComponent(name);
  if (!resolved) return null;

  const { type, Component: IconComponent } = resolved;
  const isAccessible = !onPress && !!accessibilityLabel;
  let iconNode = type === 'custom' ? (
    <IconComponent
      width={size}
      height={size}
      color={color}
      style={[{ color: color }, style]}
      accessible={isAccessible ? true : undefined}
      accessibilityRole={isAccessible ? (accessibilityRole || "image") : undefined}
      accessibilityLabel={!onPress ? accessibilityLabel : undefined}
      {...rest}
    />
  ) : (
    <IconComponent 
      size={size} 
      color={color} 
      style={style} 
      accessible={isAccessible ? true : undefined}
      accessibilityRole={isAccessible ? (accessibilityRole || "image") : undefined}
      accessibilityLabel={!onPress ? accessibilityLabel : undefined}
      {...rest} 
    />
  );

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
    const effectiveDimension = wrapped ? (wrapperSize || Math.round(size * 1.8)) : size;
    const computedHitSlop = rest.hitSlop !== undefined 
      ? rest.hitSlop 
      : getHitSlopForSize(effectiveDimension, effectiveDimension);

    return (
      <TouchableOpacity 
        onPress={onPress} 
        activeOpacity={0.7} 
        disabled={disabled}
        accessibilityRole={accessibilityRole || "button"}
        accessibilityLabel={accessibilityLabel || (typeof name === 'string' ? name : 'Button')}
        accessibilityHint={accessibilityHint}
        accessibilityState={accessibilityState || (disabled !== undefined ? { disabled: !!disabled } : undefined)}
        hitSlop={computedHitSlop}
      >
        {iconNode}
      </TouchableOpacity>
    );
  }

  return iconNode;
}

