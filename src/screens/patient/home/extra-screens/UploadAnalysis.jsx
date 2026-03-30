import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Screen } from '../../../../components/ui/Screen';
import { Button } from '../../../../components/ui/Button';
import { Icon } from '../../../../components/ui/Icon';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../theme/ThemeContext';
import { useStyles } from '../../../../theme/useStyles';
import { usePatientDashboard } from '../../../../context/PatientDashboardContext';

export function UploadAnalysis() {
  const { sizes, colors } = useTheme();
  const { t } = useTranslation();
  const styles = useStyles(themeStyles);
  const { navigateToDashboard } = usePatientDashboard();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon 
          name="ArrowLeft" 
          size={sizes.scale(24)} 
          color={colors.p500} 
          onPress={navigateToDashboard}
          style={styles.backButton}
        />
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title}>{t('dashboard.upload_analysis_title')}</Text>
        <Text style={styles.subtitle}>{t('dashboard.upload_analysis_subtitle')}</Text>

        <TouchableOpacity style={styles.uploadArea} activeOpacity={0.7}>
          <View style={styles.iconWrapper}>
            <Icon name="Upload" size={sizes.scale(24)} color={colors.p500} />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Button 
          title={t('dashboard.upload_btn')} 
          variant="primary" 
          onPress={() => console.log('Uploading file...')}
        />
      </View>
    </View>
  );
}

const themeStyles = (theme) => ({
  container: {
    flex: 1,
    paddingHorizontal: theme.sizes.spacing.l,
    backgroundColor: theme.colors.bg,
  },
  header: {
    paddingTop: theme.sizes.spacing.s,
    marginBottom: theme.sizes.spacing.l,
    height: theme.sizes.scale(40),
    justifyContent: 'center',
  },
  backButton: {
    marginLeft: -theme.sizes.spacing.xs,
  },
  content: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    ...theme.sizes.typography.h2,
    color: theme.colors.n900,
    marginBottom: theme.sizes.spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n500,
    textAlign: 'center',
    marginBottom: theme.sizes.scale(32),
  },
  uploadArea: {
    width: '100%',
    height: theme.sizes.scale(240),
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.n900,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  iconWrapper: {
    width: theme.sizes.scale(48),
    height: theme.sizes.scale(48),
    borderRadius: theme.sizes.scale(12),
    backgroundColor: theme.colors.p100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    paddingBottom: theme.sizes.spacing.xl, 
  }
});
