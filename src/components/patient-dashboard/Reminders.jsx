import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useComponentContext } from '../../context/GlobalContext';
import { Icon } from '../ui/Icon';
import { useTheme } from '../../theme/ThemeContext';
import { useStyles } from '../../theme/useStyles';
import { formatIsoDate } from '../../utils/dateUtils';

export function Reminders() {
  const { sizes, colors } = useTheme();
  const { t } = useTranslation();
  const { consultationController } = useComponentContext();
  const styles = useStyles(themeStyles);
  
  const booking = consultationController.upcomingBooking;

  if (!booking) return null;

  const { slot, doctor } = booking;
  const day = formatIsoDate(slot.date, 'day', t);
  const localizedMonth = formatIsoDate(slot.date, 'month', t);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{t('dashboard.reminders')}</Text>
      <TouchableOpacity style={styles.card} activeOpacity={0.7}>
        <View style={styles.leftContent}>
          <View style={styles.dateBox}>
            <Text style={styles.dateTop}>{day}</Text>
            <Text style={styles.dateBottom}>{localizedMonth}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.title}>{t('dashboard.consultation_title')}</Text>
            <Text style={styles.desc}>{t('doctors.dr_prefix')}{doctor.firstName} {doctor.lastName} • {slot.time}</Text>
          </View>
        </View>
        <Icon name="ChevronRight" size={sizes.scale(20)} color={colors.p400} />
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
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.medium,
    padding: theme.sizes.spacing.m,
    shadowColor: theme.colors.n900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateBox: {
    width: theme.sizes.scale(48),
    height: theme.sizes.scale(48),
    borderRadius: theme.sizes.scale(12),
    backgroundColor: `${theme.colors.sCoral}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.sizes.spacing.m,
  },
  dateTop: {
    ...theme.sizes.typography.bodyLarge,
    fontWeight: '700',
    color: theme.colors.sCoral,
    lineHeight: theme.sizes.scale(20),
  },
  dateBottom: {
    ...theme.sizes.typography.caption,
    color: theme.colors.sCoral,
  },
  title: {
    ...theme.sizes.typography.bodyLarge,
    fontWeight: '600',
    color: theme.colors.n900,
    marginBottom: theme.sizes.scale(2),
  },
  desc: {
    ...theme.sizes.typography.caption,
    color: theme.colors.n500,
  }
});
