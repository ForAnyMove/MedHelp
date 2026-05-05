import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useComponentContext } from '../../context/GlobalContext';
import { Icon } from '../ui/Icon';
import { useTheme } from '../../theme/ThemeContext';
import { useStyles } from '../../theme/useStyles';
import { ConsultationReminderCard } from './components/ConsultationReminderCard';

export function Reminders() {
  const { sizes } = useTheme();
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
        {bookings.map((booking) => (
          <ConsultationReminderCard 
            key={booking.id} 
            booking={booking} 
            cardWidth={cardWidth} 
          />
        ))}
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
