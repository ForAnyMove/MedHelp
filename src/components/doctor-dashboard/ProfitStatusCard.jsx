import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useStyles } from '../../theme/useStyles';

export function ProfitStatusCard({ profit }) {
  const { t } = useTranslation();
  const styles = useStyles(themeStyles);

  return (
    <View style={styles.profitSection}>
      <Text style={styles.sectionTitle}>{t('doctor_dashboard.profit_month')}</Text>
      <View style={styles.profitCard}>
        <Text style={styles.profitValue}>{profit}$</Text>
      </View>
    </View>
  );
}

const themeStyles = (theme) => ({
  profitSection: {
    marginBottom: theme.sizes.spacing.l,
  },
  sectionTitle: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n700,
    marginBottom: theme.sizes.spacing.s,
  },
  profitCard: {
    backgroundColor: theme.colors.opacityP400,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.scale(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  profitValue: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n700,
    fontFamily: 'Manrope_600SemiBold',
  }
});
