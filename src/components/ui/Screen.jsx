import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useStyles } from '../../theme/useStyles';

export function Screen({ children, style }) {
  const styles = useStyles(themeStyles);
  
  return (
    <SafeAreaView style={[styles.container, style]}>
      <StatusBar style="auto" />
      {children}
    </SafeAreaView>
  );
}

const themeStyles = (theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});
