import React from 'react';
import { View, Text } from 'react-native';
import { useStyles } from '../../theme/useStyles';

export function NotificationBadge({ count, style }) {
  const styles = useStyles(themeStyles);

  if (!count || count <= 0) return null;

  return (
    <View style={[styles.badgeContainer, style]}>
      <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
}

const themeStyles = (theme) => ({
  badgeContainer: {
    position: 'absolute',
    top: theme.sizes.scale(-4),
    right: theme.sizes.scale(-8),
    backgroundColor: theme.colors.danger || /* TODO: color */ '#FF7E7E',
    minWidth: theme.sizes.scale(18),
    height: theme.sizes.scale(18),
    borderRadius: theme.sizes.scale(9),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.sizes.scale(4),
    zIndex: 10,
    borderWidth: 1.5,
    borderColor: theme.colors.white,
  },
  badgeText: {
    ...theme.sizes.typography.caption,
    fontSize: theme.sizes.scale(10),
    lineHeight: theme.sizes.scale(12),
    color: theme.colors.white,
    fontFamily: 'Manrope_700Bold',
  },
});
