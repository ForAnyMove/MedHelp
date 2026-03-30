import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useStyles } from '../../theme/useStyles';
import { Icon } from '../ui/Icon';

/**
 * Universal error state for failed data-fetching.
 *
 * Props:
 *   message  {string}  — Error description shown to user
 *   onRetry  {fn}      — Retry callback
 */
export function ErrorState({
  message = 'Something went wrong. Please try again.',
  onRetry,
}) {
  const styles = useStyles(themeStyles);

  return (
    <View style={styles.container}>
      <View style={styles.iconBox}>
        <Icon name="AlertCircle" size={36} color={styles.iconColor.color} />
      </View>
      <Text style={styles.title}>Oops!</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? (
        <TouchableOpacity style={styles.btn} onPress={onRetry} activeOpacity={0.8}>
          <Icon name="RefreshCcw" size={16} color={styles.btnIcon.color} />
          <Text style={styles.btnText}>Try again</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const themeStyles = (theme) => ({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.sizes.spacing.xxl,
    paddingHorizontal: theme.sizes.spacing.xl,
  },
  iconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.sizes.spacing.l,
  },
  iconColor: {
    color: theme.colors.danger,
  },
  title: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n900,
    fontFamily: 'Manrope_700Bold',
    marginBottom: theme.sizes.spacing.s,
  },
  message: {
    ...theme.sizes.typography.bodySmall,
    color: theme.colors.n500,
    textAlign: 'center',
    marginBottom: theme.sizes.spacing.xl,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.sizes.spacing.s,
    backgroundColor: theme.colors.n100,
    paddingHorizontal: theme.sizes.spacing.xl,
    paddingVertical: theme.sizes.spacing.m,
    borderRadius: theme.sizes.borderRadius.full,
  },
  btnIcon: {
    color: theme.colors.n900,
  },
  btnText: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n900,
    fontFamily: 'Manrope_600SemiBold',
  },
});
