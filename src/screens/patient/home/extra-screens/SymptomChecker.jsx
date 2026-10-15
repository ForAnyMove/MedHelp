import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Modal } from 'react-native';
import { useTranslation } from 'react-i18next';
import { usePatientDashboard } from '../../../../context/PatientDashboardContext';
import { useComponentContext } from '../../../../context/GlobalContext';
import { SymptomCheckerEngine } from './SymptomCheckerEngine';
import { Button } from '../../../../components/ui/Button';
import { Icon } from '../../../../components/ui/Icon';
import { useTheme } from '../../../../theme/ThemeContext';
import { Step6Result } from './symptom-checker/Step6Result';
import quizEn from '../../../../locales/quiz_en.json';
import { mapQuizSpecialtyToProfession } from '../../../../utils/specialtyMapper';

export function SymptomChecker() {
  const { t } = useTranslation();
  const { navigateToDashboard, symptomCheckerProps, setSymptomCheckerProps } = usePatientDashboard();
  const { checkupsApi } = useComponentContext();
  const theme = useTheme();
  const styles = themeStyles(theme);

  const engineRef = useRef(new SymptomCheckerEngine());
  const engine = engineRef.current;

  const initialResult = symptomCheckerProps?.resultData || null;
  const [isIntro, setIsIntro] = useState(!initialResult);
  const [currentQ, setCurrentQ] = useState(engine.getNextQuestion());
  const [selections, setSelections] = useState([]);
  const [resultData, setResultData] = useState(initialResult);
  const [isExitModalVisible, setExitModalVisible] = useState(false);

  useEffect(() => {
    if (symptomCheckerProps?.resultData) {
      setResultData(symptomCheckerProps.resultData);
      setIsIntro(false);
    }
  }, [symptomCheckerProps]);

  // If no questions remain, finalize results
  useEffect(() => {
    if (!isIntro && !currentQ && !resultData) {
      finalize();
    }
  }, [currentQ, isIntro, resultData]);

  const handleSelect = (key, isMultiple) => {
    if (isMultiple) {
      if (key === 'NONE' || key === 'UNKNOWN') {
        // NONE and UNKNOWN are mutually exclusive with all other options (Section 2, п. 1 & Section 3 MULTI_HELP)
        setSelections([key]);
      } else {
        setSelections(prev => {
          const filtered = prev.filter(k => k !== 'NONE' && k !== 'UNKNOWN');
          return filtered.includes(key) ? filtered.filter(k => k !== key) : [...filtered, key];
        });
      }
    } else {
      setSelections([key]);
    }
  };

  const handleNext = () => {
    if (selections.length === 0) return;

    const isMultiple = t(`quiz.questions.${currentQ}.type`) === 'multiple';
    const answer = isMultiple ? selections : selections[0];

    engine.setAnswer(currentQ, answer);

    // Check if known U1 shortcut is active (Section 2, п. 5)
    const res = engine.checkEmergency();
    if (res && res.type === 'U1') {
      finalize(res);
      return;
    }

    const nextQ = engine.getNextQuestion();
    setCurrentQ(nextQ);

    // Pre-fill answer if next question was already answered before
    if (nextQ && engine.answers[nextQ] !== undefined) {
      const existing = engine.answers[nextQ];
      setSelections(Array.isArray(existing) ? existing : [existing]);
    } else {
      setSelections([]);
    }
  };

  const handleBack = () => {
    if (isIntro) {
      navigateToDashboard();
      return;
    }

    if (engine.history.length === 0) {
      // Show exit confirmation modal (Section 3: EXIT_TITLE / EXIT_BODY)
      setExitModalVisible(true);
      return;
    }

    const prevQ = engine.undo();
    if (!prevQ) {
      setIsIntro(true);
      return;
    }

    setCurrentQ(prevQ);
    const oldAns = engine.answers[prevQ];
    if (oldAns !== undefined) {
      setSelections(Array.isArray(oldAns) ? oldAns : [oldAns]);
    } else {
      setSelections([]);
    }
  };

  const finalize = async (forcedResult = null) => {
    const finalResult = forcedResult || engine.evaluateResults();

    // Resolve recommended primary specialty
    const enResult = finalResult.result ? quizEn.quiz.results[finalResult.result] : null;
    const primarySpec = enResult?.['Primary specialty'] || null;
    const mappedSpecCode = primarySpec ? mapQuizSpecialtyToProfession(primarySpec) : null;

    try {
      const response = await checkupsApi.save({
        payload: engine.answers,
        result: finalResult,
        recommendedSpecialty: mappedSpecCode
      });
      setResultData({ ...response, engineResult: finalResult, recommendedSpecialty: mappedSpecCode });
    } catch (e) {
      setResultData({ payload: engine.answers, engineResult: finalResult, recommendedSpecialty: mappedSpecCode });
    }
  };

  const close = () => {
    if (setSymptomCheckerProps) setSymptomCheckerProps(null);
    navigateToDashboard();
  };

  const handleRestart = () => {
    engineRef.current = new SymptomCheckerEngine();
    const newEngine = engineRef.current;
    if (setSymptomCheckerProps) setSymptomCheckerProps(null);
    setResultData(null);
    setCurrentQ(newEngine.getNextQuestion());
    setSelections([]);
    setIsIntro(true);
  };

  const handleEditAnswers = () => {
    setResultData(null);
    const lastQ = engine.history.length > 0 ? engine.history[engine.history.length - 1].questionId : engine.getNextQuestion();
    setCurrentQ(lastQ);
    const existing = engine.answers[lastQ];
    setSelections(existing ? (Array.isArray(existing) ? existing : [existing]) : []);
  };

  const handleBackFromResult = () => {
    if (resultData?.created_at) {
      close();
    } else {
      handleEditAnswers();
    }
  };

  // Render Result Screen
  if (resultData) {
    return (
      <Step6Result
        data={resultData}
        answers={engine.answers && Object.keys(engine.answers).length > 0 ? engine.answers : (resultData?.payload?.payload || resultData?.payload)}
        onBack={handleBackFromResult}
        onClose={close}
        onEditAnswers={resultData?.created_at ? null : handleEditAnswers}
        onRestart={handleRestart}
      />
    );
  }

  // Render Intro Screen (Section 3: INTRO_TITLE, INTRO_BODY, INTRO_START)
  if (isIntro) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Icon name="arrow-back" size={theme.sizes.scale(24)} color={theme.colors.p500} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('quiz.ui.INTRO_TITLE', 'Check your symptoms')}</Text>
          <View style={{ width: theme.sizes.scale(40) }} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <View style={styles.introCard}>
            <View style={styles.introIconBox}>
              <Icon name="shield" size={theme.sizes.scale(40)} color={theme.colors.p500} />
            </View>
            <Text style={styles.introTitle}>{t('quiz.ui.INTRO_TITLE', 'Check your symptoms')}</Text>
            <Text style={styles.introBody}>
              {t('quiz.ui.INTRO_BODY', 'This assessment helps adults decide what kind of care to seek. It does not confirm a diagnosis or check every possible cause. Answer about one main problem and the person being assessed.')}
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title={t('quiz.ui.INTRO_START', 'Start assessment')}
            onPress={() => setIsIntro(false)}
            variant="primary"
          />
        </View>
      </View>
    );
  }

  if (!currentQ) return null;

  const isMultiple = t(`quiz.questions.${currentQ}.type`) === 'multiple';
  const optionsObj = t(`quiz.questions.${currentQ}.options`, { returnObjects: true });
  const options = Object.entries(optionsObj || {});
  const hasUnknownOption = options.some(([k]) => k === 'UNKNOWN');
  const isProxy = engine.answers['Q_ENTRY_WHO'] === 'PROXY';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Icon name="arrow-back" size={theme.sizes.scale(24)} color={theme.colors.p500} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('quiz.ui.INTRO_TITLE', 'Check your symptoms')}</Text>
        <View style={{ width: theme.sizes.scale(40) }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.questionText}>{t(`quiz.questions.${currentQ}.text`)}</Text>

        {isMultiple && (
          <Text style={styles.hintText}>{t('quiz.ui.MULTI_HELP', 'Select all that apply. “None of these” and “I’m not sure” cannot be combined with other answers.')}</Text>
        )}

        {isProxy && currentQ === 'Q_ENTRY_AGE' && (
          <Text style={styles.noteText}>{t('quiz.ui.PROXY_NOTE', 'Answer about the person you are checking. If you cannot tell, choose “I’m not sure.” Questions use “you” to mean that person.')}</Text>
        )}

        {engine.answers[currentQ] !== undefined && (
          <Text style={styles.changeNoteText}>
            {t('quiz.ui.CHANGE_NOTE', 'Changing this answer may remove later answers that no longer apply.')}
          </Text>
        )}

        <View style={styles.optionsList}>
          {options.map(([key, label]) => {
            const isSelected = selections.includes(key);
            return (
              <TouchableOpacity
                key={key}
                style={[styles.optionButton, isSelected && styles.optionSelected]}
                onPress={() => handleSelect(key, isMultiple)}
                activeOpacity={0.7}
              >
                {!isMultiple ? (
                  <Icon
                    name={isSelected ? 'radio-selected' : 'radio-empty'}
                    size={theme.sizes.scale(22)}
                    style={styles.radioIcon}
                  />
                ) : (
                  <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                    {isSelected && <Icon name="check2" size={theme.sizes.scale(14)} color="#FFF" />}
                  </View>
                )}
                <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {hasUnknownOption && (
          <Text style={styles.unknownNoteText}>
            {t('quiz.ui.UNKNOWN_NOTE', 'Choose “I’m not sure” if you cannot tell. Please do not guess.')}
          </Text>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={t('quiz.ui.CONTINUE', 'Continue')}
          onPress={handleNext}
          disabled={selections.length === 0}
        />
      </View>

      {/* Exit Confirmation Modal (Section 3: EXIT_TITLE / EXIT_BODY) */}
      <Modal
        visible={isExitModalVisible}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('quiz.ui.EXIT_TITLE', 'Leave this assessment?')}</Text>
            <Text style={styles.modalText}>
              {t('quiz.ui.EXIT_BODY', 'An unfinished assessment does not provide a care recommendation.')}
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: theme.sizes.spacing.m }}>
              <Button
                title={t('quiz.ui.EXIT_CONTINUE', 'Continue assessment')}
                variant="outlined"
                onPress={() => setExitModalVisible(false)}
                style={{ flex: 1, marginRight: theme.sizes.spacing.s }}
              />
              <Button
                title={t('quiz.ui.EXIT_CONFIRM', 'Leave assessment')}
                variant="primary"
                onPress={() => {
                  setExitModalVisible(false);
                  navigateToDashboard();
                }}
                style={{ flex: 1, marginLeft: theme.sizes.spacing.s }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const themeStyles = (theme) => {
  const { sizes, colors } = theme;
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.white || '#fff',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: sizes.spacing.m,
      borderBottomWidth: 1,
      borderBottomColor: colors.n200 || '#eee',
    },
    backButton: {
      padding: sizes.spacing.s,
    },
    headerTitle: {
      ...sizes.typography.h3,
      color: colors.n900,
    },
    content: {
      flex: 1,
    },
    contentContainer: {
      padding: sizes.spacing.l,
    },
    introCard: {
      backgroundColor: colors.white,
      padding: sizes.spacing.xl,
      borderRadius: sizes.borderRadius.large,
      alignItems: 'center',
      marginTop: sizes.spacing.l,
      borderWidth: 1,
      borderColor: colors.n200 || '#eee',
    },
    introIconBox: {
      width: sizes.scale(80),
      height: sizes.scale(80),
      borderRadius: sizes.scale(40),
      backgroundColor: colors.p100 || '#E6FAF8',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: sizes.spacing.l,
    },
    introTitle: {
      ...sizes.typography.h2,
      color: colors.n900,
      marginBottom: sizes.spacing.m,
      textAlign: 'center',
    },
    introBody: {
      ...sizes.typography.body,
      color: colors.n700,
      lineHeight: sizes.scale(24),
      textAlign: 'center',
    },
    questionText: {
      ...sizes.typography.h2,
      color: colors.n900,
      marginBottom: sizes.spacing.xl,
    },
    hintText: {
      ...sizes.typography.body2,
      color: colors.n500,
      marginBottom: sizes.spacing.m,
      fontStyle: 'italic',
    },
    noteText: {
      ...sizes.typography.caption,
      color: colors.p500,
      marginBottom: sizes.spacing.m,
    },
    changeNoteText: {
      ...sizes.typography.caption,
      color: colors.sCoral || colors.p500,
      marginBottom: sizes.spacing.m,
      fontStyle: 'italic',
    },
    unknownNoteText: {
      ...sizes.typography.caption,
      color: colors.n500,
      marginTop: sizes.spacing.l,
      textAlign: 'center',
      fontStyle: 'italic',
    },
    optionsList: {
      gap: sizes.spacing.m,
    },
    optionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: sizes.spacing.m,
      borderRadius: sizes.borderRadius.large,
      borderWidth: 1.5,
      borderColor: colors.n200 || '#EEF6F5',
      backgroundColor: colors.white || '#fff',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: sizes.scale(2) },
      shadowOpacity: 0.03,
      shadowRadius: sizes.scale(6),
      elevation: 1,
    },
    optionSelected: {
      borderColor: colors.p500,
      backgroundColor: colors.p100 || '#E6FAF8',
    },
    radioIcon: {
      marginRight: sizes.spacing.m,
    },
    checkbox: {
      width: sizes.scale(22),
      height: sizes.scale(22),
      borderRadius: sizes.scale(6),
      borderWidth: 2,
      borderColor: colors.n400 || '#C5CFCD',
      backgroundColor: colors.white,
      marginRight: sizes.spacing.m,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxSelected: {
      borderColor: colors.p500,
      backgroundColor: colors.p500,
    },
    optionText: {
      ...sizes.typography.bodyLarge,
      color: colors.n900,
      flex: 1,
      fontFamily: 'Manrope_500Medium',
    },
    optionTextSelected: {
      color: colors.n700,
      fontFamily: 'Manrope_600SemiBold',
    },
    footer: {
      padding: sizes.spacing.l,
      borderTopWidth: 1,
      borderTopColor: colors.n200 || '#eee',
      backgroundColor: colors.white || '#fff',
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
      marginBottom: sizes.spacing.m,
      textAlign: 'center',
    }
  });
};
