import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon } from '../ui/Icon';
import { useTheme } from '../../theme/ThemeContext';
import { useStyles } from '../../theme/useStyles';

export function HealthIndications() {
  const { sizes, colors } = useTheme();
  const { t } = useTranslation();
  const styles = useStyles(themeStyles);

  const indicators = [
    { id: 'pulse', label: t('dashboard.pulse'), icon: 'Activity', color: colors.sCoral, isAdd: false, extra: `68 ${t('dashboard.bpm')}` },
    { id: 'bp', label: t('dashboard.blood_pressure'), icon: 'Heart', color: colors.primary, isAdd: false, extra: '120/80' },
    { id: 'temp', label: t('dashboard.temperature'), icon: 'Thermometer', color: colors.warning, isAdd: false, extra: '36.6 °C' },
    { id: 'bmi', label: t('dashboard.bmi'), icon: 'User', color: colors.info, isAdd: false, extra: '22.5' },
    { id: 'devices', label: t('dashboard.my_devices'), icon: 'Smartphone', color: colors.n400, isAdd: true },
    { id: 'waist', label: t('dashboard.w_circumference'), icon: 'Scissors', color: colors.primary, isAdd: false, extra: `82 ${t('dashboard.cm')}` },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{t('dashboard.health_indications')}</Text>
      <View style={styles.grid}>
        {indicators.map(item => (
          <TouchableOpacity 
            key={item.id} 
            style={[styles.card, item.isAdd && styles.cardAction]}
            activeOpacity={0.7}
          >
            <View style={styles.iconWrapper}>
              <Icon name={item.icon} size={sizes.scale(16)} color={item.color} />
            </View>
            <View style={styles.textStack}>
              <Text style={styles.title}>{item.label}</Text>
              {!item.isAdd && <Text style={styles.value}>{item.extra}</Text>}
            </View>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={styles.viewAllBtn} activeOpacity={0.7}>
        <Text style={styles.viewAllText}>{t('dashboard.view_all_indicators')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const themeStyles = (theme) => ({
  container: {
    marginBottom: theme.sizes.spacing.xl,
  },
  sectionTitle: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n900,
    marginBottom: theme.sizes.spacing.m,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: theme.sizes.spacing.s,
    marginBottom: theme.sizes.spacing.m,
  },
  card: {
    width: '31%', // Responsive grid distribution
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.medium,
    padding: theme.sizes.spacing.m,
    height: theme.sizes.scale(120),
    justifyContent: 'space-between',
    shadowColor: theme.colors.n900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: theme.sizes.spacing.s,
  },
  cardAction: {
    borderWidth: 1,
    borderColor: theme.colors.p500,
    shadowOpacity: 0,
    elevation: 0,
  },
  iconWrapper: {
    width: theme.sizes.scale(28),
    height: theme.sizes.scale(28),
    borderRadius: theme.sizes.scale(8),
    backgroundColor: theme.colors.p100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textStack: {
    
  },
  title: {
    ...theme.sizes.typography.caption,
    color: theme.colors.n900,
    fontWeight: '600',
    marginBottom: theme.sizes.scale(4),
  },
  value: {
    ...theme.sizes.typography.caption,
    color: theme.colors.n500,
  },
  footerLink: {
    alignItems: 'center',
    paddingVertical: theme.sizes.spacing.s,
  },
  linkText: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.p500,
    fontWeight: '600',
  }
});
