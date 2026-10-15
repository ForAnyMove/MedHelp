import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../../theme/ThemeContext';
import { Button } from '../../../../../components/ui/Button';
import { Icon } from '../../../../../components/ui/Icon';
import { CheckerLayout } from './CheckerLayout';
import { usePatientDashboard } from '../../../../../context/PatientDashboardContext';
import quizEn from '../../../../../locales/quiz_en.json';
import quizRu from '../../../../../locales/quiz_ru.json';

export function Step6Result({ data, answers, onBack, onClose, onEditAnswers, onRestart }) {
  const { t, i18n } = useTranslation();
  const { sizes, colors } = useTheme();
  const { navigateToDoctors, navigateToConsultationDetail, navigateToHistoryDetail } = usePatientDashboard();
  const [isSummaryExpanded, setSummaryExpanded] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);

  const engineResult = data?.engineResult || data?.payload?.result || { type: 'UNKNOWN', result: '' };
  const effectiveAnswers = answers || data?.payload?.payload || data?.payload || {};
  const resType = engineResult.type || 'UNKNOWN';
  const currentLang = i18n.language && i18n.language.startsWith('ru') ? 'ru' : 'en';
  const activeDict = currentLang === 'ru' ? quizRu.quiz : quizEn.quiz;

  const isHistorical = Boolean(data?.created_at);
  const formattedDate = isHistorical 
    ? new Date(data.created_at).toLocaleDateString(currentLang === 'ru' ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) 
    : null;

  // 1. Urgency mapping
  const typeConfig = {
    'U1': { icon: 'alert-circle', color: colors.danger || '#FF3B30' },
    'U2': { icon: 'alert-triangle', color: colors.warning || '#FF9500' },
    'U3': { icon: 'clock', color: colors.p500 || colors.primary },
    'U4': { icon: 'calendar', color: colors.sBlue || '#5AC8FA' },
    'U5': { icon: 'check-circle', color: colors.success || '#34C759' },
    'UNKNOWN': { icon: 'help-circle', color: colors.n500 || '#8E8E93' }
  };
  const config = typeConfig[resType] || typeConfig['UNKNOWN'];
  const label = t(`quiz.results.${resType}.label`, resType === 'UNKNOWN' ? (currentLang === 'ru' ? 'Требуется оценка' : 'Assessment Needed') : resType);

  // 2. Fetch Result Record from localized dict
  const rawResult = engineResult.result ? activeDict.results[engineResult.result] : null;
  const enResult = engineResult.result ? quizEn.quiz.results[engineResult.result] : null;

  // 3. Deadline and Time message (priority to verified guideline strings from rawResult)
  const timeMsg = rawResult?.['Time to care'] 
    || rawResult?.['Срок обращения'] 
    || t(`quiz.results.${resType}.time`, 'Result');

  const resultTitle = rawResult?.Title || rawResult?.['Заголовок'] || (resType === 'U1' ? t('quiz.results.U1.label', 'Emergency') : t(`quiz.results.${resType}.label`, label));
  const whyText = rawResult?.['Why this recommendation'] || rawResult?.['Почему такая рекомендация'] || '';
  const careDestination = (enResult?.['Care destination'] || rawResult?.['Care destination'] || '').toLowerCase();
  const primarySpec = enResult?.['Primary specialty'] || rawResult?.['Primary specialty'] || null;

  // 4. Resolve Routing destination & Action
  const resolveKind = () => {
    const isCrisisCause = engineResult.cause === 'Q_L09_CRISIS' || (engineResult.result || '').includes('L09');
    if (careDestination.includes('crisis') && isCrisisCause) return 'crisis';
    if (resType === 'U1') return isCrisisCause ? 'crisis' : 'emergency';
    if (careDestination.includes('emergency')) return 'emergency';
    if (careDestination.includes('crisis')) return 'crisis';
    if (careDestination.includes('poison')) return 'poison';
    if (careDestination.startsWith('maternity assessment')) return 'maternity';
    if (careDestination.includes('urgent') || careDestination.includes('triage')) return 'urgent';
    if (careDestination.startsWith('self-care')) {
      if (careDestination.includes('pharmac')) return 'pharmacy';
      return 'selfcare';
    }
    return 'doctor';
  };
  const kind = resolveKind();
  const kindKey = kind.toUpperCase();

  const actionMsg = t(`quiz.ui.ACTION_${kindKey}`, t(`quiz.results.${resType}.action`, 'Please consult a doctor.'));
  const isExternalEmergency = kind === 'emergency' || kind === 'crisis' || kind === 'poison';

  // 5. Supportive Care & Condition Details
  const conditionKey = enResult?.['Primary possible condition'] || rawResult?.['Primary possible condition'] || rawResult?.['Основная возможная причина'];
  const hasCondition = conditionKey && !conditionKey.includes('null') && !conditionKey.includes('omit');
  const supportiveObj = hasCondition ? activeDict.supportiveCare[conditionKey] : null;

  // 6. Escalation Block
  const escalationKey = enResult?.['Escalation signs'] || rawResult?.['Escalation signs'] || rawResult?.['Когда повысить срочность'];
  const hasEscalation = escalationKey && escalationKey.startsWith('E_');
  const escalationText = hasEscalation ? activeDict.escalations[escalationKey] : null;

  // 7. Assessment limitations
  const isLimited = (engineResult.result || '').includes('_ASSESSMENT_') || (engineResult.result || '').includes('UNSUPPORTED');
  const isUncertain = (engineResult.result || '').includes('UNCERTAINTY');

  const mapSpecialty = (quizSpec) => {
    switch(quizSpec) {
      case 'SP_FAMILY_MEDICINE': return 'general_practitioner';
      case 'SP_INTERNAL_MEDICINE': return 'general_practitioner';
      case 'SP_ENT': return 'ent';
      case 'SP_NEUROLOGY': return 'neurologist';
      case 'SP_GASTROENTEROLOGY': return 'gastroenterologist';
      case 'SP_DERMATOLOGY': return 'dermatologist';
      case 'SP_UROLOGY': return 'urologist';
      case 'SP_OBSTETRICS_GYNECOLOGY': return 'gynaecologist';
      case 'SP_ORTHOPEDICS': return 'orthopedist';
      case 'SP_RHEUMATOLOGY': return 'rheumatologist';
      case 'SP_CARDIOLOGY': return 'cardiologist';
      case 'SP_PULMONOLOGY': return 'pulmonologist';
      case 'SP_OPHTHALMOLOGY': return 'ophthalmologist';
      case 'SP_DENTISTRY': return 'dentist';
      case 'SP_PSYCHIATRY': return 'psychiatrist';
      case 'SP_EMERGENCY_MEDICINE': return 'general_practitioner';
      default: return null;
    }
  };

  const mappedSpecCode = primarySpec ? mapSpecialty(primarySpec) : null;
  const specDisplayName = mappedSpecCode 
    ? t(`specializations.${mappedSpecCode}`, t(`professions.${mappedSpecCode}`, activeDict.specialties?.[primarySpec] || activeDict.ui?.[primarySpec] || mappedSpecCode))
    : (primarySpec ? (activeDict.specialties?.[primarySpec] || activeDict.ui?.[primarySpec] || null) : null);

  const cta = isExternalEmergency
    ? (kind === 'crisis' 
        ? t('quiz.ui.CRISIS_TITLE', 'Crisis helpline')
        : kind === 'poison'
        ? t('quiz.ui.POISON_TITLE', 'Poison control')
        : t('quiz.ui.EMERGENCY_TITLE', 'Emergency care (112)'))
    : data?.consultation
    ? t('history.go_to_consultation', currentLang === 'ru' ? 'Перейти к консультации' : 'Go to Consultation')
    : (resType === 'U2' 
        ? t('quiz.ui.BOOK_URGENT', 'Book urgent appointment')
        : t('quiz.ui.BOOK_APPOINTMENT', 'Book an appointment'));

  const handleCtaPress = () => {
    if (isExternalEmergency) {
      setModalVisible(true);
    } else if (data?.consultation) {
      if (data.consultation.status === 'completed') {
        navigateToHistoryDetail(data.consultation.id);
      } else {
        navigateToConsultationDetail(data.consultation);
      }
    } else {
      navigateToDoctors(mappedSpecCode, {
        id: data?.id,
        created_at: data?.created_at,
        engineResult,
        recommendations: {
          ...(data?.recommendations || {}),
          recommendedSpecialty: mappedSpecCode,
          title: resultTitle,
        },
        payload: effectiveAnswers,
      });
    }
  };

  const st = styles(sizes, colors);

  return (
    <CheckerLayout onBack={onBack} hideLogo={true}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={st.content}>
        
        {/* Historical Checkup Badge */}
        {isHistorical && (
          <View style={st.histBox}>
            <Icon name="clock" size={sizes.scale(16)} color={colors.primary} style={{ marginRight: sizes.spacing.s }} />
            <Text style={st.histText}>
              {t('quiz.ui.PREVIOUS_RESULT_NOTE', 'This is the result from your last completed assessment')}
              {formattedDate ? ` (${formattedDate})` : ''}
            </Text>
          </View>
        )}

        {/* Linked Consultation Banner (if booked) */}
        {data?.consultation && (
          <View style={st.linkedCard}>
            <View style={st.linkedHeader}>
              <View style={st.linkedHeaderLeft}>
                <Icon name="calendar" size={sizes.scale(18)} color={colors.primary} style={{ marginRight: sizes.scale(6) }} />
                <Text style={st.linkedLabel}>
                  {t('history.linked_consultation_title', currentLang === 'ru' ? 'Привязанная консультация' : 'Linked Consultation')}
                </Text>
              </View>
              <View style={[st.statusPill, { backgroundColor: data.consultation.status === 'completed' ? (colors.success + '20') : (colors.primary + '18') }]}>
                <Text style={[st.statusPillText, { color: data.consultation.status === 'completed' ? colors.success : colors.primary }]}>
                  {data.consultation.status === 'completed' 
                    ? (currentLang === 'ru' ? 'Завершена' : 'Completed')
                    : (currentLang === 'ru' ? 'Запланирована' : 'Scheduled')}
                </Text>
              </View>
            </View>

            <View style={st.linkedDoctorRow}>
              <View style={st.linkedDoctorAvatar}>
                <Icon name="doctor-01" size={sizes.scale(22)} color={colors.primary} />
              </View>
              <View style={st.linkedDoctorDetails}>
                <Text style={st.linkedDoctorName}>
                  {t('doctors.dr_prefix')}{data.consultation.doctor?.profile?.first_name} {data.consultation.doctor?.profile?.last_name}
                </Text>
                <Text style={st.linkedDoctorSpec}>
                  {data.consultation.doctor?.profession_code 
                    ? t(`professions.${data.consultation.doctor.profession_code}`, data.consultation.doctor.profession_code) 
                    : t('doctors.general')}
                </Text>
                {data.consultation.slot?.start_at && (
                  <Text style={st.linkedConsultationTime}>
                    {new Date(data.consultation.slot.start_at).toLocaleDateString(currentLang === 'ru' ? 'ru-RU' : 'en-US', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                )}
              </View>
            </View>

            <TouchableOpacity 
              style={st.linkedActionBtn}
              activeOpacity={0.8}
              onPress={() => {
                if (data.consultation.status === 'completed') {
                  navigateToHistoryDetail(data.consultation.id);
                } else {
                  navigateToConsultationDetail(data.consultation);
                }
              }}
            >
              <Text style={st.linkedActionBtnText}>
                {t('history.go_to_consultation', currentLang === 'ru' ? 'Перейти к консультации' : 'Go to Consultation')}
              </Text>
              <Icon name="arrow-right" size={sizes.scale(16)} color={colors.white} />
            </TouchableOpacity>
          </View>
        )}

        {/* Block 1: Urgency Card, Deadline and Action */}
        <View style={[st.priorityCard, { borderColor: config.color, borderWidth: 2 }]}>
          <View style={[st.iconCircle, { backgroundColor: config.color + '20' }]}>
            <Icon name={config.icon} size={sizes.scale(32)} color={config.color} />
          </View>
          <Text style={[st.prioLabel, { fontSize: sizes.scale(22) }]}>{label}</Text>
          <Text style={st.prioDesc}>{timeMsg}</Text>
        </View>

        <Text style={st.sectionTitle}>{t('quiz.ui.ACTION_REQUIRED', 'Recommended Action')}</Text>
        <View style={st.cardContainer}>
          <Text style={st.recText}>{actionMsg}</Text>
        </View>

        {/* Recommended Specialist Block */}
        {specDisplayName && !isExternalEmergency && (
          <>
            <Text style={st.sectionTitle}>{t('quiz.ui.RECOMMENDED_SPECIALIST', 'Recommended Specialist')}</Text>
            <View style={[st.cardContainer, st.specCard]}>
              <View style={[st.iconCircleSmall, { backgroundColor: colors.primary + '18' }]}>
                <Icon name="user-check" size={sizes.scale(22)} color={colors.primary} />
              </View>
              <View style={st.specInfo}>
                <Text style={st.specName}>{specDisplayName}</Text>
                <Text style={st.specHint}>{t('quiz.ui.SPECIALIST_HINT', 'Doctors in this field can evaluate your symptoms and advise on treatment')}</Text>
              </View>
            </View>
          </>
        )}

        {/* Block 2 & 3: Result Title / Possible Condition */}
        {resultTitle && (
          <>
            <Text style={st.sectionTitle}>{hasCondition ? t('quiz.ui.POSSIBLE_CONDITION', 'Possible Condition') : t('quiz.ui.ASSESSMENT_RESULT', 'Assessment Result')}</Text>
            <View style={st.cardContainer}>
              <Text style={st.conditionTitle}>{resultTitle}</Text>
              {whyText ? <Text style={st.whyText}>{whyText}</Text> : null}
            </View>
          </>
        )}

        {/* Block 4: Supportive Care */}
        {supportiveObj && supportiveObj.supportive && (
          <>
            <Text style={st.sectionTitle}>{t('quiz.ui.SUPPORTIVE_CARE', 'Supportive Steps')}</Text>
            <View style={st.cardContainer}>
              <Text style={st.bodyText}>{supportiveObj.supportive}</Text>
            </View>
          </>
        )}

        {/* Block 5: Escalation Signs (When to seek earlier or emergency help) */}
        {escalationText && (
          <>
            <Text style={st.sectionTitle}>{t('quiz.ui.ESCALATION_TITLE', 'When to Seek Urgent Help')}</Text>
            <View style={[st.cardContainer, { borderLeftWidth: 4, borderLeftColor: colors.warning || '#FF9500' }]}>
              <Text style={st.escalationText}>{escalationText}</Text>
            </View>
          </>
        )}

        {/* Block 6: Limitations Disclaimer */}
        <View style={st.disclaimerBox}>
          <Icon name="info" size={sizes.scale(18)} color={colors.n500} style={{ marginRight: sizes.spacing.s }} />
          <Text style={st.disclaimerText}>
            {isUncertain 
              ? t('quiz.ui.RESULT_UNCERTAIN', 'Some information remains uncertain, so a human clinical assessment is needed.')
              : isLimited
              ? t('quiz.ui.RESULT_LIMITED', 'This is a limited assessment. It recommends a next step but does not identify the cause.')
              : t('quiz.ui.RESULT_LIMIT', 'This is guidance based on your answers, not a diagnosis. It cannot rule out every serious cause.')
            }
          </Text>
        </View>

        {/* Block 7: Collapsible Answers Summary & Edit Answers */}
        <TouchableOpacity 
          style={st.summaryHeader} 
          onPress={() => setSummaryExpanded(prev => !prev)}
        >
          <Text style={st.summaryTitle}>{t('quiz.ui.RESULT_SUMMARY', 'Your answers')}</Text>
          <Icon name={isSummaryExpanded ? 'chevron-up' : 'chevron-down'} size={sizes.scale(20)} color={colors.n600} />
        </TouchableOpacity>

        {isSummaryExpanded && (
          <View style={st.summaryContent}>
            {Object.entries(effectiveAnswers || {})
              .filter(([qKey]) => !qKey.includes('_MAIN') || activeDict.questions[qKey])
              .map(([qKey, aVal]) => {
                const qObj = activeDict.questions[qKey] || quizEn.quiz.questions[qKey];
                const qText = qObj?.text || t(`quiz.questions.${qKey}.text`, qKey);
                let valText = '';
                if (Array.isArray(aVal)) {
                  valText = aVal.map(v => qObj?.options?.[v] || t(`quiz.questions.${qKey}.options.${v}`, v)).join(', ');
                } else {
                  valText = qObj?.options?.[aVal] || t(`quiz.questions.${qKey}.options.${aVal}`, String(aVal));
                }
                return (
                  <View key={qKey} style={st.summaryRow}>
                    <Text style={st.summaryQ}>{qText}</Text>
                    <Text style={st.summaryA}>{valText}</Text>
                  </View>
                );
              })}
          </View>
        )}

        {/* Footer Actions */}
        <View style={st.footer}>
          <Button 
            title={cta} 
            variant="primary" 
            onPress={handleCtaPress} 
            style={{ marginBottom: sizes.spacing.m }}
          />

          {onRestart && (
            <Button 
              title={t('quiz.ui.RESTART_QUIZ', 'Retake assessment')} 
              variant="outlined" 
              onPress={onRestart} 
              style={{ marginBottom: sizes.spacing.m }}
            />
          )}

          {!isHistorical && onEditAnswers && (
            <Button 
              title={t('quiz.ui.EDIT_ANSWERS', 'Review or change answers')} 
              variant="outlined" 
              onPress={onEditAnswers} 
              style={{ marginBottom: sizes.spacing.m }}
            />
          )}

          <Button 
            title={t('common.close', 'Close')} 
            variant="ghost" 
            onPress={onClose} 
          />
        </View>
      </ScrollView>

      {/* Service Contact Modal */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
      >
        <View style={st.modalOverlay}>
          <View style={st.modalContent}>
            <Text style={st.modalTitle}>
              {kind === 'crisis' 
                ? t('quiz.ui.CRISIS_TITLE', 'Crisis Support Helpline')
                : kind === 'poison'
                ? t('quiz.ui.POISON_TITLE', 'Poison Control Center')
                : t('quiz.ui.EMERGENCY_TITLE', 'Emergency Medical Services')}
            </Text>
            <Text style={st.modalText}>
              {kind === 'crisis'
                ? t('quiz.ui.CRISIS_TEXT', 'Please reach out to a 24/7 mental health crisis service or seek immediate emergency care.')
                : kind === 'poison'
                ? t('quiz.ui.POISON_TEXT', 'Please contact poison control or emergency medical services immediately.')
                : t('quiz.ui.EMERGENCY_TEXT', 'Please call emergency services (112 or 911) immediately or proceed to the nearest emergency room.')}
            </Text>
            <Button
              title={t('quiz.ui.OK', 'OK')}
              variant="primary"
              onPress={() => setModalVisible(false)}
            />
          </View>
        </View>
      </Modal>
    </CheckerLayout>
  );
}

const styles = (sizes, colors) => StyleSheet.create({
  content: {
    paddingHorizontal: sizes.spacing.l,
    paddingBottom: sizes.spacing.xl,
  },
  sectionTitle: {
    ...sizes.typography.h3,
    color: colors.n900,
    marginBottom: sizes.spacing.s,
    marginTop: sizes.spacing.l,
  },
  priorityCard: {
    backgroundColor: colors.white,
    borderRadius: sizes.borderRadius.large,
    padding: sizes.spacing.l,
    alignItems: 'center',
    shadowColor: colors.n900,
    shadowOffset: { width: 0, height: sizes.scale(2) },
    shadowOpacity: 0.08,
    shadowRadius: sizes.scale(6),
    elevation: 3,
    marginTop: sizes.spacing.m,
  },
  iconCircle: {
    width: sizes.scale(56),
    height: sizes.scale(56),
    borderRadius: sizes.scale(28),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: sizes.spacing.m,
  },
  prioLabel: {
    ...sizes.typography.h2,
    fontWeight: '700',
    color: colors.n900,
    textAlign: 'center',
    marginBottom: sizes.scale(6),
  },
  prioDesc: {
    ...sizes.typography.body,
    color: colors.n700,
    textAlign: 'center',
    fontWeight: '500',
  },
  cardContainer: {
    backgroundColor: colors.white,
    borderRadius: sizes.borderRadius.medium,
    padding: sizes.spacing.m,
    shadowColor: colors.n900,
    shadowOffset: { width: 0, height: sizes.scale(1) },
    shadowOpacity: 0.05,
    shadowRadius: sizes.scale(4),
    elevation: 2,
  },
  recText: {
    ...sizes.typography.body,
    color: colors.n800,
    lineHeight: sizes.scale(22),
  },
  conditionTitle: {
    ...sizes.typography.h3,
    color: colors.primary,
    fontWeight: '700',
    marginBottom: sizes.spacing.xs,
  },
  whyText: {
    ...sizes.typography.body2,
    color: colors.n700,
    lineHeight: sizes.scale(20),
  },
  bodyText: {
    ...sizes.typography.body,
    color: colors.n800,
    lineHeight: sizes.scale(22),
  },
  escalationText: {
    ...sizes.typography.body2,
    color: colors.n800,
    lineHeight: sizes.scale(20),
    fontWeight: '500',
  },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.n100 || '#f5f5f5',
    padding: sizes.spacing.m,
    borderRadius: sizes.borderRadius.medium,
    marginTop: sizes.spacing.l,
  },
  disclaimerText: {
    ...sizes.typography.caption,
    color: colors.n600,
    flex: 1,
    lineHeight: sizes.scale(18),
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: sizes.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.n200 || '#eee',
    marginTop: sizes.spacing.l,
  },
  summaryTitle: {
    ...sizes.typography.h3,
    color: colors.n800,
  },
  summaryContent: {
    backgroundColor: colors.n50 || '#fafafa',
    padding: sizes.spacing.m,
    borderRadius: sizes.borderRadius.medium,
    marginTop: sizes.spacing.s,
  },
  summaryRow: {
    marginBottom: sizes.spacing.s,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.n200 || '#eee',
    paddingBottom: sizes.spacing.xs,
  },
  summaryQ: {
    ...sizes.typography.caption,
    color: colors.n600,
    fontWeight: '600',
  },
  summaryA: {
    ...sizes.typography.body2,
    color: colors.n900,
    marginTop: sizes.scale(2),
  },
  footer: {
    marginTop: sizes.spacing.xl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: sizes.borderRadius.large,
    padding: sizes.spacing.xl,
    width: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: sizes.scale(2) },
    shadowOpacity: 0.25,
    shadowRadius: sizes.scale(4),
    elevation: 5,
  },
  modalTitle: {
    ...sizes.typography.h3,
    color: colors.n900,
    marginBottom: sizes.spacing.m,
    textAlign: 'center',
  },
  modalText: {
    ...sizes.typography.body,
    color: colors.n700,
    marginBottom: sizes.spacing.xl,
    textAlign: 'center',
  },
  specCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: sizes.spacing.m,
  },
  iconCircleSmall: {
    width: sizes.scale(44),
    height: sizes.scale(44),
    borderRadius: sizes.scale(22),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: sizes.spacing.m,
  },
  specInfo: {
    flex: 1,
  },
  specName: {
    ...sizes.typography.h3,
    color: colors.n900,
    fontWeight: '700',
  },
  specHint: {
    ...sizes.typography.caption,
    color: colors.n600,
    marginTop: sizes.scale(2),
    lineHeight: sizes.scale(16),
  },
  histBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '12',
    padding: sizes.spacing.m,
    borderRadius: sizes.borderRadius.medium,
    marginTop: sizes.spacing.m,
  },
  histText: {
    ...sizes.typography.caption,
    color: colors.primary,
    fontWeight: '600',
    flex: 1,
    lineHeight: sizes.scale(18),
  },
  linkedCard: {
    backgroundColor: colors.white,
    borderRadius: sizes.borderRadius.large,
    padding: sizes.spacing.m,
    marginTop: sizes.spacing.m,
    borderWidth: 1.5,
    borderColor: colors.primary + '40',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: sizes.scale(2) },
    shadowOpacity: 0.08,
    shadowRadius: sizes.scale(6),
    elevation: 3,
  },
  linkedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: sizes.spacing.s,
  },
  linkedHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkedLabel: {
    ...sizes.typography.h3,
    fontSize: sizes.scale(15),
    fontWeight: '700',
    color: colors.n900,
  },
  statusPill: {
    paddingHorizontal: sizes.scale(10),
    paddingVertical: sizes.scale(4),
    borderRadius: sizes.scale(12),
  },
  statusPillText: {
    ...sizes.typography.caption,
    fontWeight: '700',
    fontSize: sizes.scale(11),
  },
  linkedDoctorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: sizes.spacing.xs,
  },
  linkedDoctorAvatar: {
    width: sizes.scale(46),
    height: sizes.scale(46),
    borderRadius: sizes.scale(23),
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: sizes.spacing.m,
  },
  linkedDoctorDetails: {
    flex: 1,
  },
  linkedDoctorName: {
    ...sizes.typography.body,
    fontWeight: '700',
    color: colors.n900,
  },
  linkedDoctorSpec: {
    ...sizes.typography.caption,
    color: colors.n600,
    marginTop: sizes.scale(1),
  },
  linkedConsultationTime: {
    ...sizes.typography.caption,
    color: colors.primary,
    fontWeight: '600',
    marginTop: sizes.scale(2),
  },
  linkedActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: sizes.borderRadius.medium,
    paddingVertical: sizes.scale(10),
    paddingHorizontal: sizes.spacing.m,
    marginTop: sizes.spacing.s,
  },
  linkedActionBtnText: {
    ...sizes.typography.button,
    color: colors.white,
    fontWeight: '700',
    fontSize: sizes.scale(14),
    marginRight: sizes.spacing.s,
  }
});
