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
    paddingHorizontal: theme.sizes.spacing.m,
    marginTop: theme.sizes.spacing.l,
  },
  title: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n700,
    marginBottom: theme.sizes.spacing.m,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    paddingHorizontal: theme.sizes.spacing.m,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
});
