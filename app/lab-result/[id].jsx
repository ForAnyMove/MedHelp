import React from 'react';
import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Screen } from '../../src/components/ui/Screen';
import { useStyles } from '../../src/theme/useStyles';

export default function LabResultDeepLinkPlaceholder() {
  const { id } = useLocalSearchParams();
  const styles = useStyles(localStyles);

  return (
    <Screen style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Lab Result</Text>
        <Text style={styles.text}>This screen will be implemented in TASK-09.</Text>
        <Text style={styles.text}>Lab Result ID: {id}</Text>
      </View>
    </Screen>
  );
}

const localStyles = (theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.sizes.spacing.xl,
  },
  title: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n900,
    marginBottom: theme.sizes.spacing.m,
  },
  text: {
    ...theme.sizes.typography.body,
    color: theme.colors.n700,
    textAlign: 'center',
    marginBottom: theme.sizes.spacing.xs,
  }
});
