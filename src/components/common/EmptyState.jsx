import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useStyles } from '../../theme/useStyles';
import { Icon } from '../ui/Icon';

/**
 * Universal empty state for any list or section.
 *
 * Props:
 *   icon         {string}  — Lucide icon name (default: 'Inbox')
 *   title        {string}  — Primary message
 *   description  {string}  — Secondary description (optional)
 *   actionLabel  {string}  — CTA button label (optional)
 *   onAction     {fn}      — CTA callback (optional)
 */
export function EmptyState({
  icon = 'Inbox',
  title = 'Nothing here yet',
  description,
  actionLabel,
  onAction,
}) {
  const styles = useStyles(themeStyles);

  return (
    <View style={styles.container}>
      <View style={styles.iconBox}>
        <Icon name={icon} size={36} color={styles.iconColor.color} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {actionLabel && onAction ? (
        <TouchableOpacity style={styles.btn} onPress={onAction} activeOpacity={0.8}>
          <Text style={styles.btnText}>{actionLabel}</Text>
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
    backgroundColor: theme.colors.p100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.sizes.spacing.l,
  },
  iconColor: {
    color: theme.colors.p500,
  },
  title: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n900,
    fontFamily: 'Manrope_700Bold',
    textAlign: 'center',
    marginBottom: theme.sizes.spacing.s,
  },
  description: {
    ...theme.sizes.typography.bodySmall,
    color: theme.colors.n500,
    textAlign: 'center',
    marginBottom: theme.sizes.spacing.xl,
  },
  btn: {
    backgroundColor: theme.colors.p500,
    paddingHorizontal: theme.sizes.spacing.xl,
    paddingVertical: theme.sizes.spacing.m,
    borderRadius: theme.sizes.borderRadius.full,
  },
  btnText: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.white,
    fontFamily: 'Manrope_700Bold',
  },
});
