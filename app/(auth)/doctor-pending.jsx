import React from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '../../src/components/ui/Screen';
import { Button } from '../../src/components/ui/Button';
import { useTheme } from '../../src/theme/ThemeContext';
import { useStyles } from '../../src/theme/useStyles';
import { Icon } from '../../src/components/ui/Icon';

export default function DoctorPending() {
  const router = useRouter();
  const { t } = useTranslation();
  const { sizes, colors } = useTheme();
  const styles = useStyles(themeStyles);

  const handleOk = () => {
    router.replace('/(doctor)/');
  };

  return (
    <Screen style={styles.container}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View style={styles.loader}>
              <Icon name="Loader" size={sizes.scale(48)} color={colors.p500} />
            </View>
            <Text style={styles.headerText}>{t('auth.doc_verification_progress')}</Text>
          </View>
          
          <Text style={styles.timeText}>{t('auth.doc_estimated_time')}</Text>
          <Text style={styles.notifyText}>{t('auth.doc_notify')}</Text>

          <Button 
            title={t('auth.ok_btn')} 
            variant="primary" 
            onPress={handleOk}
            style={styles.button}
          />
        </View>
      </View>
    </Screen>
  );
}

const themeStyles = (theme) => ({
  container: {
    backgroundColor: theme.colors.bg, 
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.sizes.spacing.l,
    backgroundColor: 'rgba(23, 43, 46, 0.4)' // n900 with opacity
  },
  modalContent: {
    width: '100%',
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.xl,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.sizes.spacing.l,
  },
  loader: {
    marginBottom: theme.sizes.spacing.m,
  },
  headerText: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n900,
    textAlign: 'center',
  },
  timeText: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n700,
    marginBottom: theme.sizes.spacing.xs,
  },
  notifyText: {
    ...theme.sizes.typography.bodySmall,
    color: theme.colors.n500,
    marginBottom: theme.sizes.spacing.xl,
    textAlign: 'center',
  },
  button: {
    width: '100%',
  }
});
