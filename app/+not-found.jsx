import { Link, Stack } from 'expo-router';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../src/theme/ThemeContext';
import { useStyles } from '../src/theme/useStyles';
import { Icon } from '../src/components/ui/Icon';
import { Button } from '../src/components/ui/Button';

export default function NotFoundScreen() {
  const { t } = useTranslation();
  const { colors, sizes } = useTheme();
  const styles = useStyles(themeStyles);

  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <Icon name="alert-triangle" size={sizes.scale(64)} color={colors.warning} />
        </View>
        <Text style={styles.title}>Oops! Page not found.</Text>
        <Text style={styles.subtitle}>
          The screen you are looking for doesn't exist or has been moved.
        </Text>
        <Link href="/" asChild>
          <Button
            title="Go to Home"
            variant="primary"
            style={styles.button}
          />
        </Link>
      </View>
    </>
  );
}

const themeStyles = (theme) => ({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.sizes.spacing.xl,
    backgroundColor: theme.colors.bg,
  },
  iconContainer: {
    width: theme.sizes.scale(120),
    height: theme.sizes.scale(120),
    borderRadius: theme.sizes.scale(60),
    backgroundColor: theme.colors.warning + '1A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.sizes.spacing.xl,
  },
  title: {
    ...theme.sizes.typography.h2,
    color: theme.colors.n900,
    fontFamily: 'Manrope_700Bold',
    marginBottom: theme.sizes.spacing.s,
    textAlign: 'center',
  },
  subtitle: {
    ...theme.sizes.typography.body,
    color: theme.colors.n500,
    textAlign: 'center',
    marginBottom: theme.sizes.spacing.xxl,
    paddingHorizontal: theme.sizes.spacing.l,
    lineHeight: 24,
  },
  button: {
    minWidth: 200,
  }
});
