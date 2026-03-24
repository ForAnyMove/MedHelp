import React, { useState } from 'react';
import { View, TextInput, Text } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useStyles } from '../../theme/useStyles';

export function Input({ placeholder, value, onChangeText, label, error, secureTextEntry, style }) {
  const { colors, sizes } = useTheme();
  const styles = useStyles(themeStyles);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[
        styles.inputContainer,
        isFocused && styles.inputFocused,
        error && styles.inputError,
      ]}>
        <TextInput
          style={[styles.input, sizes.typography.bodyMedium]}
          placeholder={placeholder}
          placeholderTextColor={colors.n500}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const themeStyles = (theme) => {
  const { colors, sizes } = theme;
  return {
    container: {
      marginBottom: sizes.spacing.m,
      width: '100%',
    },
    label: {
      ...sizes.typography.caption,
      color: colors.n700,
      marginBottom: sizes.spacing.xs,
      marginLeft: sizes.spacing.xs,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.n300,
      borderRadius: sizes.borderRadius.medium,
      backgroundColor: colors.white,
      paddingHorizontal: sizes.scale(16),
      height: sizes.scale(50),
    },
    inputFocused: {
      borderColor: colors.p500,
    },
    inputError: {
      borderColor: colors.danger,
    },
    input: {
      flex: 1,
      color: colors.n900,
      height: '100%',
    },
    errorText: {
      ...sizes.typography.caption,
      color: colors.danger,
      marginTop: sizes.spacing.xs,
      marginLeft: sizes.spacing.xs,
    },
  };
};
