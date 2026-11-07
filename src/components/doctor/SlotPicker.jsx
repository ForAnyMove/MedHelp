import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Modal,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeContext';
import { useStyles } from '../../theme/useStyles';
import { useResponsive } from '../../theme/useResponsive';
import { Icon } from '../ui/Icon';
import { formatIsoDate } from '../../utils/dateUtils';
import { useComponentContext } from '../../context/GlobalContext';
import { getHitSlopForSize } from '../../utils/accessibility';

/**
 * Interactive Monthly Calendar Picker
 * Replaces previous hardcoded mockup with real slot-aware calendar.
 */
function InteractiveCalendar({
  availableSlots,
  selectedDate,
  onSelectDate,
  onClose,
  colors,
  sizes,
  t,
}) {
  const initialDate = useMemo(() => {
    if (selectedDate) {
      const d = new Date(selectedDate);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  }, [selectedDate]);

  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth()); // 0-indexed

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Month bounds
  const isCurrentMonth =
    today.getFullYear() === currentYear && today.getMonth() === currentMonth;

  const handlePrevMonth = () => {
    if (isCurrentMonth) return; // Don't navigate to past months
    if (currentMonth === 0) {
      setCurrentYear((y) => y - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentYear((y) => y + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Map available dates for quick lookup
  const availableDatesMap = useMemo(() => {
    const map = {};
    if (availableSlots?.dates) {
      availableSlots.dates.forEach((d) => {
        const key = d.date.split('T')[0];
        const freeCount = (d.slots || []).filter((s) => s.isFree).length;
        map[key] = {
          rawDate: d.date,
          freeCount,
          hasFree: freeCount > 0,
        };
      });
    }
    return map;
  }, [availableSlots]);

  // Days in month calculation
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayWeekday = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7; // 0 = Mon, 6 = Sun

  const monthTitle = useMemo(() => {
    const d = new Date(currentYear, currentMonth, 1);
    const mName = d.toLocaleDateString(t('common.locale', 'ru-RU'), {
      month: 'long',
      year: 'numeric',
    });
    return mName.charAt(0).toUpperCase() + mName.slice(1);
  }, [currentYear, currentMonth, t]);

  const weekDayLabels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  // Grid builder
  const calendarCells = [];
  // Empty cells for alignment
  for (let i = 0; i < firstDayWeekday; i++) {
    calendarCells.push({ key: `empty-${i}`, empty: true });
  }
  // Days of month
  for (let day = 1; day <= daysInMonth; day++) {
    const dayDate = new Date(currentYear, currentMonth, day);
    dayDate.setHours(0, 0, 0, 0);

    const isoDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const slotInfo = availableDatesMap[isoDateStr];
    const isPast = dayDate < today;
    const isSelected = selectedDate && selectedDate.startsWith(isoDateStr);
    const hasFree = slotInfo && slotInfo.hasFree && !isPast;

    calendarCells.push({
      key: `day-${day}`,
      day,
      isoDateStr,
      rawDate: slotInfo?.rawDate || dayDate.toISOString(),
      isPast,
      hasFree,
      freeCount: slotInfo?.freeCount || 0,
      isSelected,
    });
  }

  return (
    <View style={calendarStyles.container}>
      {/* Month Navigation */}
      <View style={calendarStyles.header}>
        <TouchableOpacity
          onPress={handlePrevMonth}
          disabled={isCurrentMonth}
          style={[calendarStyles.navBtn, isCurrentMonth && calendarStyles.navBtnDisabled]}
          hitSlop={getHitSlopForSize(32, 32)}
        >
          <Icon
            name="ChevronLeft"
            size={sizes.scale(20)}
            color={isCurrentMonth ? colors.n300 : colors.n800}
          />
        </TouchableOpacity>

        <Text style={calendarStyles.monthTitle}>{monthTitle}</Text>

        <TouchableOpacity
          onPress={handleNextMonth}
          style={calendarStyles.navBtn}
          hitSlop={getHitSlopForSize(32, 32)}
        >
          <Icon name="ChevronRight" size={sizes.scale(20)} color={colors.n800} />
        </TouchableOpacity>
      </View>

      {/* Weekday Labels */}
      <View style={calendarStyles.weekDaysRow}>
        {weekDayLabels.map((wd, i) => (
          <Text
            key={i}
            style={[
              calendarStyles.weekDayLabel,
              (i === 5 || i === 6) && calendarStyles.weekendLabel,
            ]}
          >
            {wd}
          </Text>
        ))}
      </View>

      {/* Days Grid */}
      <View style={calendarStyles.daysGrid}>
        {calendarCells.map((cell) => {
          if (cell.empty) {
            return <View key={cell.key} style={calendarStyles.dayCell} />;
          }

          const canClick = cell.hasFree;

          return (
            <TouchableOpacity
              key={cell.key}
              disabled={!canClick}
              activeOpacity={0.7}
              onPress={() => onSelectDate(cell.rawDate)}
              style={[
                calendarStyles.dayCell,
                cell.hasFree && calendarStyles.dayCellAvailable,
                cell.isSelected && calendarStyles.dayCellSelected,
              ]}
            >
              <Text
                style={[
                  calendarStyles.dayNum,
                  cell.isPast && calendarStyles.dayNumPast,
                  cell.hasFree && calendarStyles.dayNumAvailable,
                  cell.isSelected && calendarStyles.dayNumSelected,
                ]}
              >
                {cell.day}
              </Text>
              {cell.hasFree && (
                <View
                  style={[
                    calendarStyles.freeDot,
                    cell.isSelected && calendarStyles.freeDotSelected,
                  ]}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Legend */}
      <View style={calendarStyles.legendRow}>
        <View style={calendarStyles.legendItem}>
          <View style={[calendarStyles.legendDot, { backgroundColor: colors.p500 }]} />
          <Text style={calendarStyles.legendText}>Свободные слоты</Text>
        </View>
        <View style={calendarStyles.legendItem}>
          <View style={[calendarStyles.legendDot, { backgroundColor: colors.n300 }]} />
          <Text style={calendarStyles.legendText}>Нет записи</Text>
        </View>
      </View>
    </View>
  );
}

const calendarStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  navBtnDisabled: {
    opacity: 0.4,
  },
  monthTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 8,
  },
  weekDayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  weekendLabel: {
    color: '#94A3B8',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    rowGap: 8,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    position: 'relative',
  },
  dayCellAvailable: {
    backgroundColor: 'rgba(35, 211, 194, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(35, 211, 194, 0.4)',
  },
  dayCellSelected: {
    backgroundColor: '#23D3C2',
    borderColor: '#23D3C2',
  },
  dayNum: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500',
  },
  dayNumPast: {
    color: '#CBD5E1',
  },
  dayNumAvailable: {
    color: '#0F766E',
    fontWeight: '700',
  },
  dayNumSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  freeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#23D3C2',
    position: 'absolute',
    bottom: 4,
  },
  freeDotSelected: {
    backgroundColor: '#FFFFFF',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: '#64748B',
  },
});

export function SlotPicker({ availableSlots, selectedSlot, onSelectSlot }) {
  const { t } = useTranslation();
  const { colors, sizes } = useTheme();
  const responsive = useResponsive();
  const { doctorController } = useComponentContext();
  const styles = useStyles(themeStyles);

  const isCenteredModal = responsive?.modalMode === 'centeredModal';

  const [isFullCalendarVisible, setIsFullCalendarVisible] = useState(false);
  const [timeFilter, setTimeFilter] = useState('all'); // 'all' | 'morning' | 'afternoon' | 'evening'

  // Filter out past times for "Today"
  const allFilteredTimes = useMemo(() => {
    if (!selectedSlot?.date) return [];
    const dateObj = availableSlots?.dates?.find((d) => d.date === selectedSlot.date);
    if (!dateObj) return [];

    const times = dateObj.slots || [];
    const isToday =
      selectedSlot.date.split('T')[0] === new Date().toISOString().split('T')[0];

    if (!isToday) return times;

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    return times.filter((slot) => {
      const [h, m] = slot.time.split(':').map(Number);
      if (h > currentHour) return true;
      if (h === currentHour && m > currentMinute) return true;
      return false;
    });
  }, [selectedSlot?.date, availableSlots]);

  // Group by Time of Day: Morning (<12:00), Afternoon (12:00-17:00), Evening (>=17:00)
  const timeCounts = useMemo(() => {
    let morning = 0;
    let afternoon = 0;
    let evening = 0;

    allFilteredTimes.forEach((slot) => {
      if (!slot.isFree) return;
      const h = parseInt(slot.time.split(':')[0], 10) || 0;
      if (h < 12) morning += 1;
      else if (h < 17) afternoon += 1;
      else evening += 1;
    });

    return { morning, afternoon, evening, total: morning + afternoon + evening };
  }, [allFilteredTimes]);

  // Apply time period filter
  const displayedTimes = useMemo(() => {
    if (timeFilter === 'all') return allFilteredTimes;

    return allFilteredTimes.filter((slot) => {
      const h = parseInt(slot.time.split(':')[0], 10) || 0;
      if (timeFilter === 'morning') return h < 12;
      if (timeFilter === 'afternoon') return h >= 12 && h < 17;
      if (timeFilter === 'evening') return h >= 17;
      return true;
    });
  }, [allFilteredTimes, timeFilter]);

  const renderDateItem = ({ item }) => {
    const isSelected = selectedSlot.date === item.date;
    const isAllOccupied = item.slots.every((s) => !s.isFree);
    const localizedLabel = item.label
      ? t(item.label)
      : formatIsoDate(item.date, 'weekday', t);
    const localizedDate = formatIsoDate(item.date, 'short', t);

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        disabled={isAllOccupied}
        onPress={() => onSelectSlot(item.date, selectedSlot.time)}
        style={[
          styles.dateItem,
          isSelected && styles.dateItemSelected,
          isAllOccupied && styles.dateItemDisabled,
        ]}
      >
        <Text
          style={[
            styles.dateLabel,
            isSelected && styles.dateLabelSelected,
            isAllOccupied && styles.dateLabelDisabled,
          ]}
        >
          {localizedLabel}
        </Text>
        <Text
          style={[
            styles.dateValue,
            isSelected && styles.dateValueSelected,
            isAllOccupied && styles.dateValueDisabled,
          ]}
        >
          {localizedDate}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* 1. Date Selection Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t('doctors.available_dates')}</Text>
        <TouchableOpacity
          style={styles.seeAll}
          onPress={() => setIsFullCalendarVisible(true)}
          hitSlop={getHitSlopForSize(24, 24)}
        >
          <Text style={styles.seeAllText}>
            {t('doctors.see_all', 'Все даты')}
          </Text>
          <Icon name="Calendar" size={sizes.scale(16)} color={colors.p500} />
        </TouchableOpacity>
      </View>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={availableSlots?.dates || []}
        renderItem={renderDateItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.datesList}
      />

      {/* 2. Time Slots Section */}
      <View style={styles.timesHeaderRow}>
        <Text style={styles.sectionTitle}>{t('doctors.available_times')}</Text>
        {allFilteredTimes.length > 0 && (
          <Text style={styles.timesCountBadge}>
            {allFilteredTimes.filter((s) => s.isFree).length} свободно
          </Text>
        )}
      </View>

      {/* Time-of-day Quick Filters (shown when multiple slots exist) */}
      {allFilteredTimes.length > 4 && (
        <View style={styles.timeFiltersBar}>
          <TouchableOpacity
            style={[
              styles.timeFilterChip,
              timeFilter === 'all' && styles.timeFilterChipActive,
            ]}
            onPress={() => setTimeFilter('all')}
          >
            <Text
              style={[
                styles.timeFilterChipText,
                timeFilter === 'all' && styles.timeFilterChipTextActive,
              ]}
            >
              Все
            </Text>
          </TouchableOpacity>

          {timeCounts.morning > 0 && (
            <TouchableOpacity
              style={[
                styles.timeFilterChip,
                timeFilter === 'morning' && styles.timeFilterChipActive,
              ]}
              onPress={() => setTimeFilter('morning')}
            >
              <Text
                style={[
                  styles.timeFilterChipText,
                  timeFilter === 'morning' && styles.timeFilterChipTextActive,
                ]}
              >
                Утро ({timeCounts.morning})
              </Text>
            </TouchableOpacity>
          )}

          {timeCounts.afternoon > 0 && (
            <TouchableOpacity
              style={[
                styles.timeFilterChip,
                timeFilter === 'afternoon' && styles.timeFilterChipActive,
              ]}
              onPress={() => setTimeFilter('afternoon')}
            >
              <Text
                style={[
                  styles.timeFilterChipText,
                  timeFilter === 'afternoon' && styles.timeFilterChipTextActive,
                ]}
              >
                День ({timeCounts.afternoon})
              </Text>
            </TouchableOpacity>
          )}

          {timeCounts.evening > 0 && (
            <TouchableOpacity
              style={[
                styles.timeFilterChip,
                timeFilter === 'evening' && styles.timeFilterChipActive,
              ]}
              onPress={() => setTimeFilter('evening')}
            >
              <Text
                style={[
                  styles.timeFilterChipText,
                  timeFilter === 'evening' && styles.timeFilterChipTextActive,
                ]}
              >
                Вечер ({timeCounts.evening})
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Times Grid */}
      <View style={styles.timesScrollContainer}>
        <ScrollView
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.timesGrid}
        >
          {displayedTimes.map((slot) => {
            const isSelected = selectedSlot?.slotId === slot.id;
            const isOccupied = !slot.isFree;
            const slotPrice = slot.price !== undefined && slot.price !== null ? slot.price : (doctorController?.selectedDoctor?.price || 0);

            return (
              <TouchableOpacity
                key={slot.id}
                activeOpacity={0.7}
                disabled={isOccupied}
                onPress={() => onSelectSlot(selectedSlot.date, slot)}
                style={[
                  styles.timeItem,
                  isSelected && styles.timeItemSelected,
                  isOccupied && styles.timeItemDisabled,
                ]}
              >
                <Text
                  style={[
                    styles.timeText,
                    isSelected && styles.timeTextSelected,
                    isOccupied && styles.timeTextDisabled,
                  ]}
                >
                  {slot.time}
                </Text>
                <Text
                  style={[
                    styles.timePriceText,
                    isSelected && styles.timePriceTextSelected,
                    isOccupied && styles.timePriceTextDisabled,
                  ]}
                >
                  {slotPrice > 0 ? `$${slotPrice}` : t('doctor_dashboard.free_consultation', 'Беспл.')}
                </Text>
              </TouchableOpacity>
            );
          })}
          {displayedTimes.length === 0 && (
            <Text style={styles.noTimesText}>
              {t('doctors.no_slots_today', 'Нет доступных слотов на выбранное время')}
            </Text>
          )}
        </ScrollView>
      </View>

      {/* 3. Selected Slot Summary Info */}
      {selectedSlot?.date && selectedSlot?.time && (
        <View style={styles.selectionInfo}>
          <View style={styles.selectionIconContainer}>
            <Icon name="Check" size={sizes.scale(18)} color={colors.p500} />
          </View>
          <Text style={styles.selectionText}>
            {t('doctors.selected_label', 'Выбрано: ')}
            {formatIsoDate(selectedSlot.date, 'full', t)} • {selectedSlot.time} | $
            {selectedSlot?.price !== undefined && selectedSlot?.price !== null
              ? selectedSlot.price
              : (doctorController?.selectedDoctor?.price || 0)}
          </Text>
        </View>
      )}

      {/* 4. Full Calendar Modal (Responsive Dialog on Desktop / Sheet on Mobile) */}
      <Modal
        visible={isFullCalendarVisible}
        transparent={isCenteredModal}
        animationType={isCenteredModal ? 'fade' : 'slide'}
        onRequestClose={() => setIsFullCalendarVisible(false)}
      >
        <KeyboardAvoidingView
          style={isCenteredModal ? styles.desktopModalOverlay : styles.mobileModalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {isCenteredModal && (
            <TouchableOpacity
              style={styles.desktopModalBackdrop}
              activeOpacity={1}
              onPress={() => setIsFullCalendarVisible(false)}
            />
          )}

          <View style={isCenteredModal ? styles.desktopDialogCard : styles.mobileDialogWrapper}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <Icon name="Calendar" size={sizes.scale(20)} color={colors.p500} />
                <Text style={styles.modalTitle}>
                  {t('doctors.select_date_modal', 'Выберите дату')}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsFullCalendarVisible(false)}
                hitSlop={getHitSlopForSize(32, 32)}
              >
                <Icon name="X" size={sizes.scale(22)} color={colors.n800} />
              </TouchableOpacity>
            </View>

            <InteractiveCalendar
              availableSlots={availableSlots}
              selectedDate={selectedSlot?.date}
              onSelectDate={(date) => {
                onSelectSlot(date, selectedSlot?.time);
                setIsFullCalendarVisible(false);
              }}
              onClose={() => setIsFullCalendarVisible(false)}
              colors={colors}
              sizes={sizes}
              t={t}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const themeStyles = (theme) => ({
  container: {
    marginBottom: theme.sizes.spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.sizes.spacing.s,
  },
  sectionTitle: {
    ...theme.sizes.typography.bodyLarge,
    fontSize: theme.sizes.scale(15),
    fontWeight: '700',
    color: theme.colors.n700,
    marginBottom: theme.sizes.spacing.xs,
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.p500,
    fontWeight: '600',
  },
  datesList: {
    paddingBottom: theme.sizes.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.n200,
    marginBottom: theme.sizes.spacing.m,
  },
  dateItem: {
    width: theme.sizes.scale(67),
    paddingVertical: theme.sizes.spacing.xs,
    borderRadius: theme.sizes.borderRadius.medium,
    backgroundColor: theme.colors.p100,
    alignItems: 'center',
    marginRight: theme.sizes.spacing.s,
  },
  dateItemSelected: {
    backgroundColor: theme.colors.p500,
  },
  dateItemDisabled: {
    backgroundColor: theme.colors.n200,
    opacity: 0.5,
  },
  dateLabel: {
    ...theme.sizes.typography.bodySmall,
    color: theme.colors.p500,
    fontWeight: '600',
  },
  dateLabelSelected: {
    color: theme.colors.white,
  },
  dateLabelDisabled: {
    color: theme.colors.n400,
  },
  dateValue: {
    ...theme.sizes.typography.bodyMedium,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: theme.sizes.scale(16),
    lineHeight: theme.sizes.scale(20),
    color: theme.colors.p500,
    marginTop: theme.sizes.scale(2),
  },
  dateValueSelected: {
    color: theme.colors.white,
  },
  dateValueDisabled: {
    color: theme.colors.n400,
  },

  // Times Header and Filters
  timesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.sizes.spacing.xs,
  },
  timesCountBadge: {
    fontSize: theme.sizes.scale(12),
    color: theme.colors.p600,
    fontWeight: '600',
    backgroundColor: theme.colors.opacityP100,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  timeFiltersBar: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: theme.sizes.spacing.s,
    flexWrap: 'wrap',
  },
  timeFilterChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: theme.colors.n100,
  },
  timeFilterChipActive: {
    backgroundColor: theme.colors.opacityP100,
    borderWidth: 1,
    borderColor: theme.colors.p500,
  },
  timeFilterChipText: {
    fontSize: theme.sizes.scale(11),
    color: theme.colors.n600,
    fontWeight: '500',
  },
  timeFilterChipTextActive: {
    color: theme.colors.p600,
    fontWeight: '700',
  },

  timesScrollContainer: {
    maxHeight: theme.sizes.scale(160),
    marginBottom: theme.sizes.spacing.m,
    paddingVertical: theme.sizes.scale(2),
  },
  timesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: theme.sizes.spacing.s,
    paddingBottom: theme.sizes.spacing.s,
  },
  timeItem: {
    minWidth: theme.sizes.scale(70),
    flexGrow: 1,
    maxWidth: '31%',
    paddingVertical: theme.sizes.spacing.s,
    borderRadius: theme.sizes.borderRadius.medium,
    backgroundColor: theme.colors.p100,
    alignItems: 'center',
  },
  timeItemSelected: {
    backgroundColor: theme.colors.p500,
  },
  timeItemDisabled: {
    backgroundColor: theme.colors.n200,
    opacity: 0.5,
  },
  timeText: {
    ...theme.sizes.typography.bodySmall,
    fontSize: theme.sizes.scale(15),
    lineHeight: theme.sizes.scale(20),
    color: theme.colors.p500,
    fontFamily: 'Manrope_600SemiBold',
    fontWeight: '600',
  },
  timeTextSelected: {
    color: theme.colors.white,
    fontWeight: '700',
  },
  timeTextDisabled: {
    color: theme.colors.n500,
  },
  timePriceText: {
    fontSize: theme.sizes.scale(11),
    color: theme.colors.p600,
    fontWeight: '700',
    marginTop: 1,
  },
  timePriceTextSelected: {
    color: theme.colors.white,
  },
  timePriceTextDisabled: {
    color: theme.colors.n400,
  },
  noTimesText: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n500,
    textAlign: 'center',
    marginTop: theme.sizes.spacing.m,
    width: '100%',
  },
  selectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.opacityP100,
    padding: theme.sizes.spacing.s,
    paddingHorizontal: theme.sizes.spacing.m,
    borderRadius: theme.sizes.borderRadius.medium,
    marginBottom: theme.sizes.spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(35, 211, 194, 0.3)',
  },
  selectionIconContainer: {
    marginRight: theme.sizes.spacing.s,
  },
  selectionText: {
    ...theme.sizes.typography.bodySmall,
    color: theme.colors.p600,
    fontWeight: '600',
  },

  // Modal Presentation
  desktopModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.sizes.spacing.m,
  },
  desktopModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
  },
  desktopDialogCard: {
    width: '90%',
    maxWidth: 440,
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.scale(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.22,
    shadowRadius: 30,
    elevation: 20,
    overflow: 'hidden',
    zIndex: 10,
  },
  mobileModalContainer: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  mobileDialogWrapper: {
    flex: 1,
    backgroundColor: theme.colors.white,
    paddingTop: theme.sizes.spacing.l,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.sizes.spacing.m,
    paddingTop: theme.sizes.spacing.m,
    paddingBottom: theme.sizes.spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.n100,
    marginBottom: theme.sizes.spacing.s,
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n900,
  },
});
