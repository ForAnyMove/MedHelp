import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import * as LucideIcons from 'lucide-react-native';
import { CustomIcons } from '../../assets/icons';

export function Icon({ name, size = 24, color = "black", style, onPress }) {
  // 1. Поиск кастомной иконки (из assets/icons)
  const CustomIconCmp = CustomIcons[name];
  if (CustomIconCmp) {
    const iconNode = (
      <CustomIconCmp
        width={size}
        height={size}
        color={color}
        style={[{ color: color }, style]}
      />
    );
    
    if (onPress) {
      return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          {iconNode}
        </TouchableOpacity>
      );
    }
    return <View>{iconNode}</View>;
  }

  // 2. Фолбэк на Lucide иконки, если кастомная не найдена
  const LucideCmp = LucideIcons[name];
  if (LucideCmp) {
    const iconNode = <LucideCmp size={size} color={color} style={style} />;
    
    if (onPress) {
      return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          {iconNode}
        </TouchableOpacity>
      );
    }
    return iconNode;
  }

  return null;
}
