import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, FlatList, Modal } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeContext';
import { useStyles } from '../../theme/useStyles';
import { Icon } from '../ui/Icon';
import { formatIsoDate } from '../../utils/dateUtils';
import { useComponentContext } from '../../context/GlobalContext';

// Simple mock calendar component since react-native-calendars is not installed
const SimpleCalendar = ({ onSelectDate, colors, sizes }) => {
  const { t } = useTranslation();
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const month = `${t('common.months.march')} 2026`;
  
  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 16, textAlign: 'center' }}>{month}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', gap: 8 }}>
        {days.map(day => (
          <TouchableOpacity 
            key={day} 
            style={{ 
              width: '12%', 
              aspectRatio: 1, 
              justifyContent: 'center', 
              alignItems: 'center',
              backgroundColor: day === 26 ? colors.p500 : colors.p100,
              borderRadius: 8
            }}
            onPress={() => onSelectDate(`2026-03-${day.toString().padStart(2, '0')}T10:00:00Z`)}
          >
            <Text style={{ color: day === 26 ? 'white' : colors.p500 }}>{day}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export function SlotPicker({ availableSlots, selectedSlot, onSelectSlot }) {
  const { t } = useTranslation();
  const { colors, sizes } = useTheme();
  const { doctorController } = useComponentContext();
  const styles = useStyles(themeStyles);
  const [isFullCalendarVisible, setIsFullCalendarVisible] = React.useState(false);

  // Filter out past times for "Today"
  const filteredTimes = React.useMemo(() => {
    if (selectedSlot.date !== availableSlots.dates[0]?.date) return availableSlots.times;
    
    const now = new Date();
    // Use the time from metadata if provided, or current Date
    // Current time is 23:21, so for today most/all should be gone
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    return availableSlots.times.filter(time => {
      const [h, m] = time.split(':').map(Number);
      if (h > currentHour) return true;
      if (h === currentHour && m > currentMinute) return true;
      return false;
    });
  }, [selectedSlot.date, availableSlots]);

  const renderDateItem = ({ item }) => {
    const isSelected = selectedSlot.date === item.date;
    const localizedLabel = item.label ? t(item.label) : formatIsoDate(item.date, 'weekday', t);
    const localizedDate = formatIsoDate(item.date, 'short', t);

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onSelectSlot(item.date, selectedSlot.time)}
        style={[styles.dateItem, isSelected && styles.dateItemSelected]}
      >
        <Text style={[styles.dateLabel, isSelected && styles.dateLabelSelected]}>{localizedLabel}</Text>
        <Text style={[styles.dateValue, isSelected && styles.dateValueSelected]}>{localizedDate}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t('doctors.available_dates')}</Text>
        <TouchableOpacity style={styles.seeAll} onPress={() => setIsFullCalendarVisible(true)}>
          <Text style={styles.seeAllText}>{t('doctors.see_all')}</Text>
          <Icon name="ChevronRight" size={14} color={colors.p500} />
        </TouchableOpacity>
      </View>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={availableSlots.dates}
        renderItem={renderDateItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.datesList}
      />

      <Text style={styles.sectionTitle}>{t('doctors.available_times')}</Text>
      <View style={styles.timesScrollContainer}>
        <ScrollView 
          nestedScrollEnabled 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.timesGrid}
        >
          {filteredTimes.map((time) => {
            const isSelected = selectedSlot.time === time;
            return (
              <TouchableOpacity
                key={time}
                activeOpacity={0.7}
                onPress={() => onSelectSlot(selectedSlot.date, time)}
                style={[styles.timeItem, isSelected && styles.timeItemSelected]}
              >
                <Text style={[styles.timeText, isSelected && styles.timeTextSelected]}>
                  {time}
                </Text>
              </TouchableOpacity>
            );
          })}
          {filteredTimes.length === 0 && (
            <Text style={styles.noTimesText}>{t('doctors.no_slots_today')}</Text>
          )}
        </ScrollView>
      </View>

      {(selectedSlot.date && selectedSlot.time) && (
        <View style={styles.selectionInfo}>
           <View style={styles.selectionIconContainer}>
             <Icon name="CheckCircle" size={16} color={colors.p500} />
           </View>
           <Text style={styles.selectionText}>
              {t('doctors.selected_label')}{formatIsoDate(selectedSlot.date, 'full', t)} вЂў {selectedSlot.time} | ${doctorController.selectedDoctor?.price || 0}
           </Text>
        </View>
      )}

      <Modal visible={isFullCalendarVisible} animationType="slide">
        <View style={styles.modalContainer}>
           <View style={styles.modalHeader}>
             <TouchableOpacity onPress={() => setIsFullCalendarVisible(false)}>
               <Icon name="X" size={24} color={colors.n900} />
             </TouchableOpacity>
             <Text style={styles.modalTitle}>{t('doctors.select_date_modal')}</Text>
             <View style={{ width: 24 }} />
           </View>
           <SimpleCalendar 
             onSelectDate={(date) => {
               onSelectSlot(date, selectedSlot.time);
               setIsFullCalendarVisible(false);
             }}
             colors={colors}
             sizes={sizes}
           />
        </View>
      </Modal>
    </View>
  );
}

const themeStyles = (theme) => ({
  container: {
    marginTop: theme.sizes.spacing.m,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.sizes.spacing.s,
  },
  sectionTitle: {
    ...theme.sizes.typography.h4,
    color: theme.colors.n900,
    marginBottom: theme.sizes.spacing.s,
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    ...theme.sizes.typography.caption,
    color: theme.colors.p500,
    marginRight: theme.sizes.spacing.xs,
  },
  datesList: {
    paddingBottom: theme.sizes.spacing.m,
  },
  dateItem: {
    width: theme.sizes.scale(70),
    paddingVertical: theme.sizes.spacing.s,
    borderRadius: theme.sizes.borderRadius.medium,
    backgroundColor: theme.colors.p100,
    alignItems: 'center',
    marginRight: theme.sizes.spacing.s,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dateItemSelected: {
    backgroundColor: theme.colors.p500,
  },
  dateLabel: {
    ...theme.sizes.typography.caption,
    color: theme.colors.p500,
  },
  dateLabelSelected: {
    color: theme.colors.white,
  },
  dateValue: {
    ...theme.sizes.typography.bodySmall,
    fontFamily: 'Manrope_600SemiBold',
    color: theme.colors.p500,
  },
  dateValueSelected: {
    color: theme.colors.white,
  },
  timesScrollContainer: {
    maxHeight: theme.sizes.scale(160), 
    marginBottom: theme.sizes.spacing.l,
    borderRadius: theme.sizes.borderRadius.medium,
    backgroundColor: theme.colors.white,
    padding: 2,
  },
  timesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: theme.sizes.spacing.xs,
    paddingBottom: theme.sizes.spacing.s,
  },
  timeItem: {
    width: '19%', // 5 columns
    paddingVertical: theme.sizes.spacing.s,
    borderRadius: theme.sizes.borderRadius.small,
    backgroundColor: theme.colors.n100,
    alignItems: 'center',
    marginBottom: theme.sizes.spacing.xs,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  timeItemSelected: {
    backgroundColor: theme.colors.p500,
  },
  timeText: {
    ...theme.sizes.typography.caption,
    color: theme.colors.p500,
    fontFamily: 'Manrope_600SemiBold',
  },
  timeTextSelected: {
    color: theme.colors.white,
  },
  noTimesText: {
    ...theme.sizes.typography.bodySmall,
    color: theme.colors.n500,
    textAlign: 'center',
    marginTop: theme.sizes.spacing.m,
    width: '100%',
  },
  selectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.p100,
    padding: theme.sizes.spacing.s,
    borderRadius: theme.sizes.borderRadius.full,
    marginBottom: theme.sizes.spacing.m,
  },
  selectionIconContainer: {
    marginRight: theme.sizes.spacing.s,
  },
  selectionText: {
    ...theme.sizes.typography.caption,
    color: theme.colors.p500,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.white,
    paddingTop: theme.sizes.spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.sizes.spacing.l,
    marginBottom: theme.sizes.spacing.l,
  },
  modalTitle: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n900,
  }
});
