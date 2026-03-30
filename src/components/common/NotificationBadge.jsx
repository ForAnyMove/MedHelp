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
    top: -4,
    right: -8,
    backgroundColor: theme.colors.danger || '#FF7E7E',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    zIndex: 10,
    borderWidth: 1.5,
    borderColor: theme.colors.white,
  },
  badgeText: {
    ...theme.sizes.typography.caption,
    fontSize: 10,
    lineHeight: 12,
    color: theme.colors.white,
    fontFamily: 'Manrope_700Bold',
  },
});
