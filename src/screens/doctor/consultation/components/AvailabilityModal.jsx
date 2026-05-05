import React, { useState, useEffect, useMemo } from 'react';
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
  TextInput
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useStyles } from '../../../../theme/useStyles';
import { useTheme } from '../../../../theme/ThemeContext';
import { Icon } from '../../../../components/ui/Icon';
import { Button } from '../../../../components/ui/Button';
import { useComponentContext } from '../../../../context/GlobalContext';
import { createSlotsApi } from '../../../../api/slotsApi';

export function AvailabilityModal({ visible, onClose }) {
  const { t } = useTranslation();
  const { colors, sizes } = useTheme();
  const styles = useStyles(themeStyles);
  const { session, setAppLoading, doctorProfileController } = useComponentContext();

  // State
  const [selectedDates, setSelectedDates] = useState([]); // Array of ISO date strings (yyyy-mm-dd)
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00'); // For range generation
  const [duration, setDuration] = useState(30);
  const [breakDuration, setBreakDuration] = useState(0); // in minutes
  const [existingSlots, setExistingSlots] = useState([]);
  const [loading, setLoading] = useState(false);

  // Generate 14 days for the horizontal picker
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

  const { slotsApi } = doctorProfileController;

  const fetchSlots = async () => {
    if (!visible || !slotsApi) return;
    setLoading(true);
    try {
        const data = await slotsApi.listMine();
        setExistingSlots(data || []);
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) fetchSlots();
  }, [visible]);

  const toggleDate = (dateIso) => {
    if (selectedDates.includes(dateIso)) {
        setSelectedDates(selectedDates.filter(d => d !== dateIso));
    } else {
        setSelectedDates([...selectedDates, dateIso]);
    }
  };

  const handleCreateSlots = async () => {
    if (selectedDates.length === 0) {
        Alert.alert(t('common.error'), t('doctor_dashboard.select_dates_first'));
        return;
    }

    setAppLoading(true);
    try {
        const newSlots = [];
        selectedDates.forEach(dateStr => {
            // Very simple range generation: StartTime, EndTime, Duration + Break
            let current = new Date(`${dateStr}T${startTime.padStart(5, '0')}:00`);
            const end = new Date(`${dateStr}T${endTime.padStart(5, '0')}:00`);

            const durNum = Number(duration) || 30;
            const breakNum = Number(breakDuration) || 0;

            while (current < end) {
                newSlots.push({
                    start_at: current.toISOString(),
                    duration: durNum
                });
                // Increment by duration + break
                current = new Date(current.getTime() + (durNum + breakNum) * 60000);
            }
        });

        if (newSlots.length === 0) throw new Error("No slots generated");
        
        await slotsApi.createBulk(newSlots);
        setSelectedDates([]);
        await fetchSlots();
        Alert.alert(t('common.success'), t('doctor_dashboard.slots_created'));
    } catch (e) {
        Alert.alert(t('common.error'), e.message);
    } finally {
        setAppLoading(false);
    }
  };

  const handleDeleteSlot = async (id) => {
    setAppLoading(true);
    try {
        await slotsApi.delete(id);
        await fetchSlots();
    } catch (e) {
        Alert.alert(t('common.error'), e.message);
    } finally {
        setAppLoading(false);
    }
  };

  const formatTime = (iso) => {
      const d = new Date(iso);
      return `${d.getHours().toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Icon name="X" size={sizes.scale(24)} color={colors.n900} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('doctor_dashboard.manage_availability')}</Text>
            <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
            {/* 1. Date Selection */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('doctor_dashboard.select_dates')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daysScroll}>
                    {days.map((d, i) => {
                        const iso = d.toISOString().split('T')[0];
                        const isSelected = selectedDates.includes(iso);
                        return (
                            <TouchableOpacity 
                                key={i} 
                                style={[styles.dayCard, isSelected && styles.dayCardSelected]}
                                onPress={() => toggleDate(iso)}
                            >
                                <Text style={[styles.dayName, isSelected && styles.textWhite]}>
                                    {d.toLocaleDateString('en-US', { weekday: 'short' })}
                                </Text>
                                <Text style={[styles.dayNum, isSelected && styles.textWhite]}>
                                    {d.getDate()}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* 2. Time Range Settings */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('doctor_dashboard.working_hours')}</Text>
                <View style={styles.row}>
                    <View style={styles.inputCol}>
                        <Text style={styles.label}>{t('common.from')}</Text>
                        <View style={styles.timeInput}>
                            <TextInput 
                                style={styles.timeText} 
                                value={startTime} 
                                onChangeText={setStartTime}
                                placeholder="09:00"
                                maxLength={5}
                            />
                        </View>
                    </View>
                    <View style={styles.inputCol}>
                        <Text style={styles.label}>{t('common.to')}</Text>
                        <View style={styles.timeInput}>
                            <TextInput 
                                style={styles.timeText} 
                                value={endTime} 
                                onChangeText={setEndTime}
                                placeholder="18:00"
                                maxLength={5}
                            />
                        </View>
                    </View>
                </View>
            </View>

            {/* 3. Duration & Breaks Settings */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('doctor_dashboard.session_duration')}</Text>
                <View style={styles.durationGrid}>
                    {[30, 45, 60].map(val => (
                        <TouchableOpacity 
                            key={val} 
                            style={[styles.durationBtn, duration === val && styles.durationBtnActive]}
                            onPress={() => setDuration(val)}
                        >
                            <Text style={[styles.durationBtnText, duration === val && styles.textWhite]}>
                                {val}m
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
                
                <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Перерыв между сеансами</Text>
                <View style={styles.durationGrid}>
                    {[0, 5, 10, 15].map(val => (
                        <TouchableOpacity 
                            key={val} 
                            style={[styles.durationBtn, breakDuration === val && styles.durationBtnActive]}
                            onPress={() => setBreakDuration(val)}
                        >
                            <Text style={[styles.durationBtnText, breakDuration === val && styles.textWhite]}>
                                {val}m
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <Button 
                title={t('doctor_dashboard.apply_schedule')}
                variant="primary"
                onPress={handleCreateSlots}
                style={styles.applyBtn}
            />

            {/* 4. Existing Slots List */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('doctor_dashboard.your_slots')}</Text>
                {loading ? (
                    <ActivityIndicator color={colors.p500} />
                ) : (
                    existingSlots.length === 0 ? (
                        <Text style={styles.emptyText}>{t('doctor_dashboard.no_slots_yet')}</Text>
                    ) : (
                        existingSlots.map(slot => (
                            <View key={slot.id} style={styles.slotRow}>
                                <View style={styles.slotInfo}>
                                    <View style={styles.dot} />
                                    <Text style={styles.slotTime}>
                                        {new Date(slot.start_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                        {"  •  "}
                                        {formatTime(slot.start_at)} ({slot.duration}m)
                                    </Text>
                                    {slot.booking_id && <View style={styles.bookedBadge}><Text style={styles.bookedText}>Booked</Text></View>}
                                </View>
                                {!slot.booking_id && (
                                    <TouchableOpacity onPress={() => handleDeleteSlot(slot.id)}>
                                        <Icon name="Trash2" size={sizes.scale(18)} color={colors.d500} />
                                    </TouchableOpacity>
                                )}
                            </View>
                        ))
                    )
                )}
            </View>

        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const themeStyles = (theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.sizes.spacing.m,
    paddingVertical: theme.sizes.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.n200,
  },
  headerTitle: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n900,
  },
  closeBtn: {
      padding: theme.sizes.spacing.xs,
  },
  scrollContent: {
      padding: theme.sizes.spacing.m,
      paddingBottom: theme.sizes.spacing.xxl,
  },
  section: {
      marginBottom: theme.sizes.spacing.xl,
  },
  sectionTitle: {
      ...theme.sizes.typography.h4,
      color: theme.colors.n900,
      marginBottom: theme.sizes.spacing.m,
  },
  daysScroll: {
      gap: theme.sizes.spacing.s,
  },
  dayCard: {
      width: theme.sizes.scale(60),
      height: theme.sizes.scale(80),
      backgroundColor: theme.colors.white,
      borderRadius: theme.sizes.borderRadius.medium,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.n200,
  },
  dayCardSelected: {
      backgroundColor: theme.colors.p500,
      borderColor: theme.colors.p500,
  },
  dayName: {
      ...theme.sizes.typography.caption,
      color: theme.colors.n600,
      marginBottom: 4,
  },
  dayNum: {
      ...theme.sizes.typography.h3,
      color: theme.colors.n900,
  },
  textWhite: {
      color: theme.colors.white,
  },
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
      marginBottom: 6,
  },
  timeInput: {
      backgroundColor: theme.colors.white,
      borderRadius: theme.sizes.borderRadius.medium,
      borderWidth: 1,
      borderColor: theme.colors.n200,
      padding: theme.sizes.spacing.m,
      alignItems: 'center',
  },
  timeText: {
      ...theme.sizes.typography.bodyLarge,
      color: theme.colors.n900,
  },
  durationGrid: {
      flexDirection: 'row',
      gap: theme.sizes.spacing.s,
  },
  durationBtn: {
      flex: 1,
      backgroundColor: theme.colors.white,
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
  },
  applyBtn: {
      marginBottom: theme.sizes.spacing.xl,
  },
  slotRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: theme.sizes.spacing.s,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.n100,
  },
  slotInfo: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.p500,
      marginRight: theme.sizes.spacing.s,
  },
  slotTime: {
      ...theme.sizes.typography.bodyLarge,
      color: theme.colors.n800,
  },
  emptyText: {
      ...theme.sizes.typography.bodyMedium,
      color: theme.colors.n500,
      textAlign: 'center',
      marginTop: 20,
  },
  bookedBadge: {
      backgroundColor: theme.colors.opacityP100,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
      marginLeft: 10,
  },
  bookedText: {
      fontSize: 10,
      color: theme.colors.p600,
      fontWeight: 'bold',
  }
});
