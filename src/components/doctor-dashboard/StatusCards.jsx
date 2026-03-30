import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeContext';
import { useStyles } from '../../theme/useStyles';
import { Icon } from '../ui/Icon';

export function StatusCards({ consultationCount, profit, onConsultationPress }) {
  const { colors, sizes } = useTheme();
  const { t } = useTranslation();
  const styles = useStyles(themeStyles);

  return (
    <View style={styles.container}>
      <TouchableOpacity activeOpacity={0.9} onPress={onConsultationPress}>
        <View style={styles.todayCard}>
          <Text style={styles.todayHeader}>{t('common.today')}</Text>
          <View style={styles.todayContent}>
             <View style={styles.todayWhiteBox}>
               <Icon name="Stethoscope" size={20} color={colors.p500} />
               <Text style={styles.todayText}>
                 {t('doctor_dashboard.today_consultations', { count: consultationCount })}
               </Text>
               <Icon name="ChevronRight" size={20} color={colors.p500} />
             </View>
          </View>
        </View>
      </TouchableOpacity>

      <View style={styles.profitSection}>
        <Text style={styles.sectionTitle}>{t('doctor_dashboard.profit_month')}</Text>
        <View style={styles.profitCard}>
           <Text style={styles.profitValue}>{profit}$</Text>
        </View>
      </View>
    </View>
  );
}

const themeStyles = (theme) => ({
  container: {
    marginBottom: theme.sizes.spacing.l,
  },
  todayCard: {
    backgroundColor: theme.colors.p400,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.l,
    height: theme.sizes.scale(120),
    justifyContent: 'space-between',
    marginBottom: theme.sizes.spacing.xl,
  },
  todayHeader: {
    ...theme.sizes.typography.h3,
    color: theme.colors.white,
    fontFamily: 'Manrope_700Bold',
  },
  todayContent: {
    flex: 1,
    justifyContent: 'center',
    marginTop: theme.sizes.spacing.s,
  },
  todayWhiteBox: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.full,
    paddingVertical: theme.sizes.spacing.m,
    paddingHorizontal: theme.sizes.spacing.l,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  todayText: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n900,
    fontFamily: 'Manrope_600SemiBold',
    flex: 1,
    marginLeft: theme.sizes.spacing.s,
  },
  profitSection: {
    marginTop: theme.sizes.spacing.l,
  },
  sectionTitle: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n900,
    marginBottom: theme.sizes.spacing.m,
  },
  profitCard: {
    backgroundColor: '#E0F9F6',
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.l,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profitValue: {
    ...theme.sizes.typography.h2,
    color: theme.colors.n900,
    fontFamily: 'Manrope_700Bold',
  }
});
