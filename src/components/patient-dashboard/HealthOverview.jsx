import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { useTheme } from '../../theme/ThemeContext';
import { useStyles } from '../../theme/useStyles';

export function HealthOverview() {
  const { sizes, colors } = useTheme();
  const { t } = useTranslation();
  const styles = useStyles(themeStyles);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('dashboard.health_overview_title')}</Text>
      
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.statusChip}>
            <View  style={styles.statusChipIcon}>
              <Icon name="check2" size={sizes.scale(16)} color={colors.white} />
            </View>
            <Text style={styles.statusText}>{t('dashboard.all_good')}</Text>
          </View>
          <Text style={styles.timeText}>{t('dashboard.last_2_months')}</Text>
        </View>

        <Text style={styles.description}>{t('dashboard.overview_desc')}</Text>

        <Button 
          title={t('dashboard.explain_results_btn')} 
          variant="primary" 
          style={styles.button}
          textStyle={styles.buttonText}
        />
      </View>
    </View>
  );
}

const themeStyles = (theme) => ({
  container: {
    backgroundColor: theme.colors.p400,
    borderRadius: theme.sizes.borderRadius.large,
    paddingHorizontal: theme.sizes.spacing.m,
    paddingTop: theme.sizes.spacing.s,
    paddingBottom: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.l,
  },
  title: {
    ...theme.sizes.typography.h4,
    color: theme.colors.white,
    marginBottom: theme.sizes.spacing.s,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.m,
    marginBottom: theme.sizes.scale(2),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.sizes.spacing.m,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.p500,
    paddingHorizontal: theme.sizes.spacing.s,
    paddingVertical: theme.sizes.scale(4),
    borderRadius: theme.sizes.borderRadius.full,
  },
  statusChipIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.sizes.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.white,
  },
  statusText: {
    fontSize: theme.sizes.scale(16),
    fontFamily: 'Manrope_600SemiBold',
    color: theme.colors.white,
    marginLeft: theme.sizes.spacing.xs,
  },
  timeText: {
    ...theme.sizes.typography.bodySmall,
    color: theme.colors.n500,
  },
  description: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n700,
    marginBottom: theme.sizes.spacing.m,
  },
  button: {
    paddingVertical: theme.sizes.scale(10), // Slightly smaller button suitable for inside cards
  },
  buttonText: {
    fontSize: theme.sizes.scale(18),
    fontFamily: 'Manrope_600SemiBold',
    color: theme.colors.white,
  }
});
