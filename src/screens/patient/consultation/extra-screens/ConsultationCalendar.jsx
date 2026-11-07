import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../theme/ThemeContext';
import { useStyles } from '../../../../theme/useStyles';
import { useResponsive } from '../../../../theme/useResponsive';
import { Icon } from '../../../../components/ui/Icon';

export function ConsultationCalendar({ visible, bookings = [], onClose, onSelectBooking }) {
  const { sizes, colors } = useTheme();
  const responsive = useResponsive();
  const isCenteredModal = responsive?.modalMode === 'centeredModal' || (!responsive?.isPortraitShell && (responsive?.isTablet || responsive?.isDesktop || responsive?.isDesktopLarge));
  const isTwoColumn = !responsive?.isPortraitShell && (responsive?.isTabletLandscape || responsive?.isDesktop || responsive?.isDesktopWide || responsive?.isUltrawide);
  const { t, i18n } = useTranslation();
  const styles = useStyles(themeStyles);
  const lang = i18n.language === 'ru' ? 'ru-RU' : 'en-US';

  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState(() => now.getDate());

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0

  const leadingEmptyDays = Array.from({ length: firstDayOfWeek }, (_, i) => `empty-${i}`);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const bookingsByDay = useMemo(() => {
    return (bookings || []).reduce((acc, b) => {
      const rawDate = b.slot?.start_at || b.slot?.date || b.date || b.created_at;
      let dayNum = null;
      if (rawDate) {
        const parsed = new Date(rawDate);
        if (!Number.isNaN(parsed.getTime())) {
          if (parsed.getFullYear() === year && parsed.getMonth() === month) {
            dayNum = parsed.getDate();
          }
        } else {
          const fallbackInt = parseInt(rawDate, 10);
          if (!Number.isNaN(fallbackInt)) dayNum = fallbackInt;
        }
      }
      if (dayNum) {
        if (!acc[dayNum]) acc[dayNum] = [];
        acc[dayNum].push(b);
      }
      return acc;
    }, {});
  }, [bookings, year, month]);

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
    setSelectedDay(null);
  };

  const monthTitle = currentMonth.toLocaleDateString(lang, { month: 'long', year: 'numeric' });
  const weekDayLabels = i18n.language === 'ru'
    ? ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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
        {hasBookings && <View style={[styles.dot, isSelected && { backgroundColor: colors.white }]} />}
      </TouchableOpacity>
    );
  };

  const calendarNode = (
    <View style={[styles.calendarGrid, isTwoColumn && styles.calendarGridDesktop]}>
      <View style={styles.monthNavRow}>
        <TouchableOpacity onPress={handlePrevMonth} style={styles.monthNavBtn}>
          <Icon name="arrow-left" size={sizes.scale(18)} color={colors.n700} />
        </TouchableOpacity>
        <Text style={styles.monthNavTitle}>{monthTitle}</Text>
        <TouchableOpacity onPress={handleNextMonth} style={styles.monthNavBtn}>
          <Icon name="arrow-right" size={sizes.scale(18)} color={colors.n700} />
        </TouchableOpacity>
      </View>
      <View style={styles.weekDays}>
        {weekDayLabels.map(d => (
          <Text key={d} style={styles.weekDayText}>{d}</Text>
        ))}
      </View>
      <View style={styles.daysContainer}>
        {leadingEmptyDays.map(key => (
          <View key={key} style={styles.dayCell} />
        ))}
        {days.map(renderDay)}
      </View>
    </View>
  );

  const bookingsNode = (
    <View style={[styles.bookingsSection, isTwoColumn && styles.bookingsSectionDesktop]}>
      <Text style={styles.sectionSubtitle}>
        {selectedDay
          ? `${t('doctors.booking_summary', 'Расписание')} — ${selectedDay} ${currentMonth.toLocaleDateString(lang, { month: 'short' })}`
          : t('consultation.select_day_hint', 'Выберите день в календаре')}
      </Text>
      <ScrollView style={styles.bookingsList} showsVerticalScrollIndicator={false}>
        {selectedDay && bookingsByDay[selectedDay] && bookingsByDay[selectedDay].length > 0 ? (
          bookingsByDay[selectedDay].map(b => (
            <TouchableOpacity 
              key={b.id} 
              style={styles.bookingItem}
              onPress={() => onSelectBooking(b)}
            >
              <View style={styles.bookingTimeBox}>
                <Text style={styles.bookingTime}>{b.slot?.time || b.time || (b.duration ? `${b.duration} min` : '--:--')}</Text>
              </View>
              <View style={styles.bookingInfo}>
                <Text style={styles.bookingDoctor}>{t('doctors.dr_prefix')}{b.doctor?.firstName || ''} {b.doctor?.lastName || ''}</Text>
                <Text style={styles.bookingSpec}>{t(b.doctor?.specialization || 'doctors.general')}</Text>
              </View>
              <Icon name="arrow-right" size={sizes.scale(20)} color={colors.n400} />
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyBookingsBox}>
            <Icon name="calendar" size={sizes.scale(28)} color={colors.n300} />
            <Text style={styles.noBookingsText}>{t('consultation.no_scheduled', 'Нет запланированных консультаций')}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType={isCenteredModal ? 'fade' : 'slide'} onRequestClose={onClose}>
      <View style={[styles.modalOverlay, isCenteredModal && styles.modalOverlayCentered]}>
        <View style={[styles.modalContent, isCenteredModal && styles.modalContentCentered, isTwoColumn && styles.modalContentTwoCol]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('consultation.calendar_title', 'Календарь консультаций')}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Icon name="close" size={sizes.scale(24)} color={colors.n900} />
            </TouchableOpacity>
          </View>

          {isTwoColumn ? (
            <View style={styles.desktopBodyRow}>
              {calendarNode}
              {bookingsNode}
            </View>
          ) : (
            <>
              {calendarNode}
              {bookingsNode}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const themeStyles = (theme) => ({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalOverlayCentered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.sizes.spacing.l,
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: theme.sizes.scale(32),
    borderTopRightRadius: theme.sizes.scale(32),
    height: '80%',
    padding: theme.sizes.spacing.l,
    width: '100%',
    maxWidth: 540,
    alignSelf: 'center',
  },
  modalContentCentered: {
    borderRadius: theme.sizes.scale(28),
    height: 'auto',
    maxHeight: '86%',
    maxWidth: 640,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 16,
  },
  modalContentTwoCol: {
    maxWidth: 880,
    width: '92%',
    minHeight: 460,
  },
  desktopBodyRow: {
    flexDirection: 'row',
    gap: theme.sizes.spacing.l,
    alignItems: ' stretch',
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.sizes.spacing.l,
  },
  closeBtn: {
    padding: 4,
  },
  modalTitle: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n900,
    fontFamily: 'Manrope_700Bold',
  },
  calendarGrid: {
    backgroundColor: '#F8FBFB',
    borderRadius: theme.sizes.scale(24),
    padding: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.l,
  },
  calendarGridDesktop: {
    flex: 1.05,
    marginBottom: 0,
  },
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.sizes.spacing.m,
    paddingHorizontal: theme.sizes.spacing.xs,
  },
  monthNavBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.n200,
  },
  monthNavTitle: {
    ...theme.sizes.typography.bodyLarge,
    fontFamily: 'Manrope_700Bold',
    color: theme.colors.n900,
    textTransform: 'capitalize',
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
    fontFamily: 'Manrope_700Bold',
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    height: theme.sizes.scale(40),
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: theme.sizes.scale(3),
    borderRadius: theme.sizes.scale(10),
  },
  selectedDay: {
    backgroundColor: theme.colors.p500,
  },
  dayText: {
    ...theme.sizes.typography.body,
    color: theme.colors.n900,
    fontFamily: 'Manrope_600SemiBold',
  },
  selectedDayText: {
    color: theme.colors.white,
    fontFamily: 'Manrope_700Bold',
  },
  dot: {
    width: theme.sizes.scale(5),
    height: theme.sizes.scale(5),
    borderRadius: theme.sizes.scale(2.5),
    backgroundColor: theme.colors.p500,
    position: 'absolute',
    bottom: theme.sizes.scale(4),
  },
  bookingsSection: {
    flex: 1,
    minHeight: 160,
  },
  bookingsSectionDesktop: {
    flex: 1,
    backgroundColor: '#F8FBFB',
    borderRadius: theme.sizes.scale(24),
    padding: theme.sizes.spacing.m,
  },
  sectionSubtitle: {
    ...theme.sizes.typography.body,
    fontFamily: 'Manrope_700Bold',
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
    borderRadius: theme.sizes.scale(16),
    padding: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.s,
    borderWidth: 1,
    borderColor: '#F0F3F3',
  },
  bookingTimeBox: {
    backgroundColor: '#F0F8F7',
    paddingHorizontal: theme.sizes.scale(10),
    paddingVertical: theme.sizes.scale(6),
    borderRadius: theme.sizes.scale(8),
    marginRight: theme.sizes.spacing.m,
  },
  bookingTime: {
    ...theme.sizes.typography.caption,
    fontFamily: 'Manrope_700Bold',
    color: theme.colors.p500,
  },
  bookingInfo: {
    flex: 1,
  },
  bookingDoctor: {
    ...theme.sizes.typography.bodySmall,
    fontFamily: 'Manrope_700Bold',
    color: theme.colors.n900,
  },
  bookingSpec: {
    ...theme.sizes.typography.caption,
    color: theme.colors.n500,
  },
  emptyBookingsBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.sizes.spacing.xl,
    gap: theme.sizes.spacing.s,
  },
  noBookingsText: {
    ...theme.sizes.typography.bodySmall,
    color: theme.colors.n400,
    textAlign: 'center',
  }
});
