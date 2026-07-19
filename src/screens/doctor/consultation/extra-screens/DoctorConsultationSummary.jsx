import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../theme/ThemeContext';
import { useStyles } from '../../../../theme/useStyles';
import { Icon } from '../../../../components/ui/Icon';
import { useDoctorDashboard } from '../../../../context/DoctorDashboardContext';
import { SubViewScreen } from '../../../../components/common/SubViewScreen';
import { Button } from '../../../../components/ui/Button';
import { useSession } from '../../../../context/SessionContext';
import { createApiClient } from '../../../../api/apiClient';
import { createConsultationsApi } from '../../../../api/consultationsApi';

export function DoctorConsultationSummary({ consultation }) {
  const { colors, sizes } = useTheme();
  const styles = useStyles(themeStyles);
  const { t } = useTranslation();
  const { closeSummary, backFromForm, goToForm, setTabIndex, handleTabSwitchRequest } = useDoctorDashboard();
  const { session, refreshSessionToken } = useSession();

  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  const [resultData, setResultData] = useState(null);

  useEffect(() => {
    const fetchExistingResult = async () => {
      try {
        const api = createApiClient(session, refreshSessionToken);
        const consultApi = createConsultationsApi(api);
        const response = await consultApi.getResults(consultation.id);
        
        if (response) {
          const resData = response;
          // Parse JSON lists
          const parseList = (field) => {
            if (!field) return [];
            return typeof field === 'string' ? JSON.parse(field) : field;
          };
          
          setResultData({
             ...resData,
             patient_has: parseList(resData.patient_has),
             next_steps: parseList(resData.next_steps),
             recommendations: parseList(resData.recommendations)
          });
        }
      } catch (error) {
        console.error('[DoctorConsultationSummary] Error fetching results:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (consultation?.id) {
      fetchExistingResult();
    } else {
      setIsLoading(false);
    }
  }, [consultation?.id, session]);

  const handleSendToPatient = async () => {
    setIsSending(true);
    try {
      const api = createApiClient(session, refreshSessionToken);
      const consultApi = createConsultationsApi(api);
      
      await consultApi.updateResult(consultation.id, { is_draft: false });
      
      setIsSending(false);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('[DoctorConsultationSummary] Error sending to patient:', error);
      setIsSending(false);
    }
  };

  const handleClosePopup = () => {
    setShowSuccessModal(false);
  };

  const handleBackToHome = () => {
    setShowSuccessModal(false);
    closeSummary(); // will route to dashboard
    setTabIndex(0); // Explicitly route to Home Tab
  };

  if (isLoading) {
     return (
       <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={colors.p500} />
       </View>
     );
  }

  if (!resultData) {
     return (
       <SubViewScreen title="Consultation summary" onBack={backFromForm}>
          <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
             <Text style={styles.subtitle}>{t('doctor_consultation.no_result_data', 'No result data found.')}</Text>
             <Button title={t('doctor_consultation.fill_results', 'Fill results')} onPress={goToForm} style={{marginTop: sizes.scale(20)}} />
          </View>
       </SubViewScreen>
     );
  }

  const getIconColor = (idx) => {
    const colorsArr = [colors.sPink, colors.p500, colors.sCoral, colors.sYell];
    return colorsArr[idx % colorsArr.length];
  };

  const isDraft = resultData.is_draft;

  return (
    <SubViewScreen
      title={t('doctor_consultation.summary_title') || 'Consultation summary'}
      onBack={backFromForm}
      confirmBeforeExit={isDraft}
      confirmTitle={t('doctor_consultation.exit_title') || 'Exit'}
      confirmMessage={t('doctor_consultation.exit_desc') || 'Are you sure you want to leave?'}
      confirmLabel={t('doctor_consultation.exit_confirm') || 'Yes'}
      cancelLabel={t('common.cancel') || 'Cancel'}
    >
      <View style={styles.subHeader}>
        <Text style={styles.subtitle}>
          {t('doctor_consultation.completed_time') || 'Completed'}: <Text style={{ fontFamily: 'Manrope_600SemiBold', color: styles.subtitleBold?.color }}>{consultation?.duration || '45'} min</Text>
        </Text>
        {isDraft && (
          <TouchableOpacity onPress={goToForm}>
            <Icon name="edit" size={sizes.scale(24)} color={styles.editIcon?.color} />
          </TouchableOpacity>
        )}
      </View>
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        
        {/* Header Progress indicator */}
        <View style={styles.progressContainer}>
           <Text style={styles.progressInactive}>{t('doctor_consultation.notes', 'Notes')}</Text>
           <View style={styles.progressLine} />
           <Text style={styles.progressInactive}>{t('doctor_consultation.summary', 'Summary')}</Text>
           <View style={styles.progressLine} />
           <Text style={isDraft ? styles.progressActive : styles.progressInactive}>{t('doctor_consultation.sent', 'Sent')}</Text>
        </View>
        
        {/* Patient has / Overview */}
        <View style={styles.mainNoteCard}>
          {resultData.overview ? (
            <Text style={styles.mainNoteText}>{resultData.overview}</Text>
          ) : null}
          
          {resultData.patient_has && resultData.patient_has.length > 0 && (
            <>
              <Text style={styles.mainNoteText}>{t('doctor_consultation.you_have', 'You have:')}</Text>
              {resultData.patient_has.map((p, idx) => (
                <View key={idx} style={[styles.bulletRow, { marginBottom: idx !== resultData.patient_has.length - 1 ? sizes.spacing.s : 0 }]}>
                  <View style={[styles.bullet, { backgroundColor: colors.p500 }]} />
                  <Text style={styles.bulletText}>{p}</Text>
                </View>
              ))}
            </>
          )}
        </View>

        {/* Diagnosis */}
        {(resultData.diagnosis_icd10 || resultData.diagnosis_name) && (
          <View style={styles.listCard}>
            <Text style={styles.sectionTitle}>{t('doctor_consultation.diagnosis', 'Diagnosis')}</Text>
            <Text style={styles.listText}>
               {resultData.diagnosis_icd10 ? `[${resultData.diagnosis_icd10}] ` : ''}
               {resultData.diagnosis_name || ''}
            </Text>
          </View>
        )}

        {/* Recommendations */}
        {resultData.recommendations && resultData.recommendations.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>{t('doctor_consultation.recommendations') || 'Recommendations'}</Text>
            <View style={styles.listCard}>
              {resultData.recommendations.map((rec, idx) => (
                <View key={idx} style={styles.listItem} borderBottomWidth={idx !== resultData.recommendations.length - 1 ? 1 : 0}>
                  <Icon name="file-text" size={sizes.scale(24)} color={getIconColor(idx)} wrapperStyle={styles.iconBox} wrapped />
                  <Text style={styles.listText}>{rec}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Next Steps */}
        {resultData.next_steps && resultData.next_steps.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>{t('doctor_consultation.next_steps') || 'Next steps'}</Text>
            <View style={styles.listCard}>
              {resultData.next_steps.map((rec, idx) => (
                <View key={idx} style={styles.listItem} borderBottomWidth={idx !== resultData.next_steps.length - 1 ? 1 : 0}>
                  <Icon name="check-circle" size={sizes.scale(24)} color={getIconColor(idx + 1)} wrapperStyle={styles.iconBox} wrapped />
                  <Text style={styles.listText}>{rec}</Text>
                </View>
              ))}
            </View>
          </>
        )}
        
        {/* Prescriptions */}
        {resultData.prescriptions ? (
          <>
            <Text style={styles.sectionTitle}>{t('doctor_consultation.prescriptions', 'Prescriptions')}</Text>
            <View style={styles.listCard}>
              <Text style={styles.listText}>{resultData.prescriptions}</Text>
            </View>
          </>
        ) : null}
      </ScrollView>

      {isDraft && (
        <View style={styles.footer}>
          <Button
            title={t('doctor_consultation.send_to_patient') || 'Sent to patient'}
            onPress={handleSendToPatient}
            variant="primary"
            size="medium"
            style={styles.saveBtn}
            loading={isSending}
          />
          <Button
            title={t('common.skip') || 'Skip for now'}
            onPress={closeSummary}
            variant="outlined"
            size="medium"
            style={styles.skipBtn}
          />
        </View>
      )}

      <Modal visible={showSuccessModal} transparent animationType="fade" onRequestClose={handleClosePopup}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBody}>
            <TouchableOpacity style={styles.modalClose} onPress={handleClosePopup}>
              <Icon name="close" size={sizes.scale(24)} color={colors.n900} />
            </TouchableOpacity>

            <View style={styles.modalIconBox}>
              <Icon name="check" size={sizes.scale(35)} color={colors.p500} />
            </View>
            <Text style={styles.modalTitle}>{t('doctor_consultation.saved_to_history') || 'Saved to patient history'}</Text>
            <Text style={styles.modalDesc}>
              {t('doctor_consultation.patient_access_desc', '{{name}} can now access this summary in their app', { name: consultation?.patient?.firstName || t('doctor_consultation.patient_fallback', 'Patient') })}
            </Text>
            <Button
              title={t('doctor_consultation.back_to_home') || 'Back to home'}
              onPress={handleBackToHome}
              variant="primary"
              size="medium"
              style={styles.modalBtn}
            />
          </View>
        </View>
      </Modal>
    </SubViewScreen>
  );
}

const themeStyles = (theme) => ({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  subHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: -theme.sizes.spacing.s,
    marginBottom: theme.sizes.spacing.xs,
  },
  editIcon: {
    color: theme.colors.n500,
  },
  subtitleBold: {
    color: theme.colors.n700,
  },
  subtitle: {
    ...theme.sizes.typography.bodyLarge,
    color: theme.colors.n500,
  },
  scroll: {
    paddingBottom: theme.sizes.scale(100), // space for fixed footer
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.sizes.spacing.l,
    marginTop: theme.sizes.spacing.s,
  },
  progressActive: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n900,
    fontFamily: 'Manrope_700Bold',
  },
  progressInactive: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n400,
  },
  progressLine: {
    width: theme.sizes.scale(20),
    height: theme.sizes.scale(2),
    backgroundColor: theme.colors.n300,
    marginHorizontal: theme.sizes.spacing.s,
  },
  mainNoteCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.m,
    shadowColor: /* TODO: color */ '#000',
    shadowOffset: { width: theme.sizes.scale(0), height: theme.sizes.scale(4) },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  mainNoteText: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n700,
    marginBottom: theme.sizes.spacing.s,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.sizes.spacing.s,
  },
  bullet: {
    width: theme.sizes.scale(6),
    height: theme.sizes.scale(6),
    borderRadius: theme.sizes.borderRadius.full,
    backgroundColor: theme.colors.p500,
    marginRight: theme.sizes.spacing.m,
  },
  bulletText: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n700,
    flex: 1,
  },
  sectionTitle: {
    ...theme.sizes.typography.h4,
    color: theme.colors.n700,
    marginBottom: theme.sizes.spacing.xs,
    fontFamily: 'Manrope_700Bold',
  },
  listCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    paddingVertical: theme.sizes.spacing.m,
    paddingHorizontal: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.m,
    shadowColor: /* TODO: color */ '#000',
    shadowOffset: { width: theme.sizes.scale(0), height: theme.sizes.scale(4) },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
    gap: theme.sizes.spacing.s,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: theme.sizes.scale(32),
    height: theme.sizes.scale(32),
    marginRight: theme.sizes.spacing.s,
  },
  listText: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n700,
    flex: 1,
  },
  footer: {
    position: 'absolute',
    bottom: theme.sizes.scale(0),
    left: theme.sizes.scale(0),
    right: theme.sizes.scale(0),
    paddingHorizontal: theme.sizes.spacing.l,
    paddingVertical: theme.sizes.spacing.l,
    backgroundColor: theme.colors.bg,
  },
  saveBtn: {
    height: theme.sizes.scale(58),
  },
  skipBtn: {
    marginTop: theme.sizes.spacing.m,
    height: theme.sizes.scale(58),
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: /* TODO: color */ 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: /* TODO: color */ 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.m,
    paddingBottom: theme.sizes.spacing.l,
    width: '90%',
    alignItems: 'center',
    position: 'relative',
  },
  modalClose: {
    position: 'absolute',
    top: theme.sizes.spacing.m,
    right: theme.sizes.spacing.m,
    zIndex: 10,
  },
  modalIconBox: {
    marginBottom: theme.sizes.spacing.l,
    marginTop: theme.sizes.spacing.xs,
  },
  modalTitle: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n700,
    fontFamily: 'Manrope_700Bold',
    marginBottom: theme.sizes.spacing.m,
    textAlign: 'center',
  },
  modalDesc: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n700,
    textAlign: 'center',
    marginBottom: theme.sizes.spacing.xl,
    maxWidth: '70%',
  },
  modalBtn: {
    width: '100%',
  },
});
