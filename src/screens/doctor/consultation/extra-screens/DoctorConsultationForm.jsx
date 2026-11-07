import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../theme/ThemeContext';
import { useStyles } from '../../../../theme/useStyles';
import { useResponsive } from '../../../../theme/useResponsive';
import { Icon } from '../../../../components/ui/Icon';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { SubViewScreen } from '../../../../components/common/SubViewScreen';
import { useDoctorDashboard } from '../../../../context/DoctorDashboardContext';
import { useSession } from '../../../../context/SessionContext';
import { createApiClient } from '../../../../api/apiClient';
import { createConsultationsApi } from '../../../../api/consultationsApi';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function DoctorConsultationForm({ consultation }) {
  const { sizes, colors } = useTheme();
  const responsive = useResponsive();
  const styles = useStyles(themeStyles);
  const { t, i18n } = useTranslation();
  const {
    goToSummary,
    closeSummary,
    backFromForm,
  } = useDoctorDashboard();
  const { session, refreshSessionToken } = useSession();

  const isDesktopLayout =
    !responsive?.isPortraitShell && (
      responsive.isDesktop ||
      responsive.isDesktopWide ||
      responsive.isUltrawide ||
      responsive.isTabletLandscape
    );

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState(null);
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

        const promises = [
          consultApi.getResults(consultation.id).catch(() => null),
        ];

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
            const parsed =
              typeof resData.patient_has === 'string'
                ? JSON.parse(resData.patient_has)
                : resData.patient_has;
            if (parsed.length > 0) setPatientHas(parsed);
          }
          if (resData.next_steps) {
            const parsed =
              typeof resData.next_steps === 'string'
                ? JSON.parse(resData.next_steps)
                : resData.next_steps;
            if (parsed.length > 0) setNextSteps(parsed);
          }
          if (resData.recommendations) {
            const parsed =
              typeof resData.recommendations === 'string'
                ? JSON.parse(resData.recommendations)
                : resData.recommendations;
            if (parsed.length > 0) setRecommendations(parsed);
          }
        } else {
          // Check local draft
          const localDraftStr = await AsyncStorage.getItem(
            `draft_consultation_${consultation.id}`
          );
          if (localDraftStr) {
            try {
              const draft = JSON.parse(localDraftStr);
              if (draft.overview) setOverview(draft.overview);
              if (draft.diagnosis_icd10) setDiagnosisIcd10(draft.diagnosis_icd10);
              if (draft.diagnosis_name) setDiagnosisName(draft.diagnosis_name);
              if (draft.prescriptions) setPrescriptions(draft.prescriptions);
              if (draft.patient_has?.length > 0) setPatientHas(draft.patient_has);
              if (draft.next_steps?.length > 0) setNextSteps(draft.next_steps);
              if (draft.recommendations?.length > 0)
                setRecommendations(draft.recommendations);
              setLastSavedTime('ранее');
            } catch (e) {
              console.error('Failed to parse local draft', e);
            }
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
  }, [consultation?.id, session, refreshSessionToken]);

  const draftRef = useRef();
  draftRef.current = {
    overview,
    diagnosis_icd10: diagnosisIcd10,
    diagnosis_name: diagnosisName,
    patient_has: patientHas,
    next_steps: nextSteps,
    recommendations: recommendations,
    prescriptions,
  };

  // Immediate draft flush on component unmount
  useEffect(() => {
    return () => {
      if (consultation?.id && !isSent && draftRef.current) {
        AsyncStorage.setItem(
          `draft_consultation_${consultation.id}`,
          JSON.stringify(draftRef.current)
        ).catch(() => {});
      }
    };
  }, [consultation?.id, isSent]);

  // Debounced auto-save to local storage
  useEffect(() => {
    if (isLoading || isSent || !consultation?.id) return;
    const saveDraftLocally = async () => {
      try {
        if (draftRef.current) {
          await AsyncStorage.setItem(
            `draft_consultation_${consultation.id}`,
            JSON.stringify(draftRef.current)
          );
          const now = new Date();
          const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
          setLastSavedTime(timeStr);
        }
      } catch (e) {
        // Ignore local storage errors
      }
    };

    const timeoutId = setTimeout(saveDraftLocally, 1200);
    return () => clearTimeout(timeoutId);
  }, [
    overview,
    diagnosisIcd10,
    diagnosisName,
    patientHas,
    nextSteps,
    recommendations,
    prescriptions,
    isLoading,
    isSent,
    consultation?.id,
  ]);

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
    if (newList.length === 0) newList.push('');
    setter(newList);
  };

  // Quick suggestion helper
  const handleAddSuggestion = (setter, list, text) => {
    if (list.length === 1 && list[0].trim() === '') {
      setter([text]);
    } else if (!list.includes(text)) {
      setter([...list, text]);
    }
  };

  const handleSave = async (isDraft) => {
    setIsSaving(true);
    try {
      const api = createApiClient(session, refreshSessionToken);
      const consultApi = createConsultationsApi(api);

      const cleanPatientHas = patientHas.filter((i) => i.trim() !== '');
      const cleanNextSteps = nextSteps.filter((i) => i.trim() !== '');
      const cleanRecommendations = recommendations.filter((i) => i.trim() !== '');

      const payload = {
        overview,
        diagnosis_icd10: diagnosisIcd10,
        diagnosis_name: diagnosisName,
        patient_has: cleanPatientHas,
        next_steps: cleanNextSteps,
        recommendations: cleanRecommendations,
        prescriptions,
        is_draft: isDraft,
      };

      if (resultId) {
        await consultApi.updateResult(consultation.id, payload);
      } else {
        await consultApi.createResult(consultation.id, payload);
      }

      const { DeviceEventEmitter } = require('react-native');
      DeviceEventEmitter.emit('consultation_completed');

      if (!isDraft) {
        await AsyncStorage.removeItem(
          `draft_consultation_${consultation.id}`
        ).catch(() => {});
      }

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
      <View
        style={[
          styles.screen,
          { justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <ActivityIndicator size="large" color={colors.p500} />
      </View>
    );
  }

  const patientName = fullConsultation?.patient?.firstName
    ? `${fullConsultation.patient.firstName} ${fullConsultation.patient.lastName || ''}`
    : t('doctor_consultation.patient_fallback', 'Пациент');

  const settings =
    fullConsultation?.patient?.user_profile_settings?.data_visibility ?? {};
  const showDob = !settings.date_of_birth;

  const age =
    showDob && fullConsultation?.patient?.date_of_birth
      ? Math.floor(
          (Date.now() -
            new Date(fullConsultation.patient.date_of_birth).getTime()) /
            3.156e10
        )
      : null;

  const genderMap = {
    male: t('common.male', 'Мужской'),
    female: t('common.female', 'Женский'),
  };
  const gender = fullConsultation?.patient?.gender
    ? genderMap[fullConsultation.patient.gender] || fullConsultation.patient.gender
    : null;
  const bloodType =
    fullConsultation?.patient?.patient_profiles?.[0]?.blood_type ||
    fullConsultation?.patient?.patient_profiles?.blood_type ||
    null;

  const formattedDate = fullConsultation?.date
    ? new Date(fullConsultation.date).toLocaleDateString(
        i18n.language === 'ru' ? 'ru-RU' : 'en-US',
        { month: 'short', day: 'numeric', year: 'numeric' }
      )
    : '';

  const metaString = [
    age ? t('common.years_old', { count: age, defaultValue: `${age} лет` }) : '',
    gender,
    bloodType,
  ]
    .filter(Boolean)
    .join(' • ');

  const headerRight = (
    <View style={styles.headerRightContainer}>
      {lastSavedTime && !isSent && (
        <View style={styles.autoSaveBadge}>
          <Icon name="Check" size={sizes.scale(13)} color={colors.p600} />
          <Text style={styles.autoSaveText}>
            {lastSavedTime === 'ранее'
              ? 'Черновик'
              : `Сохранено в ${lastSavedTime}`}
          </Text>
        </View>
      )}
      <TouchableOpacity style={styles.cancelButton} onPress={backFromForm}>
        <Icon name="X" size={sizes.scale(20)} color={colors.n600} />
      </TouchableOpacity>
    </View>
  );

  // Left Patient Context Panel (shown in 2-column mode or top of mobile)
  const patientCardNode = (
    <View style={styles.patientContextBlock}>
      <View style={styles.patientCard}>
        <View style={styles.patientAvatar}>
          <Icon name="User" size={sizes.scale(22)} color={colors.white} />
        </View>
        <View style={styles.patientInfo}>
          <Text style={styles.patientName}>{patientName}</Text>
          <Text style={styles.patientMeta}>
            {metaString || 'Медицинские данные не указаны'}
          </Text>
          {formattedDate ? (
            <Text style={styles.patientDate}>{formattedDate}</Text>
          ) : null}
        </View>
        <View style={styles.typeBadge}>
          <Icon name="Stethoscope" size={sizes.scale(15)} color={colors.white} />
        </View>
      </View>

      {/* Purpose & Clinical Context */}
      <View style={styles.purposeCard}>
        <Text style={styles.purposeLabel}>Причина обращения / Жалобы:</Text>
        <Text style={styles.purposeValue}>
          {fullConsultation?.purpose ||
            'Плановая медицинская онлайн-консультация'}
        </Text>
      </View>

      {/* Info Warning banner */}
      {isSent ? (
        <View style={styles.warningBoxSent}>
          <Icon name="AlertCircle" size={sizes.scale(20)} color="#D97706" />
          <Text style={styles.warningTextSent}>
            {t(
              'consultation.editing_sent_summary',
              'Редактирование отправленного заключения — пациент получит уведомление об обновлении.'
            )}
          </Text>
        </View>
      ) : (
        <View style={styles.warningBox}>
          <Icon name="FileText" size={sizes.scale(18)} color={colors.p500} />
          <Text style={styles.warningText}>
            {t(
              'consultation.private_notes_prefilled',
              'Заполните диагноз и рекомендации. Черновик сохраняется автоматически.'
            )}
          </Text>
        </View>
      )}
    </View>
  );

  // Form Sections Content
  const formSectionsNode = (
    <View style={styles.formSectionsContainer}>
      {/* 1. Overview */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <Icon name="FileText" size={sizes.scale(20)} color={colors.p500} />
          <Text style={styles.sectionTitle}>
            {t('consultation.overview', 'Обзор')}
          </Text>
          <View style={styles.requiredBadge}>
            <Text style={styles.requiredText}>
              {t('consultation.required', 'Обязательно')}
            </Text>
          </View>
        </View>
        <TextInput
          style={styles.textArea}
          placeholder={t(
            'consultation.eg_discussed',
            'напр. Во время консультации обсудили результаты анализов и жалобы...'
          )}
          placeholderTextColor={colors.n400}
          multiline
          textAlignVertical="top"
          maxLength={400}
          value={overview}
          onChangeText={setOverview}
        />
        <Text style={styles.charCount}>{overview.length}/400</Text>
      </View>

      {/* 2. Patient has (Findings) */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <Icon name="Search" size={sizes.scale(20)} color={colors.p500} />
          <Text style={styles.sectionTitle}>
            {t('consultation.patient_has', 'Симптомы и находки')}
          </Text>
          <View style={styles.requiredBadge}>
            <Text style={styles.requiredText}>
              {t('consultation.required', 'Обязательно')}
            </Text>
          </View>
        </View>

        {/* Quick Suggestion Chips */}
        <View style={styles.suggestionsRow}>
          {[
            'Общая слабость и утомляемость',
            'Головная боль',
            'Нарушения сна',
            'Дефицит железа',
          ].map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.suggestionChip}
              onPress={() => handleAddSuggestion(setPatientHas, patientHas, item)}
            >
              <Text style={styles.suggestionChipText}>+ {item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {patientHas.map((item, index) => (
          <View key={index} style={styles.dynamicRow}>
            <View style={styles.bulletDot} />
            <Input
              containerStyle={[styles.dynamicInputPillContainer, { flex: 1 }]}
              inputContainerStyle={styles.dynamicInputPillInner}
              style={styles.dynamicInput}
              value={item}
              onChangeText={(v) =>
                handleDynamicListChange(setPatientHas, patientHas, index, v)
              }
              placeholder={t(
                'consultation.eg_ferritin',
                'напр. Низкий ферритин'
              )}
            />
            <TouchableOpacity
              onPress={() =>
                handleDynamicListRemove(setPatientHas, patientHas, index)
              }
              style={styles.removeBtn}
            >
              <Icon name="Trash2" size={sizes.scale(16)} color={colors.danger} />
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity
          onPress={() => handleDynamicListAdd(setPatientHas, patientHas)}
          style={styles.addBtn}
        >
          <Icon name="Plus" size={sizes.scale(16)} color={colors.p500} />
          <Text style={styles.addBtnText}>
            {t('consultation.add_finding', 'Добавить симптом/находку')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 3. Diagnosis */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <Icon name="Stethoscope" size={sizes.scale(20)} color={colors.p500} />
          <Text style={styles.sectionTitle}>
            {t('consultation.diagnosis', 'Диагноз')}
          </Text>
          <View style={styles.requiredBadge}>
            <Text style={styles.requiredText}>
              {t('consultation.required', 'Обязательно')}
            </Text>
          </View>
        </View>
        <View style={styles.diagnosisRow}>
          <View style={styles.diagInputCol}>
            <Input
              label={t('consultation.icd10', 'Код МКБ-10')}
              placeholder={t('consultation.eg_d50', 'напр. D50')}
              value={diagnosisIcd10}
              onChangeText={setDiagnosisIcd10}
            />
          </View>
          <View style={styles.diagInputColRight}>
            <Input
              label={t('consultation.diagnosis_name', 'Название диагноза')}
              placeholder={t(
                'consultation.eg_anemia',
                'напр. Железодефицитная анемия'
              )}
              value={diagnosisName}
              onChangeText={setDiagnosisName}
            />
          </View>
        </View>
      </View>

      {/* 4. Recommendations */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <Icon name="ClipboardList" size={sizes.scale(20)} color={colors.p500} />
          <Text style={styles.sectionTitle}>
            {t('consultation.recommendations', 'Рекомендации')}
          </Text>
          <View style={styles.requiredBadge}>
            <Text style={styles.requiredText}>
              {t('consultation.required', 'Обязательно')}
            </Text>
          </View>
        </View>

        {/* Quick Suggestion Chips */}
        <View style={styles.suggestionsRow}>
          {[
            'ОАК + сывороточное железо',
            'Обильный питьевой режим (1.5-2л)',
            'Полноценный сон не менее 8ч',
            'Прием препаратов железа',
          ].map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.suggestionChip}
              onPress={() =>
                handleAddSuggestion(setRecommendations, recommendations, item)
              }
            >
              <Text style={styles.suggestionChipText}>+ {item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {recommendations.map((item, index) => (
          <View key={index} style={styles.dynamicRow}>
            <View style={styles.bulletDot} />
            <Input
              containerStyle={[styles.dynamicInputPillContainer, { flex: 1 }]}
              inputContainerStyle={styles.dynamicInputPillInner}
              style={styles.dynamicInput}
              value={item}
              onChangeText={(v) =>
                handleDynamicListChange(setRecommendations, recommendations, index, v)
              }
              placeholder={t(
                'consultation.eg_supplements',
                'напр. Рассмотрите прием препаратов железа'
              )}
            />
            <TouchableOpacity
              onPress={() =>
                handleDynamicListRemove(setRecommendations, recommendations, index)
              }
              style={styles.removeBtn}
            >
              <Icon name="Trash2" size={sizes.scale(16)} color={colors.danger} />
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity
          onPress={() => handleDynamicListAdd(setRecommendations, recommendations)}
          style={styles.addBtn}
        >
          <Icon name="Plus" size={sizes.scale(16)} color={colors.p500} />
          <Text style={styles.addBtnText}>
            {t('consultation.add_recommendation', 'Добавить рекомендацию')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 5. Next steps */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <Icon name="ArrowRightCircle" size={sizes.scale(20)} color={colors.p500} />
          <Text style={styles.sectionTitle}>
            {t('consultation.next_steps', 'Следующие шаги')}
          </Text>
          <View style={styles.requiredBadge}>
            <Text style={styles.requiredText}>
              {t('consultation.required', 'Обязательно')}
            </Text>
          </View>
        </View>

        {/* Quick Suggestion Chips */}
        <View style={styles.suggestionsRow}>
          {[
            'Повторная консультация через 14 дней',
            'Контрольный анализ крови через 4 недели',
            'Дневник самочувствия и давления',
          ].map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.suggestionChip}
              onPress={() => handleAddSuggestion(setNextSteps, nextSteps, item)}
            >
              <Text style={styles.suggestionChipText}>+ {item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {nextSteps.map((item, index) => (
          <View key={index} style={styles.dynamicRow}>
            <View style={styles.bulletDot} />
            <Input
              containerStyle={[styles.dynamicInputPillContainer, { flex: 1 }]}
              inputContainerStyle={styles.dynamicInputPillInner}
              style={styles.dynamicInput}
              value={item}
              onChangeText={(v) =>
                handleDynamicListChange(setNextSteps, nextSteps, index, v)
              }
              placeholder={t(
                'consultation.eg_repeat_tests',
                'напр. Повторите анализы через 4-6 недель'
              )}
            />
            <TouchableOpacity
              onPress={() =>
                handleDynamicListRemove(setNextSteps, nextSteps, index)
              }
              style={styles.removeBtn}
            >
              <Icon name="Trash2" size={sizes.scale(16)} color={colors.danger} />
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity
          onPress={() => handleDynamicListAdd(setNextSteps, nextSteps)}
          style={styles.addBtn}
        >
          <Icon name="Plus" size={sizes.scale(16)} color={colors.p500} />
          <Text style={styles.addBtnText}>
            {t('consultation.add_step', 'Добавить шаг')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 6. Prescription */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <Icon name="Pill" size={sizes.scale(20)} color={colors.p500} />
          <Text style={styles.sectionTitle}>
            {t('consultation.prescription', 'Рецепты и назначения')}
          </Text>
          <View style={styles.optionalBadge}>
            <Text style={styles.optionalText}>
              {t('consultation.optional', 'Опционально')}
            </Text>
          </View>
        </View>
        <TextInput
          style={styles.textAreaSmall}
          placeholder={t(
            'consultation.eg_vitamin',
            'напр. Витамин D3 5000 МЕ по 1 капс. утром во время еды 30 дней'
          )}
          placeholderTextColor={colors.n400}
          multiline
          textAlignVertical="top"
          maxLength={250}
          value={prescriptions}
          onChangeText={setPrescriptions}
        />
        <Text style={styles.charCount}>{prescriptions.length}/250</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsBar}>
        {!isSent && (
          <Button
            title={t('doctor_consultation.save_draft', 'Сохранить черновик')}
            onPress={() => handleSave(true)}
            variant="secondary"
            size="large"
            style={styles.actionBtn}
            loading={isSaving}
          />
        )}
        <Button
          title={
            isSent
              ? t(
                  'doctor_consultation.save_send',
                  'Сохранить и уведомить пациента'
                )
              : t(
                  'doctor_consultation.save_send',
                  'Сохранить и отправить пациенту'
                )
          }
          onPress={() => handleSave(false)}
          variant="primary"
          size="large"
          style={styles.actionBtn}
          loading={isSaving}
        />
      </View>
    </View>
  );

  return (
    <SubViewScreen
      title={
        t('doctor_consultation.summary_title', 'Заключение консультации') ||
        'Заключение консультации'
      }
      onBack={backFromForm}
      headerRight={headerRight}
      confirmBeforeExit={true}
      confirmTitle={t('doctor_consultation.exit_title', 'Выйти без сохранения?')}
      confirmMessage={t(
        'doctor_consultation.exit_desc',
        'Вы не сохранили результаты. Если вы выйдете, неотправленные данные останутся только в черновике.'
      )}
      confirmLabel={t('doctor_consultation.exit_confirm', 'Выйти')}
      cancelLabel={t('common.cancel', 'Отмена')}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {isDesktopLayout ? (
            <View style={styles.desktopLayoutRow}>
              {/* Left Column: Patient Context */}
              <View style={styles.desktopLeftCol}>{patientCardNode}</View>
              {/* Right Column: Form Inputs */}
              <View style={styles.desktopRightCol}>{formSectionsNode}</View>
            </View>
          ) : (
            <View style={styles.mobileLayoutCol}>
              {patientCardNode}
              {formSectionsNode}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SubViewScreen>
  );
}

const themeStyles = (theme) => ({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  scroll: {
    paddingBottom: theme.sizes.scale(40),
    paddingTop: theme.sizes.spacing.s,
    paddingHorizontal: theme.sizes.spacing.m,
  },

  // Header Right
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  autoSaveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.opacityP100,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  autoSaveText: {
    fontSize: theme.sizes.scale(11),
    color: theme.colors.p600,
    fontWeight: '600',
  },
  cancelButton: {
    padding: theme.sizes.spacing.xs,
  },

  // Desktop 2-column layout
  desktopLayoutRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.sizes.spacing.l,
    maxWidth: 1140,
    alignSelf: 'center',
    width: '100%',
  },
  desktopLeftCol: {
    width: '35%',
    minWidth: 320,
    maxWidth: 380,
  },
  desktopRightCol: {
    flex: 1,
  },
  mobileLayoutCol: {
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
  },

  // Patient Context Block
  patientContextBlock: {
    gap: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.m,
  },
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.m,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.n200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  patientAvatar: {
    width: theme.sizes.scale(44),
    height: theme.sizes.scale(44),
    borderRadius: theme.sizes.scale(22),
    backgroundColor: theme.colors.p500,
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
    fontWeight: '700',
    marginBottom: 2,
  },
  patientMeta: {
    ...theme.sizes.typography.caption,
    color: theme.colors.n600,
  },
  patientDate: {
    fontSize: theme.sizes.scale(11),
    color: theme.colors.p600,
    fontWeight: '600',
    marginTop: 2,
  },
  typeBadge: {
    width: theme.sizes.scale(32),
    height: theme.sizes.scale(32),
    borderRadius: theme.sizes.borderRadius.full,
    backgroundColor: theme.colors.p500,
    justifyContent: 'center',
    alignItems: 'center',
  },

  purposeCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.medium,
    padding: theme.sizes.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.n200,
  },
  purposeLabel: {
    fontSize: theme.sizes.scale(12),
    fontWeight: '600',
    color: theme.colors.n500,
    marginBottom: 4,
  },
  purposeValue: {
    fontSize: theme.sizes.scale(13),
    fontWeight: '600',
    color: theme.colors.n800,
  },

  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.opacityP100,
    padding: theme.sizes.spacing.m,
    borderRadius: theme.sizes.borderRadius.medium,
    borderWidth: 1,
    borderColor: 'rgba(35, 211, 194, 0.3)',
  },
  warningText: {
    fontSize: theme.sizes.scale(12),
    color: theme.colors.p600,
    flex: 1,
    lineHeight: 18,
  },
  warningBoxSent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    padding: theme.sizes.spacing.m,
    borderRadius: theme.sizes.borderRadius.medium,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  warningTextSent: {
    fontSize: theme.sizes.scale(12),
    color: '#92400E',
    flex: 1,
    lineHeight: 18,
  },

  // Form Sections
  formSectionsContainer: {
    gap: theme.sizes.spacing.m,
  },
  sectionCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.n200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.sizes.spacing.m,
  },
  sectionTitle: {
    ...theme.sizes.typography.h4,
    color: theme.colors.n900,
    fontWeight: '700',
    marginLeft: theme.sizes.spacing.s,
    flex: 1,
  },
  requiredBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  requiredText: {
    fontSize: theme.sizes.scale(11),
    color: theme.colors.danger,
    fontWeight: '700',
  },
  optionalBadge: {
    backgroundColor: theme.colors.n100,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  optionalText: {
    fontSize: theme.sizes.scale(11),
    color: theme.colors.n500,
    fontWeight: '600',
  },

  // Suggestions Row
  suggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: theme.sizes.spacing.m,
  },
  suggestionChip: {
    backgroundColor: theme.colors.n100,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.n200,
  },
  suggestionChipText: {
    fontSize: theme.sizes.scale(11),
    color: theme.colors.n700,
    fontWeight: '500',
  },

  textArea: {
    backgroundColor: theme.colors.bg,
    borderWidth: 1,
    borderColor: theme.colors.n200,
    borderRadius: theme.sizes.borderRadius.medium,
    padding: theme.sizes.spacing.m,
    height: theme.sizes.scale(100),
    color: theme.colors.n900,
    ...theme.sizes.typography.bodyMedium,
  },
  textAreaSmall: {
    backgroundColor: theme.colors.bg,
    borderWidth: 1,
    borderColor: theme.colors.n200,
    borderRadius: theme.sizes.borderRadius.medium,
    padding: theme.sizes.spacing.m,
    height: theme.sizes.scale(80),
    color: theme.colors.n900,
    ...theme.sizes.typography.bodyMedium,
  },
  charCount: {
    alignSelf: 'flex-end',
    marginTop: 4,
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
    marginBottom: 0,
  },
  dynamicInputPillInner: {
    borderRadius: theme.sizes.borderRadius.medium,
  },
  dynamicInput: {
    flex: 1,
    borderRadius: theme.sizes.borderRadius.medium,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.p500,
  },
  removeBtn: {
    padding: 6,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.sizes.spacing.xs,
    gap: 4,
    alignSelf: 'flex-start',
  },
  addBtnText: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.p500,
    fontWeight: '700',
  },

  // Actions Bar
  actionsBar: {
    flexDirection: 'row',
    gap: theme.sizes.spacing.m,
    marginTop: theme.sizes.spacing.s,
    paddingTop: theme.sizes.spacing.m,
  },
  actionBtn: {
    flex: 1,
  },
});
