import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useStyles } from '../../theme/useStyles';
import { Icon } from './Icon';

export function Checkbox({ checked, onChange, style, label }) {
  const { colors, sizes } = useTheme();
  const styles = useStyles(themeStyles);

  return (
    <TouchableOpacity 
      activeOpacity={0.8} 
      onPress={() => onChange(!checked)}
      style={[styles.container, style]}
    >
      <View style={[styles.box, checked && styles.boxChecked]}>
        {checked && <Icon name="check2" size={sizes.scale(24)} color={colors.white} />}
      </View>
      {label && <Text style={styles.label}>{label}</Text>}
    </TouchableOpacity>
  );
}

const themeStyles = (theme) => {
  const { colors, sizes } = theme;
  return {
    container: {
      flexDirection: 'row',
      alignItems: 'center',
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
