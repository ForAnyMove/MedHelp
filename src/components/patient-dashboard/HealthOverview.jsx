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
            <Icon name="CheckCircle2" size={sizes.scale(16)} color={colors.white} />
            <Text style={styles.statusText}>{t('dashboard.all_good')}</Text>
          </View>
          <Text style={styles.timeText}>{t('dashboard.last_2_months')}</Text>
        </View>

        <Text style={styles.description}>{t('dashboard.overview_desc')}</Text>

        <Button 
          title={t('dashboard.explain_results_btn')} 
          variant="primary" 
          style={styles.button}
        />
      </View>
    </View>
  );
}

const themeStyles = (theme) => ({
  container: {
    backgroundColor: theme.colors.p400,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.xl,
  },
  title: {
    ...theme.sizes.typography.h3,
    color: theme.colors.white,
    marginBottom: theme.sizes.spacing.m,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.medium,
    padding: theme.sizes.spacing.m,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.sizes.spacing.s,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.p500,
    paddingHorizontal: theme.sizes.spacing.s,
    paddingVertical: theme.sizes.scale(4),
    borderRadius: theme.sizes.borderRadius.full,
  },
  statusText: {
    ...theme.sizes.typography.caption,
    color: theme.colors.white,
    marginLeft: theme.sizes.spacing.xs,
    fontWeight: 'bold',
  },
  timeText: {
    ...theme.sizes.typography.caption,
    color: theme.colors.n500,
  },
  description: {
    ...theme.sizes.typography.bodySmall,
    color: theme.colors.n900,
    marginBottom: theme.sizes.spacing.m,
  },
  button: {
    paddingVertical: theme.sizes.scale(10), // Slightly smaller button suitable for inside cards
  }
});
