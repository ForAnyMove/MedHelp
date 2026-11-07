import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { useStyles } from '../../../../theme/useStyles';
import { useTheme } from '../../../../theme/ThemeContext';
import { useResponsive } from '../../../../theme/useResponsive';
import { Icon } from '../../../../components/ui/Icon';
import { Button } from '../../../../components/ui/Button';
import { useComponentContext } from '../../../../context/GlobalContext';
import { getHitSlopForSize } from '../../../../utils/accessibility';

export function AvailabilityModal({ visible, onClose }) {
  const { sizes, colors } = useTheme();
  const responsive = useResponsive();
  const { t } = useTranslation();
  const styles = useStyles(themeStyles);
  const { setAppLoading, doctorProfileController, session } = useComponentContext();

  const isCenteredModal = responsive?.modalMode === 'centeredModal';

  // Navigation tab: 'create' (генератор) | 'manage' (мои слоты)
  const [activeTab, setActiveTab] = useState('manage');

  // Creation State
  const [selectedDates, setSelectedDates] = useState([]); // ISO date strings: 'YYYY-MM-DD'
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [duration, setDuration] = useState(30);
  const [breakDuration, setBreakDuration] = useState(0); // in minutes
  const [showPicker, setShowPicker] = useState(null); // 'start' | 'end' | null
  const [price, setPrice] = useState('50'); // Price in USD
  const [selectedProfessions, setSelectedProfessions] = useState([]); // null or [] means all doctor's professions
  const [errorMessage, setErrorMessage] = useState(null);

  // Doctor professions from profile or session
  const doctorProfessions = useMemo(() => {
    const list = doctorProfileController?.profile?.professionCodes || session?.professionCodes || [];
    return Array.isArray(list) ? list.filter(Boolean) : [];
  }, [doctorProfileController?.profile?.professionCodes, session?.professionCodes]);

  // Management State
  const [existingSlots, setExistingSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [slotFilter, setSlotFilter] = useState('all'); // 'all' | 'free' | 'booked'
  const [deletingId, setDeletingId] = useState(null);
  const [bulkDeletingDate, setBulkDeletingDate] = useState(null);

  // Auto-scroll ref and tracking for today's date
  const manageScrollRef = useRef(null);
  const sectionPositionsRef = useRef({});
  const hasAutoScrolledRef = useRef(false);

  const { slotsApi } = doctorProfileController || {};

  // Fetch doctor slots
  const fetchSlots = async () => {
    if (!visible || !slotsApi) return;
    setLoading(true);
    try {
      const data = await slotsApi.listMine();
      setExistingSlots(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('[AvailabilityModal] Error fetching slots:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      hasAutoScrolledRef.current = false;
      sectionPositionsRef.current = {};
      fetchSlots();
    }
  }, [visible]);

  // When slots are loaded, if none exist default to 'create', otherwise keep 'manage'
  useEffect(() => {
    if (visible && existingSlots.length === 0 && !loading) {
      // If user has zero slots, start on create tab for convenience
      // (only on first load)
    }
  }, [visible, existingSlots.length, loading]);

  // Generate 14 days for date strip
  const days = useMemo(() => {
    const arr = [];
    const now = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(now.getDate() + i);
      arr.push(d);
    }
    return arr;
  }, []);

  // Map of date strings -> existing slots count
  const slotsByDateMap = useMemo(() => {
    const map = {};
    existingSlots.forEach((slot) => {
      if (!slot.start_at) return;
      const dateKey = slot.start_at.slice(0, 10);
      if (!map[dateKey]) {
        map[dateKey] = { total: 0, free: 0, booked: 0, slots: [] };
      }
      map[dateKey].total += 1;
      if (slot.booking_id) {
        map[dateKey].booked += 1;
      } else {
        map[dateKey].free += 1;
      }
      map[dateKey].slots.push(slot);
    });
    return map;
  }, [existingSlots]);

  // Grouped and sorted existing slots for the 'manage' tab
  const groupedSlots = useMemo(() => {
    const groups = [];
    const sortedDateKeys = Object.keys(slotsByDateMap).sort();

    sortedDateKeys.forEach((dateKey) => {
      const groupData = slotsByDateMap[dateKey];
      let filteredSlots = groupData.slots.slice().sort(
        (a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
      );

      if (slotFilter === 'free') {
        filteredSlots = filteredSlots.filter((s) => !s.booking_id);
      } else if (slotFilter === 'booked') {
        filteredSlots = filteredSlots.filter((s) => !!s.booking_id);
      }

      if (filteredSlots.length > 0) {
        groups.push({
          dateKey,
          total: groupData.total,
          free: groupData.free,
          booked: groupData.booked,
          slots: filteredSlots,
        });
      }
    });

    return groups;
  }, [slotsByDateMap, slotFilter]);

  // Today's date string in YYYY-MM-DD
  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  // Determine target dateKey for auto-scroll: today or first upcoming date >= today
  const targetScrollDateKey = useMemo(() => {
    if (groupedSlots.length === 0) return null;
    const exact = groupedSlots.find((g) => g.dateKey === todayStr);
    if (exact) return exact.dateKey;
    const upcoming = groupedSlots.find((g) => g.dateKey >= todayStr);
    if (upcoming) return upcoming.dateKey;
    return groupedSlots[0].dateKey;
  }, [groupedSlots, todayStr]);

  // Attempt auto-scroll to the target date when layout is measured
  const tryAutoScrollToTarget = () => {
    if (hasAutoScrolledRef.current || !targetScrollDateKey || !manageScrollRef.current) return;
    const y = sectionPositionsRef.current[targetScrollDateKey];
    if (typeof y === 'number') {
      hasAutoScrolledRef.current = true;
      // Small timeout to ensure ScrollView contentContainer is laid out
      setTimeout(() => {
        manageScrollRef.current?.scrollTo({ y: Math.max(0, y - 10), animated: true });
      }, 50);
    }
  };

  // Total counts
  const totalSlotsCount = existingSlots.length;
  const freeSlotsCount = useMemo(
    () => existingSlots.filter((s) => !s.booking_id).length,
    [existingSlots]
  );
  const bookedSlotsCount = useMemo(
    () => existingSlots.filter((s) => !!s.booking_id).length,
    [existingSlots]
  );

  // Time string parser & sanitizer
  const handleTimeChange = (text, setter) => {
    let cleaned = text.replace(/[^0-9:]/g, '');
    if (cleaned.length === 2 && text.length === 2 && !cleaned.includes(':')) {
      cleaned += ':';
    }
    setter(cleaned);
  };

  const handleTimeBlur = (val, setter, fallback = '09:00') => {
    if (!/^\d{2}:\d{2}$/.test(val)) {
      if (val.length === 5 && val[2] === ':') {
        const [h, m] = val.split(':');
        const validH = Math.min(23, Math.max(0, parseInt(h) || 0)).toString().padStart(2, '0');
        const validM = Math.min(59, Math.max(0, parseInt(m) || 0)).toString().padStart(2, '0');
        setter(`${validH}:${validM}`);
      } else {
        setter(fallback);
      }
    } else {
      const [h, m] = val.split(':');
      const validH = Math.min(23, Math.max(0, parseInt(h) || 0)).toString().padStart(2, '0');
      const validM = Math.min(59, Math.max(0, parseInt(m) || 0)).toString().padStart(2, '0');
      if (`${validH}:${validM}` !== val) setter(`${validH}:${validM}`);
    }
  };

  const handlePickerChange = (event, selectedDate) => {
    setShowPicker(null);
    if (selectedDate && event.type !== 'dismissed') {
      const h = selectedDate.getHours().toString().padStart(2, '0');
      const m = selectedDate.getMinutes().toString().padStart(2, '0');
      if (showPicker === 'start') setStartTime(`${h}:${m}`);
      if (showPicker === 'end') setEndTime(`${h}:${m}`);
    }
  };

  const getTimeDate = (timeStr) => {
    const [h, m] = (timeStr || '09:00').split(':');
    const d = new Date();
    d.setHours(parseInt(h) || 0, parseInt(m) || 0, 0, 0);
    return d;
  };

  // Toggle date selection
  const toggleDate = (dateIso) => {
    if (selectedDates.includes(dateIso)) {
      setSelectedDates(selectedDates.filter((d) => d !== dateIso));
    } else {
      setSelectedDates([...selectedDates, dateIso]);
    }
  };

  // Quick date presets
  const selectWeekdays = () => {
    const weekdays = days
      .filter((d) => d.getDay() !== 0 && d.getDay() !== 6)
      .map((d) => d.toISOString().split('T')[0]);
    setSelectedDates(weekdays);
  };

  const selectAllDays = () => {
    setSelectedDates(days.map((d) => d.toISOString().split('T')[0]));
  };

  const clearSelectedDates = () => {
    setSelectedDates([]);
  };

  // Quick preset working hours
  const setQuickHours = (start, end) => {
    setStartTime(start);
    setEndTime(end);
  };

  // Estimated slots calculation
  const estimatedSlotsPerDay = useMemo(() => {
    const [sh, sm] = startTime.split(':').map((x) => parseInt(x) || 0);
    const [eh, em] = endTime.split(':').map((x) => parseInt(x) || 0);
    const startMins = sh * 60 + sm;
    const endMins = eh * 60 + em;
    if (endMins <= startMins) return 0;
    const step = (Number(duration) || 30) + (Number(breakDuration) || 0);
    if (step <= 0) return 0;
    return Math.floor((endMins - startMins) / step);
  }, [startTime, endTime, duration, breakDuration]);

  const totalEstimatedSlots = selectedDates.length * estimatedSlotsPerDay;

  // Create slots handler
  const handleCreateSlots = async () => {
    setErrorMessage(null);
    if (selectedDates.length === 0) {
      const msg = t('doctor_dashboard.select_dates_first', 'Пожалуйста, выберите даты');
      setErrorMessage(msg);
      Alert.alert(t('common.error', 'Ошибка'), msg);
      return;
    }
    if (estimatedSlotsPerDay <= 0) {
      const msg = 'Время окончания должно быть позже времени начала.';
      setErrorMessage(msg);
      Alert.alert(t('common.error', 'Ошибка'), msg);
      return;
    }

    setAppLoading(true);
    try {
      const newSlots = [];
      const durNum = Number(duration) || 30;
      const breakNum = Number(breakDuration) || 0;
      const parsedPrice = Math.max(0, parseFloat(price) || 0);
      const profCodes = selectedProfessions.length > 0 ? selectedProfessions : null;

      selectedDates.forEach((dateStr) => {
        let current = new Date(`${dateStr}T${startTime.padStart(5, '0')}:00`);
        const end = new Date(`${dateStr}T${endTime.padStart(5, '0')}:00`);

        while (current < end) {
          newSlots.push({
            start_at: current.toISOString(),
            duration: durNum,
            price: parsedPrice,
            profession_codes: profCodes,
          });
          current = new Date(current.getTime() + (durNum + breakNum) * 60000);
        }
      });

      if (newSlots.length === 0) {
        throw new Error('Не удалось сгенерировать слоты');
      }

      await slotsApi.createBulk(newSlots);
      setSelectedDates([]);
      setErrorMessage(null);
      await fetchSlots();
      setActiveTab('manage');
      Alert.alert(t('common.success', 'Успешно'), t('doctor_dashboard.slots_created', 'Слоты успешно созданы'));
    } catch (e) {
      let friendlyMsg = e?.message || 'Не удалось создать слоты';
      if (
        e?.status === 409 ||
        friendlyMsg.includes('409') ||
        friendlyMsg.toLowerCase().includes('conflict') ||
        friendlyMsg.toLowerCase().includes('booked') ||
        friendlyMsg.toLowerCase().includes('overlapping') ||
        friendlyMsg.toLowerCase().includes('пересечение')
      ) {
        friendlyMsg = 'Выбранное время пересекается с уже существующими слотами или занято другими записями. Выберите другое время или удалите старые слоты во вкладке «Мои слоты».';
      }
      setErrorMessage(friendlyMsg);
      Alert.alert(t('common.error', 'Ошибка'), friendlyMsg);
    } finally {
      setAppLoading(false);
    }
  };

  // Delete single slot
  const handleDeleteSlot = async (slotId) => {
    setDeletingId(slotId);
    try {
      await slotsApi.delete(slotId);
      await fetchSlots();
    } catch (e) {
      Alert.alert(t('common.error', 'Ошибка'), e.message || 'Не удалось удалить слот');
    } finally {
      setDeletingId(null);
    }
  };

  // Bulk delete all free slots for a specific day
  const handleBulkDeleteDate = async (dateKey, freeSlots) => {
    if (!freeSlots || freeSlots.length === 0) return;

    const confirmAction = async () => {
      setBulkDeletingDate(dateKey);
      try {
        await Promise.all(freeSlots.map((s) => slotsApi.delete(s.id)));
        await fetchSlots();
      } catch (e) {
        Alert.alert(t('common.error', 'Ошибка'), e.message || 'Не удалось удалить слоты за день');
      } finally {
        setBulkDeletingDate(null);
      }
    };

    if (Platform.OS === 'web') {
      const ok = window.confirm(`Удалить все свободные слоты (${freeSlots.length} шт.) за ${formatHeaderDate(dateKey)}?`);
      if (ok) confirmAction();
    } else {
      Alert.alert(
        'Очистить день',
        `Удалить все свободные слоты (${freeSlots.length} шт.) за ${formatHeaderDate(dateKey)}?`,
        [
          { text: t('common.cancel', 'Отмена'), style: 'cancel' },
          { text: 'Удалить', style: 'destructive', onPress: confirmAction },
        ]
      );
    }
  };

  // Helper date formatters
  const formatTimeStr = (iso) => {
    const d = new Date(iso);
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  const getSlotEndTime = (iso, dur) => {
    const d = new Date(iso);
    const end = new Date(d.getTime() + (Number(dur) || 30) * 60000);
    const h = end.getHours().toString().padStart(2, '0');
    const m = end.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  const formatHeaderDate = (dateStr) => {
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const d = new Date(year, month - 1, day);
      const today = new Date();
      const isToday =
        today.getFullYear() === year &&
        today.getMonth() === month - 1 &&
        today.getDate() === day;

      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);
      const isTomorrow =
        tomorrow.getFullYear() === year &&
        tomorrow.getMonth() === month - 1 &&
        tomorrow.getDate() === day;

      const weekday = d.toLocaleDateString('ru-RU', { weekday: 'long' });
      const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
      const monthName = d.toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' });

      if (isToday) return `Сегодня, ${monthName}`;
      if (isTomorrow) return `Завтра, ${monthName}`;
      return `${capitalizedWeekday}, ${monthName}`;
    } catch {
      return dateStr;
    }
  };

  // Render modal content
  const modalBody = (
    <View style={styles.modalContent}>
      {/* 1. Header with title, close, and segmented tabs */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.titleWithIcon}>
            <View style={styles.headerIconBox}>
              <Icon name="Calendar" size={sizes.scale(20)} color={colors.p500} />
            </View>
            <Text style={styles.headerTitle}>
              {t('doctor_dashboard.manage_availability', 'Управление графиком')}
            </Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeBtn}
            hitSlop={getHitSlopForSize(32, 32)}
            accessibilityRole="button"
            accessibilityLabel="Закрыть"
          >
            <Icon name="X" size={sizes.scale(22)} color={colors.n700} />
          </TouchableOpacity>
        </View>

        {/* Segmented Tab Bar */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'manage' && styles.tabItemActive]}
            onPress={() => {
              setActiveTab('manage');
              hasAutoScrolledRef.current = false;
              setTimeout(() => tryAutoScrollToTarget(), 100);
            }}
          >
            <Icon
              name="Clock"
              size={sizes.scale(16)}
              color={activeTab === 'manage' ? colors.p500 : colors.n500}
            />
            <Text
              style={[styles.tabText, activeTab === 'manage' && styles.tabTextActive]}
            >
              Мои слоты
            </Text>
            {totalSlotsCount > 0 && (
              <View
                style={[
                  styles.tabBadge,
                  activeTab === 'manage' && styles.tabBadgeActive,
                ]}
              >
                <Text
                  style={[
                    styles.tabBadgeText,
                    activeTab === 'manage' && styles.tabBadgeTextActive,
                  ]}
                >
                  {totalSlotsCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'create' && styles.tabItemActive]}
            onPress={() => setActiveTab('create')}
          >
            <Icon
              name="Plus"
              size={sizes.scale(16)}
              color={activeTab === 'create' ? colors.p500 : colors.n500}
            />
            <Text
              style={[styles.tabText, activeTab === 'create' && styles.tabTextActive]}
            >
              Создать слоты
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. TAB CONTENT: MANAGE SLOTS */}
      {activeTab === 'manage' && (
        <View style={styles.tabContentContainer}>
          {/* Filter Bar */}
          <View style={styles.filterBar}>
            <TouchableOpacity
              style={[
                styles.filterChip,
                slotFilter === 'all' && styles.filterChipActive,
              ]}
              onPress={() => setSlotFilter('all')}
            >
              <Text
                style={[
                  styles.filterChipText,
                  slotFilter === 'all' && styles.filterChipTextActive,
                ]}
              >
                Все ({totalSlotsCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterChip,
                slotFilter === 'free' && styles.filterChipActive,
              ]}
              onPress={() => setSlotFilter('free')}
            >
              <View style={[styles.filterDot, { backgroundColor: colors.p500 }]} />
              <Text
                style={[
                  styles.filterChipText,
                  slotFilter === 'free' && styles.filterChipTextActive,
                ]}
              >
                Свободные ({freeSlotsCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterChip,
                slotFilter === 'booked' && styles.filterChipActive,
              ]}
              onPress={() => setSlotFilter('booked')}
            >
              <View style={[styles.filterDot, { backgroundColor: '#F59E0B' }]} />
              <Text
                style={[
                  styles.filterChipText,
                  slotFilter === 'booked' && styles.filterChipTextActive,
                ]}
              >
                Забронированы ({bookedSlotsCount})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Slots List grouped by Date */}
          <ScrollView
            ref={manageScrollRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.manageScrollContent}
          >
            {loading ? (
              <View style={styles.centerLoading}>
                <ActivityIndicator color={colors.p500} size="large" />
                <Text style={styles.loadingText}>Загрузка слотов...</Text>
              </View>
            ) : groupedSlots.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconBox}>
                  <Icon name="Calendar" size={sizes.scale(40)} color={colors.p500} />
                </View>
                <Text style={styles.emptyTitle}>
                  {existingSlots.length === 0
                    ? t('doctor_dashboard.no_slots_yet', 'У вас пока нет созданных слотов')
                    : 'Нет слотов по выбранному фильтру'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  Создайте сетку приёма для пациентов в удобное рабочее время
                </Text>
                <Button
                  title="Создать расписание"
                  variant="primary"
                  onPress={() => setActiveTab('create')}
                  style={styles.emptyBtn}
                />
              </View>
            ) : (
              groupedSlots.map((group) => {
                const dayFreeSlots = group.slots.filter((s) => !s.booking_id);
                const isDayDeleting = bulkDeletingDate === group.dateKey;

                return (
                  <View
                    key={group.dateKey}
                    style={styles.dateSection}
                    onLayout={(e) => {
                      const y = e.nativeEvent?.layout?.y;
                      if (typeof y === 'number') {
                        sectionPositionsRef.current[group.dateKey] = y;
                        if (group.dateKey === targetScrollDateKey) {
                          tryAutoScrollToTarget();
                        }
                      }
                    }}
                  >
                    {/* Date Section Header */}
                    <View style={styles.dateSectionHeader}>
                      <View style={styles.dateHeaderLeft}>
                        <Text style={styles.dateHeading}>
                          {formatHeaderDate(group.dateKey)}
                        </Text>
                        {group.dateKey === todayStr && (
                          <View style={styles.todayPill}>
                            <Text style={styles.todayPillText}>{t('common.today', 'Сегодня')}</Text>
                          </View>
                        )}
                        <View style={styles.dateCountBadge}>
                          <Text style={styles.dateCountText}>
                            {group.slots.length} {group.slots.length === 1 ? 'слот' : 'слотов'}
                            {group.booked > 0 ? ` (${group.booked} забронировано)` : ''}
                          </Text>
                        </View>
                      </View>

                      {dayFreeSlots.length > 0 && (
                        <TouchableOpacity
                          style={styles.clearDayBtn}
                          onPress={() => handleBulkDeleteDate(group.dateKey, dayFreeSlots)}
                          disabled={isDayDeleting}
                          hitSlop={getHitSlopForSize(24, 24)}
                        >
                          {isDayDeleting ? (
                            <ActivityIndicator size="small" color={colors.d500} />
                          ) : (
                            <>
                              <Icon name="Trash2" size={sizes.scale(14)} color={colors.d500} />
                              <Text style={styles.clearDayBtnText}>Очистить свободные</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Slots Grid */}
                    <View style={styles.slotsGrid}>
                      {group.slots.map((slot) => {
                        const isBooked = !!slot.booking_id;
                        const isDeleting = deletingId === slot.id;
                        const start = formatTimeStr(slot.start_at);
                        const end = getSlotEndTime(slot.start_at, slot.duration);

                        return (
                          <View
                            key={slot.id}
                            style={[
                              styles.slotCard,
                              isBooked ? styles.slotCardBooked : styles.slotCardFree,
                            ]}
                          >
                            <View style={styles.slotCardHeader}>
                              <View style={styles.slotTimeRow}>
                                <Icon
                                  name={isBooked ? 'Lock' : 'Clock'}
                                  size={sizes.scale(13)}
                                  color={isBooked ? '#D97706' : colors.p500}
                                />
                                <Text
                                  style={[
                                    styles.slotTimeText,
                                    isBooked && styles.slotTimeTextBooked,
                                  ]}
                                >
                                  {start} — {end}
                                </Text>
                              </View>

                              {!isBooked && (
                                <TouchableOpacity
                                  style={styles.deleteSlotBtn}
                                  onPress={() => handleDeleteSlot(slot.id)}
                                  disabled={isDeleting}
                                  hitSlop={getHitSlopForSize(28, 28)}
                                  accessibilityRole="button"
                                  accessibilityLabel="Удалить слот"
                                >
                                  {isDeleting ? (
                                    <ActivityIndicator size="small" color={colors.d500} />
                                  ) : (
                                    <Icon name="Trash2" size={sizes.scale(15)} color={colors.d500} />
                                  )}
                                </TouchableOpacity>
                              )}
                            </View>

                            <View style={styles.slotCardFooter}>
                              <View style={styles.slotMetaCol}>
                                <Text style={styles.slotDurationLabel}>
                                  {slot.duration} {t('common.min_short', 'мин')}
                                  {slot.price !== undefined && slot.price !== null && (
                                    <Text style={styles.slotPriceText}> • ${slot.price}</Text>
                                  )}
                                </Text>
                                {Array.isArray(slot.profession_codes) && slot.profession_codes.length > 0 && (
                                  <Text style={styles.slotProfText} numberOfLines={1}>
                                    {slot.profession_codes
                                      .map((code) => t(`professions.${code}`, code))
                                      .join(', ')}
                                  </Text>
                                )}
                              </View>
                              {isBooked ? (
                                <View style={styles.bookedPill}>
                                  <Text style={styles.bookedPillText}>
                                    {t('doctor_dashboard.booked', 'Забронирован')}
                                  </Text>
                                </View>
                              ) : (
                                <View style={styles.freePill}>
                                  <Text style={styles.freePillText}>Свободен</Text>
                                </View>
                              )}
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      )}

      {/* 3. TAB CONTENT: CREATE SLOTS (GENERATOR) */}
      {activeTab === 'create' && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Section A: Date Selection */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>
                  {t('doctor_dashboard.select_dates', 'Выберите даты')}
                </Text>
                <Text style={styles.sectionSubtitle}>
                  Дни с синей точкой уже имеют созданные слоты
                </Text>
              </View>
              <View style={styles.quickDateRow}>
                <TouchableOpacity onPress={selectWeekdays} style={styles.quickDateBtn}>
                  <Text style={styles.quickDateBtnText}>Будни</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={selectAllDays} style={styles.quickDateBtn}>
                  <Text style={styles.quickDateBtnText}>Все 14 дн.</Text>
                </TouchableOpacity>
                {selectedDates.length > 0 && (
                  <TouchableOpacity onPress={clearSelectedDates} style={styles.quickDateBtn}>
                    <Text style={[styles.quickDateBtnText, { color: colors.d500 }]}>Сброс</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.daysScroll}
            >
              {days.map((d, i) => {
                const iso = d.toISOString().split('T')[0];
                const isSelected = selectedDates.includes(iso);
                const hasExisting = !!slotsByDateMap[iso];
                const dayExistingCount = slotsByDateMap[iso]?.total || 0;

                return (
                  <TouchableOpacity
                    key={i}
                    style={[styles.dayCard, isSelected && styles.dayCardSelected]}
                    onPress={() => toggleDate(iso)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.dayName, isSelected && styles.textWhite]}>
                      {t(
                        `days.${d.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase()}`,
                        d.toLocaleDateString('ru-RU', { weekday: 'short' })
                      )}
                    </Text>
                    <Text style={[styles.dayNum, isSelected && styles.textWhite]}>
                      {d.getDate()}
                    </Text>

                    {/* Dot indicator if day has existing slots */}
                    {hasExisting && (
                      <View style={styles.existingDotContainer}>
                        <View
                          style={[
                            styles.existingDot,
                            isSelected && styles.existingDotSelected,
                          ]}
                        />
                        <Text
                          style={[
                            styles.existingCountText,
                            isSelected && styles.textWhite,
                          ]}
                        >
                          {dayExistingCount}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Section B: Working Hours & Presets */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>
                {t('doctor_dashboard.working_hours', 'Рабочее время')}
              </Text>
            </View>

            {/* Presets */}
            <View style={styles.presetsRow}>
              <TouchableOpacity
                style={[
                  styles.presetChip,
                  startTime === '09:00' && endTime === '18:00' && styles.presetChipActive,
                ]}
                onPress={() => setQuickHours('09:00', '18:00')}
              >
                <Text
                  style={[
                    styles.presetChipText,
                    startTime === '09:00' && endTime === '18:00' && styles.presetChipTextActive,
                  ]}
                >
                  09:00 — 18:00 (Весь день)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.presetChip,
                  startTime === '09:00' && endTime === '14:00' && styles.presetChipActive,
                ]}
                onPress={() => setQuickHours('09:00', '14:00')}
              >
                <Text
                  style={[
                    styles.presetChipText,
                    startTime === '09:00' && endTime === '14:00' && styles.presetChipTextActive,
                  ]}
                >
                  09:00 — 14:00 (Утро)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.presetChip,
                  startTime === '14:00' && endTime === '20:00' && styles.presetChipActive,
                ]}
                onPress={() => setQuickHours('14:00', '20:00')}
              >
                <Text
                  style={[
                    styles.presetChipText,
                    startTime === '14:00' && endTime === '20:00' && styles.presetChipTextActive,
                  ]}
                >
                  14:00 — 20:00 (Вечер)
                </Text>
              </TouchableOpacity>
            </View>

            {/* From / To Inputs */}
            <View style={styles.row}>
              <View style={styles.inputCol}>
                <Text style={styles.label}>{t('common.from', 'От')}</Text>
                <View style={styles.timeInput}>
                  {Platform.OS === 'web' ? (
                    <TextInput
                      style={styles.timeText}
                      value={startTime}
                      onChangeText={(txt) => handleTimeChange(txt, setStartTime)}
                      onBlur={() => handleTimeBlur(startTime, setStartTime, '09:00')}
                      placeholder="09:00"
                      maxLength={5}
                    />
                  ) : (
                    <TouchableOpacity
                      style={styles.timeTouchable}
                      onPress={() => setShowPicker('start')}
                    >
                      <Text style={styles.timeText}>{startTime}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <View style={styles.inputCol}>
                <Text style={styles.label}>{t('common.to', 'До')}</Text>
                <View style={styles.timeInput}>
                  {Platform.OS === 'web' ? (
                    <TextInput
                      style={styles.timeText}
                      value={endTime}
                      onChangeText={(txt) => handleTimeChange(txt, setEndTime)}
                      onBlur={() => handleTimeBlur(endTime, setEndTime, '18:00')}
                      placeholder="18:00"
                      maxLength={5}
                    />
                  ) : (
                    <TouchableOpacity
                      style={styles.timeTouchable}
                      onPress={() => setShowPicker('end')}
                    >
                      <Text style={styles.timeText}>{endTime}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>

            {showPicker && (
              <DateTimePicker
                value={getTimeDate(showPicker === 'start' ? startTime : endTime)}
                mode="time"
                display="default"
                onChange={handlePickerChange}
              />
            )}
          </View>

          {/* Section C: Session Duration & Breaks */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t('doctor_dashboard.session_duration', 'Длительность сеанса')}
            </Text>
            <View style={styles.durationGrid}>
              {[30, 45, 60].map((val) => (
                <TouchableOpacity
                  key={val}
                  style={[styles.durationBtn, duration === val && styles.durationBtnActive]}
                  onPress={() => setDuration(val)}
                >
                  <Text
                    style={[
                      styles.durationBtnText,
                      duration === val && styles.textWhite,
                    ]}
                  >
                    {val} {t('common.min_short', 'мин')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.sectionTitle, { marginTop: sizes.scale(16) }]}>
              {t('doctor_dashboard.break_between_sessions', 'Перерыв между сеансами')}
            </Text>
            <View style={styles.durationGrid}>
              {[0, 5, 10, 15].map((val) => (
                <TouchableOpacity
                  key={val}
                  style={[
                    styles.durationBtn,
                    breakDuration === val && styles.durationBtnActive,
                  ]}
                  onPress={() => setBreakDuration(val)}
                >
                  <Text
                    style={[
                      styles.durationBtnText,
                      breakDuration === val && styles.textWhite,
                    ]}
                  >
                    {val === 0 ? 'Без перерыва' : `${val} ${t('common.min_short', 'мин')}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Section D: Consultation Price */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>
                  {t('doctor_dashboard.slot_price', 'Цена за приём ($)')}
                </Text>
                <Text style={styles.sectionSubtitle}>
                  {t('doctor_dashboard.slot_price_hint', 'Укажите стоимость консультации для создаваемых слотов')}
                </Text>
              </View>
            </View>

            <View style={styles.presetsRow}>
              {['25', '40', '50', '75', '100'].map((pVal) => (
                <TouchableOpacity
                  key={pVal}
                  style={[styles.presetChip, price === pVal && styles.presetChipActive]}
                  onPress={() => setPrice(pVal)}
                >
                  <Text style={[styles.presetChipText, price === pVal && styles.presetChipTextActive]}>
                    ${pVal}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.presetChip, (price === '0' || price === '') && styles.presetChipActive]}
                onPress={() => setPrice('0')}
              >
                <Text style={[styles.presetChipText, (price === '0' || price === '') && styles.presetChipTextActive]}>
                  {t('doctor_dashboard.free_consultation', 'Бесплатно')}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.priceInputWrapper}>
              <Text style={styles.currencyPrefix}>$</Text>
              <TextInput
                style={styles.priceInput}
                value={price}
                onChangeText={(txt) => setPrice(txt.replace(/[^0-9.]/g, ''))}
                keyboardType="numeric"
                placeholder="0"
                maxLength={6}
              />
            </View>
          </View>

          {/* Section E: Specialties (if doctor has > 1 profession) */}
          {doctorProfessions.length > 1 && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={styles.sectionTitle}>
                    {t('doctor_dashboard.slot_specialties', 'Специальности для слотов')}
                  </Text>
                  <Text style={styles.sectionSubtitle}>
                    {t('doctor_dashboard.slot_specialties_hint', 'По умолчанию слоты доступны по всем вашим специальностям. Можно выбрать одну или несколько.')}
                  </Text>
                </View>
              </View>

              <View style={styles.professionsChipsRow}>
                <TouchableOpacity
                  style={[
                    styles.profChip,
                    selectedProfessions.length === 0 && styles.profChipActive,
                  ]}
                  onPress={() => setSelectedProfessions([])}
                >
                  <Text
                    style={[
                      styles.profChipText,
                      selectedProfessions.length === 0 && styles.profChipTextActive,
                    ]}
                  >
                    {t('doctor_dashboard.all_specialties', 'Все специальности (общие)')}
                  </Text>
                </TouchableOpacity>

                {doctorProfessions.map((code) => {
                  const isChecked = selectedProfessions.includes(code);
                  return (
                    <TouchableOpacity
                      key={code}
                      style={[styles.profChip, isChecked && styles.profChipActive]}
                      onPress={() => {
                        if (isChecked) {
                          setSelectedProfessions(selectedProfessions.filter((c) => c !== code));
                        } else {
                          setSelectedProfessions([...selectedProfessions, code]);
                        }
                      }}
                    >
                      {isChecked && (
                        <Icon name="Check" size={sizes.scale(14)} color={colors.p500} style={{ marginRight: 4 }} />
                      )}
                      <Text style={[styles.profChipText, isChecked && styles.profChipTextActive]}>
                        {t(`professions.${code}`, code)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Section F: Generation Preview Box */}
          <View style={styles.previewBox}>
            <View style={styles.previewHeader}>
              <Icon name="Sparkles" size={sizes.scale(18)} color={colors.p500} />
              <Text style={styles.previewTitle}>Сводка генерации</Text>
            </View>
            <View style={styles.previewContent}>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>Выбрано дней:</Text>
                <Text style={styles.previewValue}>
                  {selectedDates.length > 0
                    ? `${selectedDates.length} ${selectedDates.length === 1 ? 'день' : 'дней'}`
                    : 'Не выбраны'}
                </Text>
              </View>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>Время:</Text>
                <Text style={styles.previewValue}>
                  {startTime} — {endTime}
                </Text>
              </View>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>Сеанс:</Text>
                <Text style={styles.previewValue}>
                  {duration} мин{breakDuration > 0 ? ` (+${breakDuration} мин перерыв)` : ''}
                </Text>
              </View>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>Стоимость слота:</Text>
                <Text style={[styles.previewValue, { color: colors.p600, fontWeight: '700' }]}>
                  {parseFloat(price) > 0 ? `$${parseFloat(price)}` : t('doctor_dashboard.free_consultation', 'Бесплатно')}
                </Text>
              </View>
              {doctorProfessions.length > 1 && (
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Специальности:</Text>
                  <Text style={styles.previewValue} numberOfLines={1}>
                    {selectedProfessions.length === 0
                      ? t('doctor_dashboard.all_specialties', 'Все специальности')
                      : selectedProfessions.map((c) => t(`professions.${c}`, c)).join(', ')}
                  </Text>
                </View>
              )}
              <View style={[styles.previewRow, styles.previewHighlightRow]}>
                <Text style={styles.previewHighlightLabel}>Будет создано слотов:</Text>
                <Text style={styles.previewHighlightValue}>
                  ~{totalEstimatedSlots} слотов
                </Text>
              </View>
            </View>
          </View>

          {/* Inline Error Banner if Creation Fails */}
          {errorMessage && (
            <View style={styles.errorBanner}>
              <Icon name="AlertCircle" size={sizes.scale(20)} color={colors.danger} />
              <View style={styles.errorBannerTextContainer}>
                <Text style={styles.errorBannerTitle}>{t('common.error', 'Ошибка создания')}</Text>
                <Text style={styles.errorBannerText}>{errorMessage}</Text>
              </View>
              <TouchableOpacity onPress={() => setErrorMessage(null)} hitSlop={getHitSlopForSize(24, 24)}>
                <Icon name="X" size={sizes.scale(16)} color={colors.danger} />
              </TouchableOpacity>
            </View>
          )}

          {/* Primary Action Button */}
          <Button
            title={
              totalEstimatedSlots > 0
                ? `Создать ~${totalEstimatedSlots} слотов`
                : t('doctor_dashboard.apply_schedule', 'Применить расписание')
            }
            variant="primary"
            onPress={handleCreateSlots}
            disabled={selectedDates.length === 0 || estimatedSlotsPerDay <= 0}
            style={styles.applyBtn}
          />
        </ScrollView>
      )}
    </View>
  );

  // Return centered dialog on desktop/tablet vs full sheet on mobile
  if (isCenteredModal) {
    return (
      <Modal
        visible={visible}
        animationType="fade"
        transparent={true}
        onRequestClose={onClose}
        accessibilityViewIsModal={true}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity
            style={styles.desktopBackdrop}
            activeOpacity={1}
            onPress={onClose}
          />
          <View style={styles.dialogCard}>{modalBody}</View>
        </KeyboardAvoidingView>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.mobileContainer}>{modalBody}</SafeAreaView>
    </Modal>
  );
}

const themeStyles = (theme) => ({
  // Responsive Presentation
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.sizes.spacing.m,
  },
  desktopBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
  },
  dialogCard: {
    width: '94%',
    maxWidth: 720,
    maxHeight: '90%',
    backgroundColor: theme.colors.bg,
    borderRadius: theme.sizes.scale(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 20,
    overflow: 'hidden',
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column',
  },
  mobileContainer: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  modalContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: theme.colors.bg,
  },

  // Header
  header: {
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.sizes.spacing.m,
    paddingTop: theme.sizes.spacing.m,
    paddingBottom: theme.sizes.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.n200,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.sizes.spacing.s,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.sizes.spacing.s,
  },
  headerIconBox: {
    width: theme.sizes.scale(36),
    height: theme.sizes.scale(36),
    borderRadius: theme.sizes.scale(10),
    backgroundColor: theme.colors.opacityP100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n900,
  },
  closeBtn: {
    padding: theme.sizes.spacing.xs,
  },

  // Segmented Tab Bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.n100,
    borderRadius: theme.sizes.borderRadius.medium,
    padding: 3,
    marginTop: theme.sizes.spacing.xs,
    marginBottom: theme.sizes.spacing.xs,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.sizes.scale(8),
    borderRadius: theme.sizes.borderRadius.medium - 2,
    gap: theme.sizes.spacing.xs,
  },
  tabItemActive: {
    backgroundColor: theme.colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n600,
    fontWeight: '600',
  },
  tabTextActive: {
    color: theme.colors.p500,
    fontWeight: '700',
  },
  tabBadge: {
    backgroundColor: theme.colors.n300,
    paddingHorizontal: theme.sizes.scale(6),
    paddingVertical: 1,
    borderRadius: theme.sizes.scale(10),
    marginLeft: 2,
  },
  tabBadgeActive: {
    backgroundColor: theme.colors.p500,
  },
  tabBadgeText: {
    fontSize: theme.sizes.scale(11),
    fontWeight: '700',
    color: theme.colors.n700,
  },
  tabBadgeTextActive: {
    color: theme.colors.white,
  },

  // Tab Content Wrapper
  tabContentContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },

  // Filters Bar in Manage Tab
  filterBar: {
    flexDirection: 'row',
    gap: theme.sizes.spacing.s,
    paddingHorizontal: theme.sizes.spacing.m,
    paddingVertical: theme.sizes.spacing.s,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.n100,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.sizes.scale(12),
    paddingVertical: theme.sizes.scale(6),
    borderRadius: theme.sizes.scale(20),
    backgroundColor: theme.colors.n100,
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: theme.colors.opacityP100,
    borderColor: theme.colors.p500,
    borderWidth: 1,
  },
  filterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  filterChipText: {
    fontSize: theme.sizes.scale(12),
    color: theme.colors.n700,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: theme.colors.p600,
    fontWeight: '700',
  },

  // Manage Tab Scroll
  manageScrollContent: {
    padding: theme.sizes.spacing.m,
    paddingBottom: theme.sizes.spacing.xxl,
  },
  centerLoading: {
    paddingVertical: theme.sizes.scale(50),
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.sizes.spacing.m,
  },
  loadingText: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n500,
  },

  // Empty State
  emptyState: {
    paddingVertical: theme.sizes.scale(40),
    paddingHorizontal: theme.sizes.spacing.m,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconBox: {
    width: theme.sizes.scale(80),
    height: theme.sizes.scale(80),
    borderRadius: theme.sizes.scale(40),
    backgroundColor: theme.colors.opacityP100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.sizes.spacing.m,
  },
  emptyTitle: {
    ...theme.sizes.typography.h4,
    color: theme.colors.n900,
    textAlign: 'center',
    marginBottom: theme.sizes.spacing.xs,
  },
  emptySubtitle: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n500,
    textAlign: 'center',
    maxWidth: 320,
    marginBottom: theme.sizes.spacing.l,
  },
  emptyBtn: {
    minWidth: 200,
  },

  // Date Section
  dateSection: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.medium,
    padding: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.n200,
  },
  dateSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.sizes.spacing.m,
    paddingBottom: theme.sizes.spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.n100,
  },
  dateHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.sizes.spacing.s,
    flexWrap: 'wrap',
  },
  dateHeading: {
    ...theme.sizes.typography.h4,
    color: theme.colors.n900,
    fontWeight: '700',
  },
  dateCountBadge: {
    backgroundColor: theme.colors.n100,
    paddingHorizontal: theme.sizes.scale(8),
    paddingVertical: 2,
    borderRadius: theme.sizes.scale(12),
  },
  todayPill: {
    backgroundColor: theme.colors.opacityP100,
    borderColor: theme.colors.p500,
    borderWidth: 1,
    paddingHorizontal: theme.sizes.scale(8),
    paddingVertical: 2,
    borderRadius: theme.sizes.scale(12),
  },
  todayPillText: {
    fontSize: theme.sizes.scale(11),
    fontWeight: '700',
    color: theme.colors.p600,
  },
  dateCountText: {
    fontSize: theme.sizes.scale(11),
    color: theme.colors.n600,
  },
  clearDayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  clearDayBtnText: {
    fontSize: theme.sizes.scale(12),
    color: theme.colors.d500,
    fontWeight: '600',
  },

  // Slots Grid
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.sizes.spacing.s,
  },
  slotCard: {
    flexGrow: 1,
    minWidth: theme.sizes.scale(150),
    maxWidth: '48.5%',
    borderRadius: theme.sizes.borderRadius.medium,
    padding: theme.sizes.scale(10),
    borderWidth: 1,
  },
  slotCardFree: {
    backgroundColor: theme.colors.bg,
    borderColor: theme.colors.n200,
  },
  slotCardBooked: {
    backgroundColor: 'rgba(245, 158, 11, 0.06)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  slotCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.sizes.scale(6),
  },
  slotTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  slotTimeText: {
    fontSize: theme.sizes.scale(13),
    fontWeight: '700',
    color: theme.colors.n900,
  },
  slotTimeTextBooked: {
    color: '#92400E',
  },
  deleteSlotBtn: {
    padding: 4,
    borderRadius: 4,
  },
  slotCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  slotMetaCol: {
    flex: 1,
    marginRight: 6,
  },
  slotDurationLabel: {
    fontSize: theme.sizes.scale(11),
    color: theme.colors.n500,
  },
  slotPriceText: {
    fontSize: theme.sizes.scale(11),
    fontWeight: '700',
    color: theme.colors.p600,
  },
  slotProfText: {
    fontSize: theme.sizes.scale(10),
    color: theme.colors.n600,
    marginTop: 2,
  },
  freePill: {
    backgroundColor: theme.colors.opacityP100,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  freePillText: {
    fontSize: theme.sizes.scale(10),
    color: theme.colors.p600,
    fontWeight: '600',
  },
  bookedPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  bookedPillText: {
    fontSize: theme.sizes.scale(10),
    color: '#B45309',
    fontWeight: '700',
  },

  // Create Tab Scroll
  scrollContent: {
    padding: theme.sizes.spacing.m,
    paddingBottom: theme.sizes.spacing.xxl,
  },
  section: {
    marginBottom: theme.sizes.spacing.l,
    backgroundColor: theme.colors.white,
    padding: theme.sizes.spacing.m,
    borderRadius: theme.sizes.borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.colors.n200,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.sizes.spacing.m,
    flexWrap: 'wrap',
    gap: theme.sizes.spacing.s,
  },
  sectionTitle: {
    ...theme.sizes.typography.h4,
    color: theme.colors.n900,
  },
  sectionSubtitle: {
    ...theme.sizes.typography.caption,
    color: theme.colors.n500,
    marginTop: 2,
  },
  quickDateRow: {
    flexDirection: 'row',
    gap: 6,
  },
  quickDateBtn: {
    backgroundColor: theme.colors.n100,
    paddingHorizontal: theme.sizes.scale(8),
    paddingVertical: theme.sizes.scale(4),
    borderRadius: theme.sizes.scale(6),
  },
  quickDateBtnText: {
    fontSize: theme.sizes.scale(11),
    fontWeight: '600',
    color: theme.colors.n700,
  },

  // 14-day Strip
  daysScroll: {
    gap: theme.sizes.spacing.s,
    paddingVertical: 4,
  },
  dayCard: {
    width: theme.sizes.scale(64),
    height: theme.sizes.scale(84),
    backgroundColor: theme.colors.bg,
    borderRadius: theme.sizes.borderRadius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.n200,
    position: 'relative',
  },
  dayCardSelected: {
    backgroundColor: theme.colors.p500,
    borderColor: theme.colors.p500,
  },
  dayName: {
    ...theme.sizes.typography.caption,
    color: theme.colors.n600,
    marginBottom: theme.sizes.scale(2),
    fontWeight: '600',
  },
  dayNum: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n900,
  },
  textWhite: {
    color: theme.colors.white,
  },
  existingDotContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  existingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.p500,
  },
  existingDotSelected: {
    backgroundColor: theme.colors.white,
  },
  existingCountText: {
    fontSize: theme.sizes.scale(10),
    fontWeight: '700',
    color: theme.colors.p600,
  },

  // Presets
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.sizes.spacing.s,
    marginBottom: theme.sizes.spacing.m,
  },
  presetChip: {
    backgroundColor: theme.colors.n100,
    paddingHorizontal: theme.sizes.scale(12),
    paddingVertical: theme.sizes.scale(7),
    borderRadius: theme.sizes.scale(8),
  },
  presetChipActive: {
    backgroundColor: theme.colors.opacityP100,
    borderColor: theme.colors.p500,
    borderWidth: 1,
  },
  presetChipText: {
    fontSize: theme.sizes.scale(12),
    color: theme.colors.n700,
    fontWeight: '500',
  },
  presetChipTextActive: {
    color: theme.colors.p600,
    fontWeight: '700',
  },

  // Time Inputs
  row: {
    flexDirection: 'row',
    gap: theme.sizes.spacing.m,
  },
  inputCol: {
    flex: 1,
  },
  label: {
    ...theme.sizes.typography.caption,
    color: theme.colors.n500,
    marginBottom: theme.sizes.scale(6),
  },
  timeInput: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.colors.n200,
    padding: theme.sizes.spacing.m,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  timeTouchable: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    ...theme.sizes.typography.bodyLarge,
    color: theme.colors.n900,
    textAlign: 'center',
    width: '100%',
    padding: 0,
    fontWeight: '600',
  },

  // Duration Grids
  durationGrid: {
    flexDirection: 'row',
    gap: theme.sizes.spacing.s,
  },
  durationBtn: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    borderRadius: theme.sizes.borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.colors.n200,
    paddingVertical: theme.sizes.spacing.s,
    alignItems: 'center',
  },
  durationBtnActive: {
    backgroundColor: theme.colors.p500,
    borderColor: theme.colors.p500,
  },
  durationBtnText: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n700,
    fontWeight: '600',
  },

  // Price & Specialties in Create Tab
  priceInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.colors.n200,
    paddingHorizontal: theme.sizes.spacing.m,
    paddingVertical: theme.sizes.spacing.s,
    marginTop: theme.sizes.spacing.s,
  },
  currencyPrefix: {
    fontSize: theme.sizes.scale(18),
    fontWeight: '700',
    color: theme.colors.p600,
    marginRight: 6,
  },
  priceInput: {
    flex: 1,
    fontSize: theme.sizes.scale(16),
    color: theme.colors.n900,
    fontWeight: '600',
    padding: 0,
  },
  professionsChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.sizes.spacing.s,
    marginTop: theme.sizes.spacing.xs,
  },
  profChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.n100,
    paddingHorizontal: theme.sizes.scale(12),
    paddingVertical: theme.sizes.scale(7),
    borderRadius: theme.sizes.scale(8),
    borderWidth: 1,
    borderColor: 'transparent',
  },
  profChipActive: {
    backgroundColor: theme.colors.opacityP100,
    borderColor: theme.colors.p500,
  },
  profChipText: {
    fontSize: theme.sizes.scale(12),
    color: theme.colors.n700,
    fontWeight: '500',
  },
  profChipTextActive: {
    color: theme.colors.p600,
    fontWeight: '700',
  },

  // Preview Box
  previewBox: {
    backgroundColor: theme.colors.opacityP100,
    borderRadius: theme.sizes.borderRadius.medium,
    padding: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.l,
    borderWidth: 1,
    borderColor: 'rgba(35, 211, 194, 0.3)',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.sizes.spacing.xs,
    marginBottom: theme.sizes.spacing.s,
  },
  previewTitle: {
    ...theme.sizes.typography.bodyMedium,
    fontWeight: '700',
    color: theme.colors.p600,
  },
  previewContent: {
    gap: 4,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  previewLabel: {
    fontSize: theme.sizes.scale(12),
    color: theme.colors.n600,
  },
  previewValue: {
    fontSize: theme.sizes.scale(12),
    fontWeight: '600',
    color: theme.colors.n800,
  },
  previewHighlightRow: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(35, 211, 194, 0.3)',
  },
  previewHighlightLabel: {
    fontSize: theme.sizes.scale(13),
    fontWeight: '700',
    color: theme.colors.p600,
  },
  previewHighlightValue: {
    fontSize: theme.sizes.scale(14),
    fontWeight: '800',
    color: theme.colors.p600,
  },

  // Apply Button
  applyBtn: {
    marginBottom: theme.sizes.spacing.xl,
  },

  // Error Banner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
    borderRadius: theme.sizes.borderRadius.medium,
    padding: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.m,
    gap: theme.sizes.spacing.s,
  },
  errorBannerTextContainer: {
    flex: 1,
  },
  errorBannerTitle: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.danger,
    fontWeight: '700',
    marginBottom: 2,
  },
  errorBannerText: {
    ...theme.sizes.typography.caption,
    color: theme.colors.n800,
    lineHeight: 18,
  },
});
