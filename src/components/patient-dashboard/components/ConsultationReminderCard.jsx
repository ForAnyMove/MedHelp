import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon } from '../../ui/Icon';
import { useTheme } from '../../../theme/ThemeContext';
import { useStyles } from '../../../theme/useStyles';
import { formatIsoDate } from '../../../utils/dateUtils';
import { getEstimatedServerDate } from '../../../hooks/useServerTime';

export function ConsultationReminderCard({ booking, cardWidth }) {
  const { sizes, colors } = useTheme();
  const { t } = useTranslation();
  const styles = useStyles(themeStyles);

  const [displayText, setDisplayText] = useState('');
  
  useEffect(() => {
    const updateTime = () => {
      const serverNow = getEstimatedServerDate();
      const startAt = new Date(booking.slot.date);
      const diffMs = startAt - serverNow;
      const diffMin = Math.floor(diffMs / 60000);

      if (diffMin <= 0) {
        setDisplayText(t('dashboard.consultation_started'));
        return;
      }

      if (diffMin < 60) {
        // Less than an hour - show minutes
        setDisplayText(t('dashboard.starts_in_minutes', { count: diffMin }));
      } else {
        // More than an hour - show time/date
        const isToday = serverNow.toDateString() === startAt.toDateString();
        const timeStr = startAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        
        if (isToday) {
          setDisplayText(timeStr);
        } else {
          const dateStr = `${startAt.getDate().toString().padStart(2, '0')}.${(startAt.getMonth() + 1).toString().padStart(2, '0')}`;
          setDisplayText(`${timeStr}, ${dateStr}`);
        }
      }
    };

    updateTime();
    const timer = setInterval(updateTime, 30000); // Check every 30s
    return () => clearInterval(timer);
  }, [booking.slot.date, t]);

  const { slot } = booking;
  const day = formatIsoDate(slot.date, 'day', t);
  const localizedMonth = formatIsoDate(slot.date, 'month', t);

  return (
    <TouchableOpacity style={[styles.card, { width: cardWidth }]} activeOpacity={0.7}>
      <View style={styles.leftContent}>
        <View style={styles.dateBox}>
          <Text style={styles.dateTop}>{day}</Text>
          <Text style={styles.dateBottom}>{localizedMonth}</Text>
        </View>
        <View style={[styles.infoCol, { maxWidth: cardWidth * 0.7 }]}>
          <Text style={styles.title}>{t('dashboard.consultation_title')}</Text>
          <Text style={styles.desc} numberOfLines={1}>{displayText}</Text>
        </View>
      </View>
      <Icon name="arrow-right" size={sizes.scale(24)} color={colors.p400} />
    </TouchableOpacity>
  );
}

const themeStyles = (theme) => ({
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
    ...theme.sizes.typography.h4,
    fontWeight: '700',
    color: theme.colors.sCoral,
  },
  dateBottom: {
    ...theme.sizes.typography.caption,
    fontSize: theme.sizes.scale(10),
    textTransform: 'uppercase',
    color: theme.colors.sCoral,
  },
  infoCol: {
    marginLeft: theme.sizes.spacing.xs,
  },
  title: {
    ...theme.sizes.typography.h4,
    color: theme.colors.n700,
  },
  desc: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n500,
  }
});
