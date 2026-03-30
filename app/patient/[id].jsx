import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Screen } from '../../src/components/ui/Screen';
import { Icon } from '../../src/components/ui/Icon';
import { useStyles } from '../../src/theme/useStyles';
import { useTranslation } from 'react-i18next';

export default function PatientCardDeepLink() {
  const { id } = useLocalSearchParams();
  const styles = useStyles(localStyles);
  const { t } = useTranslation();

  return (
    <Screen style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/home')} style={styles.backButton}>
          <Icon name="ArrowLeft" size={24} color={styles.iconColor.color} />
        </TouchableOpacity>
        <Text style={styles.title}>Patient Identity</Text>
      </View>
      
      <View style={styles.content}>
        <Icon name="Users" size={64} color={styles.iconColor.color} />
        <Text style={styles.message}>
          Loading Patient Record...
        </Text>
        <Text style={styles.subMessage}>Patient ID: {id}</Text>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => router.replace('/home')}
        >
          <Text style={styles.actionText}>{t('doctor_tabs.home', 'Go to Dashboard')}</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

const localStyles = (theme) => ({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.sizes.spacing.m,
    paddingVertical: theme.sizes.spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.n300,
  },
  backButton: { padding: theme.sizes.spacing.s, marginRight: theme.sizes.spacing.s },
  iconColor: { color: theme.colors.n700 },
  title: { ...theme.sizes.typography.h3, color: theme.colors.n900, fontFamily: 'Manrope_700Bold' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.sizes.spacing.xl },
  message: { ...theme.sizes.typography.h4, color: theme.colors.n700, marginTop: theme.sizes.spacing.l, textAlign: 'center' },
  subMessage: { ...theme.sizes.typography.body, color: theme.colors.n500, marginTop: theme.sizes.spacing.s },
  actionButton: { marginTop: theme.sizes.spacing.xxl, backgroundColor: theme.colors.p500, paddingHorizontal: theme.sizes.spacing.xl, paddingVertical: theme.sizes.spacing.m, borderRadius: 100 },
  actionText: { ...theme.sizes.typography.body, color: theme.colors.white, fontFamily: 'Manrope_700Bold' }
});
