import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useStyles } from '../../../../theme/useStyles';
import { useTheme } from '../../../../theme/ThemeContext';
import { Icon } from '../../../../components/ui/Icon';
import { addMonths, subMonths, startOfWeek, endOfWeek, eachDayOfInterval, startOfMonth, endOfMonth, isSameDay, isSameMonth, parseISO } from 'date-fns';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export function ExpandableCalendar({ selectedDate, onSelectDate, byDate = {} }) {
  const { sizes, colors } = useTheme();
  const styles = useStyles(themeStyles);
  const { t } = useTranslation();

  const [isExpanded, setIsExpanded] = useState(false);

  // Month data for the FlatList
  const [months, setMonths] = useState(() => {
    const current = startOfMonth(parseISO(selectedDate) || new Date());
    return [
      subMonths(current, 2),
      subMonths(current, 1),
      current,
      addMonths(current, 1),
      addMonths(current, 2),
    ];
  });

  const flatListRef = useRef(null);
  const [initialScrollDone, setInitialScrollDone] = useState(false);

  const dayNames = [
    t('common.days.sun', 'Sun'),
    t('common.days.mon', 'Mon'),
    t('common.days.tue', 'Tue'),
    t('common.days.wed', 'Wed'),
    t('common.days.thu', 'Thu'),
    t('common.days.fri', 'Fri'),
    t('common.days.sat', 'Sat')
  ];

  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(prev => !prev);
  };

  const loadMorePast = () => {
    setMonths(prev => {
      const first = prev[0];
      return [subMonths(first, 2), subMonths(first, 1), ...prev];
    });
  };

  const loadMoreFuture = () => {
    setMonths(prev => {
      const last = prev[prev.length - 1];
      return [...prev, addMonths(last, 1), addMonths(last, 2)];
    });
  };

  // ── Render Collapsed (1-week strip) ─────────────────────────────
  const renderCollapsed = () => {
    const today = parseISO(selectedDate) || new Date();
    const weekDates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - today.getDay() + i);
      return d;
    });

    return (
      <View style={styles.weekStrip}>
        {weekDates.map((d, idx) => {
          const dateStr = d.toISOString().split('T')[0];
          const dayNum = d.getDate();
          const dayName = dayNames[d.getDay()];
          const hasConsultations = !!byDate[dateStr]?.length;
          const isSelected = dateStr === selectedDate;

          return (
            <TouchableOpacity
              key={dateStr}
              style={[styles.dayItem, isSelected && styles.dayItemSelected]}
              onPress={() => onSelectDate(dateStr)}
            >
              <Text style={[styles.dayName, isSelected && styles.dayNameSelected]}>{dayName}</Text>
              <Text style={[styles.dayNum, isSelected && styles.dayNumSelected]}>{dayNum}</Text>
              {hasConsultations && <View style={[styles.dot, isSelected && styles.dotSelected]} />}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  // ── Render Expanded (Month list) ─────────────────────────────────
  const renderMonth = ({ item: monthDate }) => {
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = eachDayOfInterval({ start: startDate, end: endDate });

    // Format month title (e.g. "August 2026")
    const monthTitle = new Date(monthDate).toLocaleDateString(t('common.locale') || 'en-US', { month: 'long', year: 'numeric' });

    return (
      <View style={styles.monthContainer}>
        <Text style={styles.monthTitle}>{monthTitle}</Text>

        {/* Days grid */}
        <View style={styles.daysGrid}>
          {days.map((d, idx) => {
            const dateStr = d.toISOString().split('T')[0];
            const isCurrentMonth = isSameMonth(d, monthDate);
            const isSelected = dateStr === selectedDate;
            const hasConsultations = !!byDate[dateStr]?.length;
            const isToday = isSameDay(d, new Date());

            return (
              <TouchableOpacity
                key={dateStr}
                style={[
                  styles.gridDay,
                  isSelected && styles.gridDaySelected,
                  !isCurrentMonth && { opacity: 0.3 }
                ]}
                onPress={() => onSelectDate(dateStr)}
              >
                <Text style={[
                  styles.gridDayText,
                  isSelected && styles.gridDayTextSelected,
                  isToday && !isSelected && styles.gridDayTextToday
                ]}>
                  {d.getDate()}
                </Text>
                {hasConsultations && <View style={[styles.dot, isSelected && styles.dotSelected]} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {isExpanded ? (
        <View style={styles.expandedContainer}>
          {/* Fixed Days of week header */}
          <View style={[styles.daysHeader, styles.fixedDaysHeader]}>
            {dayNames.map((day, idx) => (
              <Text key={idx} style={styles.daysHeaderText}>{day}</Text>
            ))}
          </View>
          <FlatList
            ref={flatListRef}
            data={months}
            keyExtractor={item => item.toISOString()}
            renderItem={renderMonth}
            showsVerticalScrollIndicator={false}
            maintainVisibleContentPosition={{
              minIndexForVisible: 0,
            }}
            onEndReached={loadMoreFuture}
            onEndReachedThreshold={0.5}
            onScroll={(e) => {
              if (e.nativeEvent.contentOffset.y < 100) {
                // Debounce or flag to prevent rapid successive loads
                loadMorePast();
              }
            }}
            scrollEventThrottle={16}
            getItemLayout={(data, index) => {
              const h = sizes.scale(380);
              return { length: h, offset: h * index, index };
            }}
            initialScrollIndex={2}
            onScrollToIndexFailed={(info) => {
              const wait = new Promise(resolve => setTimeout(resolve, 500));
              wait.then(() => {
                flatListRef.current?.scrollToIndex({ index: info.index, animated: false });
              });
            }}
          />
        </View>
      ) : (
        renderCollapsed()
      )}
      
      {/* Toggle Button */}
      <TouchableOpacity style={styles.toggleBtn} onPress={handleToggle}>
        <Icon name={isExpanded ? 'arrow-up' : 'arrow-down'} size={sizes.scale(20)} color={colors.n500} />
      </TouchableOpacity>
    </View>
  );
}

const themeStyles = (theme) => ({
  container: {
    backgroundColor: theme.colors.white,
    marginHorizontal: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.m,
    borderRadius: theme.sizes.borderRadius.large,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  expandedContainer: {
    height: theme.sizes.scale(320), // ~4 rows of weeks + headers
  },
  toggleBtn: {
    padding: theme.sizes.spacing.s,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.n100,
  },
  // Collapsed styles
  weekStrip: {
    flexDirection: 'row',
    padding: theme.sizes.spacing.m,
    gap: theme.sizes.scale(4),
  },
  dayItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.sizes.spacing.s,
    borderRadius: theme.sizes.borderRadius.medium,
    backgroundColor: theme.colors.n50,
    gap: theme.sizes.scale(3),
  },
  dayItemSelected: { backgroundColor: theme.colors.p500 },
  dayName: { ...theme.sizes.typography.caption, color: theme.colors.n500, fontFamily: 'Manrope_600SemiBold' },
  dayNameSelected: { color: theme.colors.white },
  dayNum: { ...theme.sizes.typography.bodyMedium, color: theme.colors.n900, fontFamily: 'Manrope_700Bold' },
  dayNumSelected: { color: theme.colors.white },
  dot: {
    width: theme.sizes.scale(5),
    height: theme.sizes.scale(5),
    borderRadius: theme.sizes.scale(3),
    backgroundColor: theme.colors.p500,
    marginTop: theme.sizes.scale(2),
  },
  dotSelected: { backgroundColor: theme.colors.white },
  
  // Expanded styles
  monthContainer: {
    paddingHorizontal: theme.sizes.spacing.m,
    paddingTop: theme.sizes.spacing.m,
    paddingBottom: theme.sizes.spacing.l,
  },
  monthTitle: {
    ...theme.sizes.typography.h4,
    color: theme.colors.n900,
    fontFamily: 'Manrope_700Bold',
    textTransform: 'capitalize',
    marginBottom: theme.sizes.spacing.m,
  },
  fixedDaysHeader: {
    paddingHorizontal: theme.sizes.spacing.m,
    marginTop: theme.sizes.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.n100,
    paddingBottom: theme.sizes.spacing.s,
  },
  daysHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.sizes.spacing.s,
  },
  daysHeaderText: {
    ...theme.sizes.typography.caption,
    color: theme.colors.n500,
    fontFamily: 'Manrope_600SemiBold',
    width: `${100/7}%`,
    textAlign: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridDay: {
    width: `${100/7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.sizes.borderRadius.medium,
  },
  gridDaySelected: {
    backgroundColor: theme.colors.p500,
  },
  gridDayText: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n900,
    fontFamily: 'Manrope_600SemiBold',
  },
  gridDayTextSelected: {
    color: theme.colors.white,
    fontFamily: 'Manrope_700Bold',
  },
  gridDayTextToday: {
    color: theme.colors.p500,
    fontFamily: 'Manrope_700Bold',
  },
});
