import React from 'react';
import { View, Text } from 'react-native';
import { useStyles } from '../../../../theme/useStyles';

export function ProfileSection({ title, children }) {
  const styles = useStyles(themeStyles);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.card}>
        {children}
      </View>
    </View>
  );
}

const themeStyles = (theme) => ({
  container: {
    paddingHorizontal: theme.sizes.spacing.l,
    marginTop: theme.sizes.spacing.xl,
  },
  title: {
    ...theme.sizes.typography.h3,
    color: '#2D4A4A',
    fontWeight: '800',
    marginBottom: theme.sizes.spacing.m,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: 24,
    paddingHorizontal: theme.sizes.spacing.l,
    paddingVertical: theme.sizes.spacing.s,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
});
