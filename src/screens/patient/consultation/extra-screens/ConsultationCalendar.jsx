import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../theme/ThemeContext';
import { useStyles } from '../../../../theme/useStyles';
import { Icon } from '../../../../components/ui/Icon';
import { Button } from '../../../../components/ui/Button';

export function ConsultationCalendar({ visible, bookings, onClose, onSelectBooking }) {
  const { t } = useTranslation();
  const { colors, sizes } = useTheme();
  const styles = useStyles(themeStyles);
  const [selectedDay, setSelectedDay] = useState(null);

  // Simple mock calendar for March 2026
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const bookingsByDay = bookings.reduce((acc, b) => {
    // In real app we parse booking.createdAt or slot.date
    // Mocking: map some bookings to day 18, 20, 22
    const day = b.slot ? (parseInt(b.slot.date) || 18) : (parseInt(b.date) || 10); 
    if (!acc[day]) acc[day] = [];
    acc[day].push(b);
    return acc;
  }, {});

  const renderDay = (day) => {
    const dayBookings = bookingsByDay[day] || [];
    const hasBookings = dayBookings.length > 0;
    const isSelected = selectedDay === day;

    return (
      <TouchableOpacity 
        key={day} 
        style={[styles.dayCell, isSelected && styles.selectedDay]}
        onPress={() => setSelectedDay(day)}
      >
        <Text style={[styles.dayText, isSelected && styles.selectedDayText]}>{day}</Text>
        {hasBookings && <View style={styles.dot} />}
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('consultation.calendar_title')}</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="X" size={24} color={colors.n900} />
            </TouchableOpacity>
          </View>

          <View style={styles.calendarGrid}>
            <View style={styles.weekDays}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                <Text key={d} style={styles.weekDayText}>{d}</Text>
              ))}
            </View>
            <View style={styles.daysContainer}>
              {days.map(renderDay)}
            </View>
          </View>

          <View style={styles.bookingsSection}>
            <Text style={styles.sectionSubtitle}>
              {selectedDay ? `${t('doctors.booking_summary')} - ${selectedDay}` : t('consultation.select_day_hint')}
            </Text>
            <ScrollView style={styles.bookingsList}>
              {selectedDay && bookingsByDay[selectedDay] ? (
                bookingsByDay[selectedDay].map(b => (
                  <TouchableOpacity 
                    key={b.id} 
                    style={styles.bookingItem}
                    onPress={() => onSelectBooking(b)}
                  >
                    <View style={styles.bookingTimeBox}>
                       <Text style={styles.bookingTime}>{b.slot?.time || b.duration || '--:--'}</Text>
                    </View>
                    <View style={styles.bookingInfo}>
                      <Text style={styles.bookingDoctor}>{t('doctors.dr_prefix')}{b.doctor.firstName} {b.doctor.lastName}</Text>
                      <Text style={styles.bookingSpec}>{b.doctor.specialization}</Text>
                    </View>
                    <Icon name="ChevronRight" size={20} color={colors.n400} />
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.noBookingsText}>{t('consultation.no_scheduled')}</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const themeStyles = (theme) => ({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '80%',
    padding: theme.sizes.spacing.l,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.sizes.spacing.l,
  },
  modalTitle: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n900,
  },
  calendarGrid: {
    backgroundColor: '#F8FBFB',
    borderRadius: 24,
    padding: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.l,
  },
  weekDays: {
    flexDirection: 'row',
    marginBottom: theme.sizes.spacing.s,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    ...theme.sizes.typography.caption,
    color: theme.colors.n400,
    fontWeight: '700',
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
    borderRadius: 10,
  },
  selectedDay: {
    backgroundColor: theme.colors.p500,
  },
  dayText: {
    ...theme.sizes.typography.body,
    color: theme.colors.n900,
  },
  selectedDayText: {
    color: theme.colors.white,
    fontWeight: '700',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.p500,
    position: 'absolute',
    bottom: 4,
  },
  bookingsSection: {
    flex: 1,
  },
  sectionSubtitle: {
    ...theme.sizes.typography.body,
    fontWeight: '700',
    color: theme.colors.n900,
    marginBottom: theme.sizes.spacing.m,
  },
  bookingsList: {
    flex: 1,
  },
  bookingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: theme.sizes.spacing.s,
    marginBottom: theme.sizes.spacing.s,
    borderWidth: 1,
    borderColor: '#F0F3F3',
  },
  bookingTimeBox: {
    backgroundColor: '#F0F8F7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: theme.sizes.spacing.m,
  },
  bookingTime: {
    ...theme.sizes.typography.caption,
    fontWeight: '700',
    color: theme.colors.p500,
  },
  bookingInfo: {
    flex: 1,
  },
  bookingDoctor: {
    ...theme.sizes.typography.bodySmall,
    fontWeight: '600',
    color: theme.colors.n900,
  },
  bookingSpec: {
    ...theme.sizes.typography.caption,
    color: theme.colors.n500,
  },
  noBookingsText: {
    ...theme.sizes.typography.caption,
    color: theme.colors.n400,
    textAlign: 'center',
    marginTop: theme.sizes.spacing.xl,
  }
});
