import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../theme/ThemeContext';
import { Icon } from '../../../../components/ui/Icon';
import { formatIsoDate } from '../../../../utils/dateUtils';
import { Button } from '../../../../components/ui/Button';
import quizRu from '../../../../locales/quiz_ru.json';
import quizEn from '../../../../locales/quiz_en.json';

const FILTERS = ['All', 'Urgent', 'Routine', 'Selfcare'];

export function PatientAllCheckups({ activeSegment = 'all', checkups = [], loading = false, onSelectCheckup, onBack, onStartCheckup }) {
  const { t, i18n } = useTranslation();
  const { colors, sizes } = useTheme();
  const currentLang = i18n.language && i18n.language.startsWith('ru') ? 'ru' : 'en';
  const activeDict = currentLang === 'ru' ? quizRu.quiz : quizEn.quiz;

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const filteredData = useMemo(() => {
    if (!checkups) return [];
    let list = [...checkups];

    if (activeSegment === 'latest') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      list = list.filter(c => new Date(c.created_at) >= weekAgo);
    }

    if (activeFilter === 'Urgent') {
      list = list.filter(c => {
        const u = c.payload?.result?.type || '';
        return u === 'U1' || u === 'U2';
      });
    } else if (activeFilter === 'Routine') {
      list = list.filter(c => {
        const u = c.payload?.result?.type || '';
        return u === 'U3' || u === 'U4';
      });
    } else if (activeFilter === 'Selfcare') {
      list = list.filter(c => {
        const u = c.payload?.result?.type || '';
        return u === 'U5';
      });
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      list = list.filter(c => {
        const resKey = c.payload?.result?.result;
        const resObj = resKey ? activeDict.results[resKey] : null;
        const title = (resObj?.Title || resObj?.['Заголовок'] || resKey || '').toLowerCase();
        const why = (resObj?.['Why this recommendation'] || resObj?.['Почему такая рекомендация'] || '').toLowerCase();
        return title.includes(q) || why.includes(q);
      });
    }

    // Sort descending by created_at
    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return list;
  }, [checkups, activeSegment, activeFilter, searchQuery, activeDict]);

  const getUrgencyConfig = (resType) => {
    switch (resType) {
      case 'U1':
        return {
          bg: (colors.danger || '#FF3B30') + '15',
          text: colors.danger || '#FF3B30',
          border: colors.danger || '#FF3B30',
          label: t('quiz.results.U1.label', currentLang === 'ru' ? 'Экстренно' : 'Emergency'),
          icon: 'alert-circle',
        };
      case 'U2':
        return {
          bg: (colors.warning || '#FF9500') + '15',
          text: colors.warning || '#FF9500',
          border: colors.warning || '#FF9500',
          label: t('quiz.results.U2.label', currentLang === 'ru' ? 'Срочно' : 'Urgent'),
          icon: 'alert-triangle',
        };
      case 'U3':
        return {
          bg: colors.p100 || (colors.p500 + '15'),
          text: colors.p500,
          border: colors.p500,
          label: t('quiz.results.U3.label', currentLang === 'ru' ? 'В ближайшее время' : 'Soon'),
          icon: 'clock',
        };
      case 'U4':
        return {
          bg: (colors.sBlue || '#5AC8FA') + '20',
          text: colors.sBlue || '#2699FB',
          border: colors.sBlue || '#5AC8FA',
          label: t('quiz.results.U4.label', currentLang === 'ru' ? 'Планово' : 'Routine'),
          icon: 'calendar',
        };
      case 'U5':
        return {
          bg: (colors.success || '#2CD196') + '15',
          text: colors.success || '#2CD196',
          border: colors.success || '#2CD196',
          label: t('quiz.results.U5.label', currentLang === 'ru' ? 'Самопомощь' : 'Self-care'),
          icon: 'check-circle',
        };
      default:
        return {
          bg: (colors.n500 || '#8E8E93') + '15',
          text: colors.n700 || '#555',
          border: colors.n300 || '#ccc',
          label: t('quiz.results.UNKNOWN.label', currentLang === 'ru' ? 'Требуется оценка' : 'Assessment Needed'),
          icon: 'help-circle',
        };
    }
  };

  const getFilterLabel = (f) => {
    switch (f) {
      case 'All': return t('history.all', currentLang === 'ru' ? 'Все' : 'All');
      case 'Urgent': return currentLang === 'ru' ? 'Срочные' : 'Urgent';
      case 'Routine': return currentLang === 'ru' ? 'Плановые' : 'Routine';
      case 'Selfcare': return currentLang === 'ru' ? 'Самопомощь' : 'Self-care';
      default: return f;
    }
  };

  const st = styles(colors, sizes);

  return (
    <View style={st.container}>
      {/* Header */}
      <View style={st.header}>
        <TouchableOpacity onPress={onBack} style={st.backButton} activeOpacity={0.7}>
          <Icon name="arrow-back" size={sizes.scale(24)} color={colors.p500} />
        </TouchableOpacity>
        <Text style={st.headerTitle}>{t('history.all_checkups', currentLang === 'ru' ? 'Результаты опросов' : 'Survey Results')}</Text>
        <View style={st.badge}>
          <Text style={st.badgeText}>{filteredData.length}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={st.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={st.searchContainer}>
          <Icon name="search" size={sizes.scale(20)} color={colors.p500} style={st.searchIcon} />
          <TextInput
            style={st.searchInput}
            placeholder={t('history.search_checkup', currentLang === 'ru' ? 'Поиск по результатам...' : 'Search results...')}
            placeholderTextColor={colors.n400}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={st.clearButton}>
              <Icon name="close" size={sizes.scale(16)} color={colors.p500} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.filtersScroll}>
          {FILTERS.map((f) => {
            const isSelected = activeFilter === f;
            return (
              <TouchableOpacity
                key={f}
                style={[st.filterChip, isSelected && st.filterChipActive]}
                onPress={() => setActiveFilter(f)}
                activeOpacity={0.7}
              >
                <Text style={[st.filterChipText, isSelected && st.filterChipTextActive]}>
                  {getFilterLabel(f)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Loading Indicator */}
        {loading && (
          <View style={st.loadingBox}>
            <ActivityIndicator size="large" color={colors.p500} />
          </View>
        )}

        {/* Checkups List */}
        {!loading && filteredData.length > 0 && (
          <View style={st.list}>
            {filteredData.map((item) => {
              const engineResult = item.payload?.result || item.engineResult || {};
              const resType = engineResult.type || 'UNKNOWN';
              const cfg = getUrgencyConfig(resType);
              const resKey = engineResult.result;
              const rawResult = resKey ? activeDict.results[resKey] : null;
              const title = rawResult?.Title || rawResult?.['Заголовок'] || item.recommendations?.title || resKey || t('quiz.ui.ASSESSMENT_RESULT', 'Результат опроса');
              const timeMsg = rawResult?.['Time to care'] || rawResult?.['Срок обращения'] || null;
              
              const formattedDate = item.created_at
                ? new Date(item.created_at).toLocaleDateString(currentLang === 'ru' ? 'ru-RU' : 'en-US', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : null;

              return (
                <TouchableOpacity
                  key={item.id}
                  style={st.card}
                  activeOpacity={0.7}
                  onPress={() => onSelectCheckup && onSelectCheckup(item)}
                >
                  <View style={st.cardHeader}>
                    <View style={[st.urgencyBadge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
                      <Icon name={cfg.icon} size={sizes.scale(14)} color={cfg.text} style={{ marginRight: sizes.scale(4) }} />
                      <Text style={[st.urgencyText, { color: cfg.text }]}>{cfg.label}</Text>
                    </View>
                    {formattedDate && <Text style={st.dateText}>{formattedDate}</Text>}
                  </View>

                  <Text style={st.titleText} numberOfLines={2}>
                    {title}
                  </Text>

                  {timeMsg && (
                    <Text style={st.timeText} numberOfLines={2}>
                      {timeMsg}
                    </Text>
                  )}

                  {item.consultation && (
                    <View style={st.linkedConsultationRow}>
                      <Icon name="calendar" size={sizes.scale(14)} color={colors.p500} style={{ marginRight: sizes.scale(6) }} />
                      <Text style={st.linkedConsultationText} numberOfLines={1}>
                        {t('history.booking_with_doctor', currentLang === 'ru' ? 'Запись к врачу' : 'Doctor appointment')}: {t('doctors.dr_prefix')}{item.consultation.doctor?.profile?.first_name} {item.consultation.doctor?.profile?.last_name}
                      </Text>
                      <View style={[st.linkedStatusDot, { backgroundColor: item.consultation.status === 'completed' ? colors.success : colors.p500 }]} />
                    </View>
                  )}

                  <View style={st.cardFooter}>
                    <Text style={st.viewDetailsText}>{t('history.view_checkup_btn', currentLang === 'ru' ? 'Смотреть результат и рекомендации' : 'View result & recommendations')}</Text>
                    <Icon name="arrow-right" size={sizes.scale(16)} color={colors.p500} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Empty State */}
        {!loading && filteredData.length === 0 && (
          <View style={st.emptyContainer}>
            <View style={st.emptyIconBox}>
              <Icon name="medic-history" size={sizes.scale(40)} color={colors.p500} />
            </View>
            <Text style={st.emptyTitle}>
              {searchQuery ? (currentLang === 'ru' ? 'Ничего не найдено' : 'No matching results') : t('history.no_checkups', currentLang === 'ru' ? 'Вы пока не проходили опросы' : 'No assessments completed yet')}
            </Text>
            <Text style={st.emptySubtitle}>
              {searchQuery ? (currentLang === 'ru' ? 'Попробуйте изменить запрос поиска' : 'Try searching for different symptoms') : t('history.no_checkups_desc', currentLang === 'ru' ? 'Пройдите опрос о симптомах, чтобы получить персональные рекомендации врача.' : 'Take an assessment to check your symptoms and get tailored recommendations.')}
            </Text>
            {!searchQuery && onStartCheckup && (
              <Button
                title={t('history.start_checkup_btn', currentLang === 'ru' ? 'Пройти опрос' : 'Start assessment')}
                variant="primary"
                onPress={onStartCheckup}
                style={{ marginTop: sizes.spacing.l, minWidth: sizes.scale(200) }}
              />
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = (colors, sizes) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: sizes.spacing.m,
      paddingTop: sizes.spacing.m,
      paddingBottom: sizes.spacing.s,
    },
    backButton: {
      padding: sizes.spacing.xs,
    },
    headerTitle: {
      ...sizes.typography.h3,
      fontFamily: 'Manrope_700Bold',
      color: colors.n900,
      flex: 1,
      marginLeft: sizes.spacing.s,
    },
    badge: {
      backgroundColor: colors.p100 || '#E0F9F6',
      paddingHorizontal: sizes.spacing.s,
      paddingVertical: sizes.scale(4),
      borderRadius: sizes.borderRadius.large,
    },
    badgeText: {
      ...sizes.typography.caption,
      fontFamily: 'Manrope_600SemiBold',
      color: colors.p500 || '#1A9C8E',
    },
    scrollContent: {
      paddingHorizontal: sizes.spacing.m,
      paddingBottom: sizes.spacing.xl,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.white,
      borderRadius: sizes.borderRadius.large,
      paddingHorizontal: sizes.spacing.m,
      height: sizes.scale(56),
      marginBottom: sizes.spacing.m,
      shadowColor: '#1A9C8E',
      shadowOffset: { width: 0, height: sizes.scale(4) },
      shadowOpacity: 0.1,
      shadowRadius: sizes.scale(10),
      elevation: 2,
    },
    searchIcon: {
      marginRight: sizes.spacing.s,
    },
    searchInput: {
      flex: 1,
      ...sizes.typography.bodyMedium,
      color: colors.n900,
      fontFamily: 'Manrope_500Medium',
    },
    clearButton: {
      padding: sizes.spacing.xs,
    },
    filtersScroll: {
      flexDirection: 'row',
      marginBottom: sizes.spacing.l,
      paddingRight: sizes.spacing.m,
    },
    filterChip: {
      paddingHorizontal: sizes.spacing.m,
      paddingVertical: sizes.spacing.s,
      borderRadius: sizes.borderRadius.large,
      borderWidth: 1,
      borderColor: colors.p500,
      marginRight: sizes.spacing.s,
      backgroundColor: 'transparent',
    },
    filterChipActive: {
      backgroundColor: colors.p500,
    },
    filterChipText: {
      ...sizes.typography.bodyMedium,
      color: colors.p500,
      fontFamily: 'Manrope_600SemiBold',
    },
    filterChipTextActive: {
      color: colors.white,
    },
    loadingBox: {
      paddingVertical: sizes.spacing.xl * 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    list: {
      gap: sizes.spacing.m,
    },
    card: {
      backgroundColor: colors.white,
      borderRadius: sizes.borderRadius.large,
      padding: sizes.spacing.m,
      marginBottom: sizes.spacing.m,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: sizes.scale(4) },
      shadowOpacity: 0.05,
      shadowRadius: sizes.scale(10),
      elevation: 2,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: sizes.spacing.s,
    },
    urgencyBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: sizes.spacing.s,
      paddingVertical: sizes.scale(4),
      borderRadius: sizes.borderRadius.medium,
      borderWidth: 1,
    },
    urgencyText: {
      ...sizes.typography.caption,
      fontFamily: 'Manrope_700Bold',
      fontSize: sizes.scale(12),
    },
    dateText: {
      ...sizes.typography.caption,
      color: colors.n500,
      fontFamily: 'Manrope_500Medium',
    },
    titleText: {
      ...sizes.typography.bodyMedium,
      color: colors.n900,
      fontFamily: 'Manrope_700Bold',
      marginTop: sizes.spacing.xs,
      marginBottom: sizes.spacing.xs,
    },
    timeText: {
      ...sizes.typography.caption,
      color: colors.n600,
      fontFamily: 'Manrope_500Medium',
      lineHeight: sizes.scale(18),
      marginBottom: sizes.spacing.m,
    },
    cardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderTopWidth: 1,
      borderTopColor: colors.n100 || '#EEF6F5',
      paddingTop: sizes.spacing.m,
      marginTop: sizes.spacing.xs,
    },
    viewDetailsText: {
      ...sizes.typography.caption,
      color: colors.p500,
      fontFamily: 'Manrope_700Bold',
    },
    linkedConsultationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.p100 || '#E0F9F6',
      borderRadius: sizes.borderRadius.medium,
      paddingHorizontal: sizes.spacing.m,
      paddingVertical: sizes.scale(8),
      marginBottom: sizes.spacing.m,
      borderWidth: 1,
      borderColor: colors.p300 || '#A0EADB',
    },
    linkedConsultationText: {
      ...sizes.typography.caption,
      color: colors.n700,
      fontFamily: 'Manrope_600SemiBold',
      flex: 1,
      fontSize: sizes.scale(12),
    },
    linkedStatusDot: {
      width: sizes.scale(8),
      height: sizes.scale(8),
      borderRadius: sizes.scale(4),
      marginLeft: sizes.scale(6),
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: sizes.spacing.xl * 2,
      paddingHorizontal: sizes.spacing.l,
    },
    emptyIconBox: {
      width: sizes.scale(80),
      height: sizes.scale(80),
      borderRadius: sizes.scale(40),
      backgroundColor: colors.p100 || '#E0F9F6',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: sizes.spacing.l,
    },
    emptyTitle: {
      ...sizes.typography.h3,
      color: colors.n900,
      fontFamily: 'Manrope_700Bold',
      marginBottom: sizes.spacing.s,
      textAlign: 'center',
    },
    emptySubtitle: {
      ...sizes.typography.bodyMedium,
      color: colors.n600,
      fontFamily: 'Manrope_500Medium',
      textAlign: 'center',
      lineHeight: sizes.scale(22),
    },
  });
