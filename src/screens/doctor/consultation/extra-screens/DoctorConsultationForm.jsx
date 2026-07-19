import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../theme/ThemeContext';
import { useStyles } from '../../../../theme/useStyles';
import { Icon } from '../../../../components/ui/Icon';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { SubViewScreen } from '../../../../components/common/SubViewScreen';
import { useDoctorDashboard } from '../../../../context/DoctorDashboardContext';
import { useSession } from '../../../../context/SessionContext';
import { createApiClient } from '../../../../api/apiClient';
import { createConsultationsApi } from '../../../../api/consultationsApi';

export function DoctorConsultationForm({ consultation }) {
  const { sizes, colors } = useTheme();
  const styles = useStyles(themeStyles);
  const { t } = useTranslation();
  const { goToSummary, closeSummary, backFromForm, handleTabSwitchRequest, selectedConsultation } = useDoctorDashboard();
  const { session, refreshSessionToken } = useSession();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [fullConsultation, setFullConsultation] = useState(consultation);

  const [overview, setOverview] = useState('');
  const [patientHas, setPatientHas] = useState(['']);
  const [diagnosisIcd10, setDiagnosisIcd10] = useState('');
  const [diagnosisName, setDiagnosisName] = useState('');
  const [recommendations, setRecommendations] = useState(['']);
  const [nextSteps, setNextSteps] = useState(['']);
  const [prescriptions, setPrescriptions] = useState('');

  const [resultId, setResultId] = useState(null);
  const [isSent, setIsSent] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const api = createApiClient(session, refreshSessionToken);
        const consultApi = createConsultationsApi(api);

        const promises = [consultApi.getResults(consultation.id).catch(() => null)];

        if (!consultation?.patient) {
          promises.push(consultApi.getById(consultation.id).catch(() => null));
        }

        const [resultRes, consultRes] = await Promise.all(promises);

        if (consultRes) {
          setFullConsultation(consultRes);
        }

        if (resultRes) {
          const resData = resultRes;
          setResultId(resData.id);
          setIsSent(!resData.is_draft);
          setOverview(resData.overview || '');
          setDiagnosisIcd10(resData.diagnosis_icd10 || '');
          setDiagnosisName(resData.diagnosis_name || '');
          setPrescriptions(resData.prescriptions || '');

          if (resData.patient_has) {
            const parsed = typeof resData.patient_has === 'string' ? JSON.parse(resData.patient_has) : resData.patient_has;
            if (parsed.length > 0) setPatientHas(parsed);
          }
          if (resData.next_steps) {
            const parsed = typeof resData.next_steps === 'string' ? JSON.parse(resData.next_steps) : resData.next_steps;
            if (parsed.length > 0) setNextSteps(parsed);
          }
          if (resData.recommendations) {
            const parsed = typeof resData.recommendations === 'string' ? JSON.parse(resData.recommendations) : resData.recommendations;
            if (parsed.length > 0) setRecommendations(parsed);
          }
        }
      } catch (error) {
        console.error('[DoctorConsultationForm] Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (consultation?.id) {
      fetchData();
    } else {
      setIsLoading(false);
    }
  }, [consultation?.id, session]);

  const handleDynamicListChange = (setter, list, index, value) => {
    const newList = [...list];
    newList[index] = value;
    setter(newList);
  };

  const handleDynamicListAdd = (setter, list) => {
    setter([...list, '']);
  };

  const handleDynamicListRemove = (setter, list, index) => {
    const newList = list.filter((_, i) => i !== index);
    if (newList.length === 0) newList.push(''); // keep at least one empty
    setter(newList);
  };

  const handleSave = async (isDraft) => {
    setIsSaving(true);
    try {
      const api = createApiClient(session, refreshSessionToken);
      const consultApi = createConsultationsApi(api);

      const cleanPatientHas = patientHas.filter(i => i.trim() !== '');
      const cleanNextSteps = nextSteps.filter(i => i.trim() !== '');
      const cleanRecommendations = recommendations.filter(i => i.trim() !== '');

      const payload = {
        overview,
        diagnosis_icd10: diagnosisIcd10,
        diagnosis_name: diagnosisName,
        patient_has: cleanPatientHas,
        next_steps: cleanNextSteps,
        recommendations: cleanRecommendations,
        prescriptions,
        is_draft: isDraft
      };

      if (resultId) {
        await consultApi.updateResult(consultation.id, payload);
      } else {
        await consultApi.createResult(consultation.id, payload);
      }

      const { DeviceEventEmitter } = require('react-native');
      DeviceEventEmitter.emit('consultation_completed');

      setIsSaving(false);

      if (isDraft) {
        goToSummary();
      } else {
        closeSummary();
      }

    } catch (error) {
      console.error('[DoctorConsultationForm] Save error:', error);
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.p500} />
      </View>
    );
  }

  const patientName = fullConsultation?.patient?.firstName ? `${fullConsultation.patient.firstName} ${fullConsultation.patient.lastName || ''}` : t('doctor_consultation.patient_fallback', 'Patient');

  const settings = fullConsultation?.patient?.user_profile_settings?.data_visibility ?? {};
  const showDob = !settings.date_of_birth;

  const age = (showDob && fullConsultation?.patient?.date_of_birth)
    ? Math.floor((Date.now() - new Date(fullConsultation.patient.date_of_birth).getTime()) / 3.156e10)
    : null;

  const genderMap = { male: t('common.male', 'Male'), female: t('common.female', 'Female') };
  const gender = fullConsultation?.patient?.gender ? (genderMap[fullConsultation.patient.gender] || fullConsultation.patient.gender) : null;
  const bloodType = fullConsultation?.patient?.patient_profiles?.[0]?.blood_type || fullConsultation?.patient?.patient_profiles?.blood_type || null;

  const formattedDate = fullConsultation?.date
    ? new Date(fullConsultation.date).toLocaleDateString(i18n.language === 'ru' ? 'ru-RU' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';

  const metaString = [age ? t('common.years_old', { count: age, defaultValue: `${age} y.o.` }) : '', gender, bloodType].filter(Boolean).join(' • ');
  const patientMetaFull = metaString + (formattedDate ? `\n${formattedDate}` : '');

  const headerRight = (
    <TouchableOpacity
      style={styles.cancelButton}
      onPress={backFromForm}
    >
      <Icon name="edit" size={sizes.scale(20)} color={colors.p500} />
      <Text style={styles.cancelButtonText}>{t('common.cancel') || 'Cancel'}</Text>
    </TouchableOpacity>
  );

  return (
    <SubViewScreen
      title={t('doctor_consultation.summary_title') || 'Consultation summary'}
      onBack={backFromForm}
      headerRight={headerRight}
      confirmBeforeExit={true}
      confirmTitle={t('doctor_consultation.exit_title')}
      confirmMessage={t('doctor_consultation.exit_desc')}
      confirmLabel={t('doctor_consultation.exit_confirm')}
      cancelLabel={t('common.cancel')}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* Patient Info Card */}
          <View style={[styles.patientCard, { backgroundColor: colors.p100 }]}>
            <View style={[styles.patientAvatar, { backgroundColor: colors.p500 }]}>
              <Icon name="profile" size={sizes.scale(24)} color={colors.white} />
            </View>
            <View style={styles.patientInfo}>
              <Text style={styles.patientName}>{patientName}</Text>
              <Text style={styles.patientMeta}>{patientMetaFull}</Text>
            </View>

            {/* Type badge */}
            <View style={[styles.typeBadge, { backgroundColor: colors.p500 }]}>
              <Icon name="stethoscope" size={sizes.scale(14)} color={colors.white} />
            </View>
          </View>

          {/* Warning / info banner */}
          {isSent ? (
            <View style={[styles.warningBox, { backgroundColor: colors.warning + '22' }]}>
              <Icon name="important" size={sizes.scale(32)} color={colors.warning} />
              <Text style={[styles.warningText, { color: colors.warning, marginLeft: sizes.scale(12), flex: 1 }]}>
                {t('consultation.editing_sent_summary', 'Editing a sent summary — the patient will receive a notification about the update.')}
              </Text>
            </View>
          ) : (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>{t('consultation.private_notes_prefilled', 'Your private notes have been pre-filled below. Please adjust any formatting if needed before saving.')}</Text>
            </View>
          )}

          {/* Overview */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Icon name="medic-history" size={sizes.scale(24)} color={colors.p500} />
              <Text style={styles.sectionTitle}>{t('consultation.overview', 'Overview')}</Text>
              <View style={styles.requiredBadge}>
                <Text style={styles.requiredText}>{t('consultation.required', 'Required')}</Text>
              </View>
            </View>
            <TextInput
              style={styles.textArea}
              placeholder={t('consultation.eg_discussed', 'e.g. During the consultation we discussed your test results.')}
              placeholderTextColor={colors.n400}
              multiline
              textAlignVertical="top"
              maxLength={400}
              value={overview}
              onChangeText={setOverview}
            />
            <Text style={styles.charCount}>{overview.length}/400</Text>
          </View>

          {/* Patient has */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Icon name="search-found" size={sizes.scale(24)} color={colors.p500} />
              <Text style={styles.sectionTitle}>{t('consultation.patient_has', 'Patient has')}</Text>
              <View style={styles.requiredBadge}>
                <Text style={styles.requiredText}>{t('consultation.required', 'Required')}</Text>
              </View>
            </View>
            {patientHas.map((item, index) => (
              <View key={index} style={styles.dynamicRow}>
                <View style={styles.bulletDot} />
                <Input
                  containerStyle={[styles.dynamicInputPillContainer, { flex: 1 }]}
                  inputContainerStyle={styles.dynamicInputPillInner}
                  style={styles.dynamicInput}
                  value={item}
                  onChangeText={(v) => handleDynamicListChange(setPatientHas, patientHas, index, v)}
                  placeholder={t('consultation.eg_ferritin', 'e.g. Low ferritin')}
                />
                <TouchableOpacity
                  onPress={() => handleDynamicListRemove(setPatientHas, patientHas, index)}
                  style={styles.removeBtn}
                >
                  <Icon
                    name="close"
                    size={sizes.scale(20)}
                    color={colors.danger}
                    wrapped
                    wrapperColor={colors.danger}
                    wrapperOpacity={0.15}
                    wrapperSize={20}
                    wrapperRadius={sizes.borderRadius.full}
                  />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity onPress={() => handleDynamicListAdd(setPatientHas, patientHas)} style={styles.addBtn}>
              <Icon name="plus" size={sizes.scale(20)} color={colors.p500} wrapped wrapperColor={colors.p500} wrapperOpacity={0.15} wrapperSize={20} wrapperRadius={sizes.borderRadius.full} />
              <Text style={styles.addBtnText}>{t('consultation.add_finding', 'Add finding')}</Text>
            </TouchableOpacity>
          </View>

          {/* Diagnosis */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Icon name="stethoscope" size={sizes.scale(24)} color={colors.p500} />
              <Text style={styles.sectionTitle}>{t('consultation.diagnosis', 'Diagnosis')}</Text>
              <View style={styles.requiredBadge}>
                <Text style={styles.requiredText}>{t('consultation.required', 'Required')}</Text>
              </View>
            </View>
            <View style={styles.diagnosisRow}>
              <View style={styles.diagInputCol}>
                <Input
                  label={t('consultation.icd10', 'ICD-10 code')}
                  placeholder={t('consultation.eg_d50', 'e.g. D50')}
                  value={diagnosisIcd10}
                  onChangeText={setDiagnosisIcd10}
                />
              </View>
              <View style={styles.diagInputColRight}>
                <Input
                  label={t('consultation.diagnosis_name', 'Diagnosis name')}
                  placeholder={t('consultation.eg_anemia', 'e.g. Iron deficiency anemia')}
                  value={diagnosisName}
                  onChangeText={setDiagnosisName}
                />
              </View>
            </View>
          </View>

          {/* Recommendations */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Icon name="medical-document" size={sizes.scale(24)} color={colors.p500} />
              <Text style={styles.sectionTitle}>{t('consultation.recommendations', 'Recommendations')}</Text>
              <View style={styles.requiredBadge}>
                <Text style={styles.requiredText}>{t('consultation.required', 'Required')}</Text>
              </View>
            </View>
            {recommendations.map((item, index) => (
              <View key={index} style={styles.dynamicRow}>
                <View style={styles.bulletDot} />
                <Input
                  containerStyle={[styles.dynamicInputPillContainer, { flex: 1 }]}
                  inputContainerStyle={styles.dynamicInputPillInner}
                  style={styles.dynamicInput}
                  value={item}
                  onChangeText={(v) => handleDynamicListChange(setRecommendations, recommendations, index, v)}
                  placeholder={t('consultation.eg_supplements', 'e.g. Consider taking iron supplements')}
                />
                <TouchableOpacity
                  onPress={() => handleDynamicListRemove(setRecommendations, recommendations, index)}
                  style={styles.removeBtn}
                >
                  <Icon
                    name="close"
                    size={sizes.scale(20)}
                    color={colors.danger}
                    wrapped
                    wrapperColor={colors.danger}
                    wrapperOpacity={0.15}
                    wrapperSize={20}
                    wrapperRadius={sizes.borderRadius.full}
                  />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity onPress={() => handleDynamicListAdd(setRecommendations, recommendations)} style={styles.addBtn}>
              <Icon name="plus" size={sizes.scale(20)} color={colors.p500} wrapped wrapperColor={colors.p500} wrapperOpacity={0.15} wrapperSize={20} wrapperRadius={sizes.borderRadius.full} />
              <Text style={styles.addBtnText}>{t('consultation.add_recommendation', 'Add recommendation')}</Text>
            </TouchableOpacity>
          </View>

          {/* Next steps */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Icon name="next-steps" size={sizes.scale(24)} color={colors.p500} />
              <Text style={styles.sectionTitle}>{t('consultation.next_steps', 'Next steps')}</Text>
              <View style={styles.requiredBadge}>
                <Text style={styles.requiredText}>{t('consultation.required', 'Required')}</Text>
              </View>
            </View>
            {nextSteps.map((item, index) => (
              <View key={index} style={styles.dynamicRow}>
                <View style={styles.bulletDot} />
                <Input
                  containerStyle={[styles.dynamicInputPillContainer, { flex: 1 }]}
                  inputContainerStyle={styles.dynamicInputPillInner}
                  style={styles.dynamicInput}
                  value={item}
                  onChangeText={(v) => handleDynamicListChange(setNextSteps, nextSteps, index, v)}
                  placeholder={t('consultation.eg_repeat_tests', 'e.g. Repeat tests in 4-6 weeks')}
                />
                <TouchableOpacity
                  onPress={() => handleDynamicListRemove(setNextSteps, nextSteps, index)}
                  style={styles.removeBtn}
                >
                  <Icon
                    name="close"
                    size={sizes.scale(20)}
                    color={colors.danger}
                    wrapped
                    wrapperColor={colors.danger}
                    wrapperOpacity={0.15}
                    wrapperSize={20}
                    wrapperRadius={sizes.borderRadius.full}
                  />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity onPress={() => handleDynamicListAdd(setNextSteps, nextSteps)} style={styles.addBtn}>
              <Icon name="plus" size={sizes.scale(20)} color={colors.p500} wrapped wrapperColor={colors.p500} wrapperOpacity={0.15} wrapperSize={20} wrapperRadius={sizes.borderRadius.full} />
              <Text style={styles.addBtnText}>{t('consultation.add_step', 'Add step')}</Text>
            </TouchableOpacity>
          </View>

          {/* Prescription */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Icon name="pil" size={sizes.scale(24)} color={colors.p500} />
              <Text style={styles.sectionTitle}>{t('consultation.prescription', 'Prescription')}</Text>
              <View style={styles.optionalBadge}>
                <Text style={styles.optionalText}>{t('consultation.optional', 'Optional')}</Text>
              </View>
            </View>
            <TextInput
              style={styles.textAreaSmall}
              placeholder={t('consultation.eg_vitamin', 'e.g. Vitamin D 5000 IU')}
              placeholderTextColor={colors.n400}
              multiline
              textAlignVertical="top"
              maxLength={200}
              value={prescriptions}
              onChangeText={setPrescriptions}
            />
            <Text style={styles.charCount}>{prescriptions.length}/200</Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        {!isSent && (
          <Button
            title={t('doctor_consultation.save_draft') || 'Save draft'}
            onPress={() => handleSave(true)}
            variant="secondary"
            size="medium"
            style={styles.saveDraftBtn}
            loading={isSaving}
          />
        )}
        <Button
          title={isSent ? t('doctor_consultation.save_send', 'Save & notify to patient') : (t('doctor_consultation.save_send') || 'Save & send to patient')}
          onPress={() => handleSave(false)}
          variant="primary"
          size="medium"
          style={styles.saveSendBtnSolid}
          iconRight={isSent ? <Icon name="send" size={sizes.scale(20)} color={colors.white} /> : undefined}
          loading={isSaving}
        />
        {isSent && (
          <Button
            title={t('common.cancel') || 'Cancel'}
            onPress={backFromForm}
            variant="outlined"
            size="medium"
            style={styles.cancelFooterBtn}
          />
        )}
      </View>
    </SubViewScreen>
  );
}

const themeStyles = (theme) => ({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  scroll: {
    paddingBottom: theme.sizes.scale(),
    paddingTop: theme.sizes.spacing.s,
    gap: theme.sizes.spacing.m,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.sizes.scale(),
  },
  cancelButtonText: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.p500,
    fontFamily: 'Manrope_600SemiBold',
  },
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.p500,
    // shadow
    shadowColor: theme.colors.p500,
    shadowOffset: { width: theme.sizes.scale(), height: theme.sizes.scale() },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  patientAvatar: {
    width: theme.sizes.scale(),
    height: theme.sizes.scale(),
    borderRadius: theme.sizes.scale(),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.sizes.spacing.m,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    ...theme.sizes.typography.h4,
    color: theme.colors.n900,
    fontFamily: 'Manrope_700Bold',
    marginBottom: theme.sizes.scale(),
  },
  patientMeta: {
    ...theme.sizes.typography.caption,
    color: theme.colors.p500,
    lineHeight: theme.sizes.scale(),
  },
  typeBadge: {
    width: theme.sizes.scale(),
    height: theme.sizes.scale(),
    borderRadius: theme.sizes.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.sYell + '33',
    padding: theme.sizes.spacing.m,
    borderRadius: theme.sizes.borderRadius.large,
    // shadow
    shadowColor: /* TODO: color */ '#000',
    shadowOffset: { width: theme.sizes.scale(), height: theme.sizes.scale() },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  warningText: {
    ...theme.sizes.typography.caption,
    color: theme.colors.n800,
    lineHeight: theme.sizes.scale(),
    flex: 1,
  },
  // Section card container with shadow
  sectionCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.m,
    shadowColor: /* TODO: color */ '#000',
    shadowOffset: { width: theme.sizes.scale(), height: theme.sizes.scale() },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.sizes.spacing.m,
  },
  sectionTitle: {
    ...theme.sizes.typography.h4,
    color: theme.colors.n700,
    fontFamily: 'Manrope_700Bold',
    marginLeft: theme.sizes.spacing.s,
    flex: 1,
  },
  requiredBadge: {
    backgroundColor: theme.colors.danger + '22',
    paddingHorizontal: theme.sizes.scale(),
    paddingVertical: theme.sizes.scale(),
    borderRadius: theme.sizes.borderRadius.large,
    marginLeft: 'auto',
  },
  requiredText: {
    ...theme.sizes.typography.bodyLarge,
    color: theme.colors.danger,
    fontFamily: 'Manrope_600SemiBold',
  },
  optionalBadge: {
    backgroundColor: theme.colors.sCyan + '22',
    paddingHorizontal: theme.sizes.scale(),
    paddingVertical: theme.sizes.scale(),
    borderRadius: theme.sizes.borderRadius.large,
    marginLeft: 'auto',
  },
  optionalText: {
    ...theme.sizes.typography.bodyLarge,
    color: theme.colors.sCyan,
    fontFamily: 'Manrope_600SemiBold',
  },
  textArea: {
    backgroundColor: theme.colors.n100,
    borderWidth: 1,
    borderColor: theme.colors.n300,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.m,
    height: theme.sizes.scale(),
    color: theme.colors.n900,
    ...theme.sizes.typography.bodyMedium,
  },
  textAreaSmall: {
    backgroundColor: theme.colors.n100,
    borderWidth: 1,
    borderColor: theme.colors.n300,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.m,
    height: theme.sizes.scale(),
    color: theme.colors.n900,
    ...theme.sizes.typography.bodyMedium,
  },
  charCount: {
    alignSelf: 'flex-end',
    marginTop: theme.sizes.scale(),
    ...theme.sizes.typography.caption,
    color: theme.colors.n500,
  },
  diagnosisRow: {
    flexDirection: 'row',
    gap: theme.sizes.spacing.s,
  },
  diagInputCol: {
    flex: 1,
  },
  diagInputColRight: {
    flex: 2,
  },
  dynamicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.sizes.spacing.s,
    marginBottom: theme.sizes.spacing.s,
  },
  dynamicInputPillContainer: {
    marginBottom: theme.sizes.scale(),
  },
  dynamicInputPillInner: {
    borderRadius: theme.sizes.borderRadius.large,
  },
  dynamicInput: {
    flex: 1,
    borderRadius: theme.sizes.borderRadius.large,
  },
  bulletDot: {
    width: theme.sizes.scale(),
    height: theme.sizes.scale(),
    borderRadius: theme.sizes.borderRadius.full,
    backgroundColor: theme.colors.p500,
  },
  removeBtn: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.sizes.spacing.xs,
    gap: theme.sizes.spacing.xs,
  },
  addBtnText: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.p500,
    fontFamily: 'Manrope_600SemiBold',
  },
  footer: {
    position: 'absolute',
    bottom: theme.sizes.scale(),
    left: theme.sizes.scale(),
    right: theme.sizes.scale(),
    paddingHorizontal: theme.sizes.spacing.l,
    paddingVertical: theme.sizes.spacing.l,
    backgroundColor: theme.colors.bg,
    gap: theme.sizes.spacing.s,
  },
  saveDraftBtn: {
    height: theme.sizes.scale(),
  },
  saveSendBtnSolid: {
    height: theme.sizes.scale(),
  },
  cancelFooterBtn: {
    height: theme.sizes.scale(),
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.p500,
  }
});
