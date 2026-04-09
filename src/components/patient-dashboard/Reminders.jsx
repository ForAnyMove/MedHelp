import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useComponentContext } from '../../context/GlobalContext';
import { Icon } from '../ui/Icon';
import { useTheme } from '../../theme/ThemeContext';
import { useStyles } from '../../theme/useStyles';
import { formatIsoDate } from '../../utils/dateUtils';

export function Reminders() {
  const { sizes, colors } = useTheme();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const { consultationController } = useComponentContext();
  const styles = useStyles(themeStyles);

  const bookings = consultationController.upcomingBookings;

  if (!bookings || bookings.length === 0) return null;

  const cardWidth = width - sizes.spacing.m * 2;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{t('dashboard.reminders')}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        snapToInterval={cardWidth + sizes.spacing.m}
        decelerationRate="fast"
        snapToAlignment="start"
      >
        {bookings.map((booking) => {
          const { slot, duration } = booking;
          const day = formatIsoDate(slot.date, 'day', t);
          const localizedMonth = formatIsoDate(slot.date, 'month', t);
          // Capitalize first letter of weekday
          const weekdayStr = formatIsoDate(slot.date, 'weekdayFull', t) || '';
          const weekday = weekdayStr.charAt(0).toUpperCase() + weekdayStr.slice(1);

          // Helper to format time like 09am, 10:30am
          const formatAmPm = (totalMinutes) => {
            const h = Math.floor(totalMinutes / 60);
            const m = totalMinutes % 60;
            const ampm = h >= 12 && h < 24 ? 'pm' : 'am';
            const h12 = h % 12 || 12;
            const hStr = h12 < 10 ? `0${h12}` : `${h12}`;
            const mStr = m === 0 ? '' : `:${m < 10 ? '0' + m : m}`;
            return `${hStr}${mStr}${ampm}`;
          };

          const startDate = new Date(slot.date);
          const startTotalMin = startDate.getHours() * 60 + startDate.getMinutes();
          const endTotalMin = startTotalMin + (duration || 60);

          const startFormatted = formatAmPm(startTotalMin);
          const endFormatted = formatAmPm(endTotalMin);

          return (
            <TouchableOpacity key={booking.id} style={[styles.card, { width: cardWidth }]} activeOpacity={0.7}>
              <View style={styles.leftContent}>
                <View style={styles.dateBox}>
                  <Text style={styles.dateTop}>{day}</Text>
                  <Text style={styles.dateBottom}>{localizedMonth}</Text>
                </View>
                <View style={[styles.infoCol, { maxWidth: cardWidth * 0.6 }]}>
                  <Text style={styles.title}>{t('dashboard.consultation_title')}</Text>
                  <Text style={styles.desc} numberOfLines={1} ellipsizeMode="tail">{weekday} • {startFormatted} - {endFormatted}</Text>
                </View>
              </View>
              <Icon name="arrow-right" size={sizes.scale(24)} color={colors.p400} />
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const themeStyles = (theme) => ({
  container: {
    marginBottom: theme.sizes.spacing.m,
  },
  sectionTitle: {
    ...theme.sizes.typography.h3,
    fontWeight: '700',
    color: theme.colors.n700,
  },
  scrollContent: {
    gap: theme.sizes.spacing.m,
    paddingRight: theme.sizes.spacing.l, // Space at the very end of scroll
    paddingVertical: theme.sizes.spacing.s,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
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
    borderRadius: theme.sizes.scale(14),
    backgroundColor: `${theme.colors.sCoral}32`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.sizes.spacing.m,
  },
  dateTop: {
    ...theme.sizes.typography.h3,
    fontWeight: '700',
    lineHeight: theme.sizes.scale(20),
    color: theme.colors.sCoral,
  },
  dateBottom: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.sCoral,
  },
  infoCol: {
    maxWidth: '80%',
  },
  title: {
    ...theme.sizes.typography.h4,
    lineHeight: theme.sizes.scale(28),
    color: theme.colors.n700,
    marginBottom: theme.sizes.scale(2),
  },
  desc: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n500,
  }
});
