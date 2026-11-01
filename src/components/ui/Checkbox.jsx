import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useStyles } from '../../theme/useStyles';
import { Icon } from './Icon';

export function Checkbox({ 
  checked, 
  onChange, 
  style, 
  label, 
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
  ...rest 
}) {
  const { colors, sizes } = useTheme();
  const styles = useStyles(themeStyles);

  const handlePress = () => {
    if (!disabled && onChange) {
      onChange(!checked);
    }
  };

  return (
    <TouchableOpacity 
      activeOpacity={0.8} 
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityLabel={accessibilityLabel || (typeof label === 'string' ? label : 'Флажок')}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ checked: !!checked, disabled: !!disabled }}
      style={[styles.container, disabled && { opacity: 0.5 }, style]}
      {...rest}
    >
      <View style={[styles.box, checked && styles.boxChecked]}>
        {checked && <Icon name="check2" size={sizes.scale(24)} color={colors.white} />}
      </View>
      {label && <Text style={styles.label} allowFontScaling={true}>{label}</Text>}
    </TouchableOpacity>
  );
}

const themeStyles = (theme) => {
  const { colors, sizes } = theme;
  return {
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: sizes.scale(44), // WCAG 2.5.5 target size
    },
    label: {
      ...sizes.typography.body,
      color: colors.n900,
      marginLeft: sizes.spacing.m,
      flex: 1,
    },
    box: {
      width: sizes.scale(24),
      height: sizes.scale(24),
      borderRadius: sizes.scale(6),
      borderWidth: 2,
      borderColor: colors.p500,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.white,
    },
    boxChecked: {
      backgroundColor: colors.p500,
    }
  };
};
