import React from 'react';
import { Switch as RNSwitch } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export function Switch({ value, onValueChange, style }) {
  const { colors, sizes } = useTheme();
  
  return (
    <RNSwitch
      trackColor={{ false: colors.n300, true: colors.p300 }}
      thumbColor={value ? colors.p500 : colors.white}
      ios_backgroundColor={colors.n300}
      onValueChange={onValueChange}
      value={value}
      style={[{ transform: [{ scaleX: sizes.scale(1) }, { scaleY: sizes.scale(1) }] }, style]}
    />
  );
}
