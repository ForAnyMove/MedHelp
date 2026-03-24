import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useStyles } from '../../theme/useStyles';
import { Icon } from './Icon';

export function Button({ 
  variant = 'primary', // 'primary' | 'secondary' | 'outlined'
  title, 
  icon,
  disabled, 
  onPress, 
  style, 
  textStyle 
}) {
  const { colors, sizes } = useTheme();
  const styles = useStyles(themeStyles);

  const buttonStyle = [
    styles.base,
    styles[variant],
    disabled && styles.disabled,
    style,
  ];

  const labelStyle = [
    sizes.typography.bodyLarge,
    styles[`${variant}Text`],
    disabled && styles.disabledText,
    textStyle,
  ];

  return (
    <TouchableOpacity 
      style={buttonStyle} 
      onPress={onPress} 
      disabled={disabled}
      activeOpacity={0.7}
    >
      {icon && (
        <Icon 
          name={icon} 
          color={StyleSheet.flatten(labelStyle).color} 
          size={sizes.scale(20)} 
          style={{ marginRight: title ? sizes.spacing.s : 0 }} 
        />
      )}
      {title && <Text style={labelStyle}>{title}</Text>}
    </TouchableOpacity>
  );
}

const themeStyles = (theme) => {
  const { colors, sizes } = theme;
  return {
    base: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: sizes.scale(14),
      paddingHorizontal: sizes.scale(24),
      borderRadius: sizes.borderRadius.full,
    },
    primary: {
      backgroundColor: colors.p500,
      borderWidth: 1,
      borderColor: colors.p500,
    },
    primaryText: {
      color: colors.white,
      fontWeight: '600',
    },
    secondary: {
      backgroundColor: colors.sPink,
      borderWidth: 1,
      borderColor: colors.sPink,
    },
    secondaryText: {
      color: colors.white,
      fontWeight: '600',
    },
    outlined: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.p500,
    },
    outlinedText: {
      color: colors.p500,
      fontWeight: '600',
    },
    disabled: {
      backgroundColor: colors.n300,
      borderColor: colors.n300,
    },
    disabledText: {
      color: colors.n500,
    },
  };
};
