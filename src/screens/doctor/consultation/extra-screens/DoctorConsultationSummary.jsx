import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../theme/ThemeContext';
import { useStyles } from '../../../../theme/useStyles';
import { Icon } from '../../../../components/ui/Icon';
import { useDoctorDashboard } from '../../../../context/DoctorDashboardContext';
import { SubViewScreen } from '../../../../components/common/SubViewScreen';

export function DoctorConsultationSummary({ consultation }) {
  const { colors, sizes } = useTheme();
  const styles = useStyles(themeStyles);
  const { t } = useTranslation();
  const { saveSummary, closeSummary, isSummarySaved, setTabIndex, handleTabSwitchRequest } = useDoctorDashboard();
  
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await saveSummary();
    setIsSaving(false);
    setShowSuccessModal(true);
  };

  const handleClosePopup = () => {
    setShowSuccessModal(false);
  };

  const handleBackToHome = () => {
    setShowSuccessModal(false);
    closeSummary(); // will route to dashboard
    setTabIndex(0); // Explicitly route to Home Tab
  };

  const getIconColor = (idx) => {
    const colorsArr = [colors.danger, colors.p400, colors.danger, '#FFC87E'];
    return colorsArr[idx % colorsArr.length];
  };

  const getIconBg = (idx) => {
    const colorsArr = ['#FFF0F0', '#E0F9F6', '#FFF0F0', '#FFF9F0'];
    return colorsArr[idx % colorsArr.length];
  };

  const mockPoints = [
    "Low ferritin (iron stores) — this may indicate iron deficiency.",
    "Elevated cholesterol level — which increases cardiovascular risk over time.",
    "The condition is not critical, but requires correction and monitoring."
  ];

  const mockRecs = [
    "Consider taking iron supplements",
    "Assess the possible causes of the deficiency",
    "Repeat tests in 4-6 weeks",
    "See a doctor as soon as possible"
  ];

  return (
    <SubViewScreen
      title={t('doctor_consultation.summary_title') || 'Consultation summary'}
      onBack={() => handleTabSwitchRequest(2)}
      confirmBeforeExit={!isSummarySaved}
      confirmTitle={t('doctor_consultation.exit_title')}
      confirmMessage={t('doctor_consultation.exit_desc')}
      confirmLabel={t('doctor_consultation.exit_confirm')}
      cancelLabel={t('common.cancel')}
    >
      {/* Subtitle row */}
      <View style={styles.subHeader}>
        <Text style={styles.subtitle}>
          {t('doctor_consultation.completed_time') || 'Completed'}: <Text style={{fontWeight: '700', color: styles.subtitleBold?.color}}>45 min</Text>
        </Text>
        <TouchableOpacity>
          <Icon name="Edit2" size={20} color={styles.editIcon?.color} />
        </TouchableOpacity>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
         <View style={styles.mainNoteCard}>
            <Text style={styles.mainNoteText}>During the consultation we discussed your test results.</Text>
            <Text style={styles.mainNoteText}>You have:</Text>
            {mockPoints.map((p, idx) => (
              <View key={idx} style={styles.bulletRow}>
                 <View style={[styles.bullet, { backgroundColor: colors.p400 }]} />
                 <Text style={styles.bulletText}>{p}</Text>
              </View>
            ))}
         </View>

         <Text style={styles.sectionTitle}>{t('doctor_consultation.recommendations') || 'Recommendations'}</Text>
         <View style={styles.listCard}>
            {mockRecs.map((rec, idx) => (
               <View key={idx} style={styles.listItem} borderBottomWidth={idx !== mockRecs.length - 1 ? 1 : 0}>
                  <View style={[styles.iconBox, { backgroundColor: getIconBg(idx) }]}>
                     <Icon name="Droplet" size={16} color={getIconColor(idx)} />
                  </View>
                  <Text style={styles.listText}>{rec}</Text>
               </View>
            ))}
         </View>

         <Text style={styles.sectionTitle}>{t('doctor_consultation.next_steps') || 'Next steps'}</Text>
         <View style={styles.listCard}>
            {mockRecs.map((rec, idx) => (
               <View key={idx} style={styles.listItem} borderBottomWidth={idx !== mockRecs.length - 1 ? 1 : 0}>
                  <View style={[styles.iconBox, { backgroundColor: getIconBg(idx) }]}>
                     <Icon name="Droplet" size={16} color={getIconColor(idx)} />
                  </View>
                  <Text style={styles.listText}>{rec}</Text>
               </View>
            ))}
         </View>
      </ScrollView>

      {!isSummarySaved && (
        <View style={styles.footer}>
           <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={isSaving}>
              {isSaving ? (
                 <ActivityIndicator color={colors.white} />
              ) : (
                 <Text style={styles.saveBtnText}>{t('doctor_consultation.save_send') || 'Save & send'}</Text>
              )}
           </TouchableOpacity>
        </View>
      )}

      {isSaving && (
        <View style={styles.loadingOverlay}>
           <ActivityIndicator size="large" color={colors.p500} />
        </View>
      )}

      <Modal visible={showSuccessModal} transparent animationType="fade" onRequestClose={handleClosePopup}>
         <View style={styles.modalOverlay}>
            <View style={styles.modalBody}>
               <TouchableOpacity style={styles.modalClose} onPress={handleClosePopup}>
                  <Icon name="X" size={24} color={colors.n900} />
               </TouchableOpacity>

               <View style={styles.modalIconBox}>
                  <Icon name="CheckCircle" size={40} color={colors.p500} />
               </View>
               <Text style={styles.modalTitle}>{t('doctor_consultation.saved_to_history') || 'Saved to patient history'}</Text>
               <Text style={styles.modalDesc}>
                 {consultation?.patient?.firstName || 'Patient'} can now access this summary in her app
               </Text>
               
               <TouchableOpacity style={styles.modalBtn} onPress={handleBackToHome}>
                  <Text style={styles.modalBtnText}>{t('doctor_consultation.back_to_home') || 'Back to home'}</Text>
               </TouchableOpacity>
            </View>
         </View>
      </Modal>
    </SubViewScreen>
  );
}

const themeStyles = (theme) => ({
  subHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.sizes.spacing.l,
    marginBottom: theme.sizes.spacing.s,
  },
  editIcon: {
    color: theme.colors.n400,
  },
  subtitleBold: {
    color: theme.colors.n900,
  },
  subtitle: {
    ...theme.sizes.typography.bodySmall,
    color: theme.colors.n500,
  },
  scroll: {
    paddingHorizontal: theme.sizes.spacing.l,
    paddingBottom: 100, // space for fixed footer
  },
  mainNoteCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    padding: theme.sizes.spacing.l,
    marginBottom: theme.sizes.spacing.xl,
    marginTop: theme.sizes.spacing.m,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  mainNoteText: {
    ...theme.sizes.typography.bodySmall,
    color: theme.colors.n900,
    marginBottom: 8,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 6,
    paddingRight: 10,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.p500,
    marginTop: 6,
    marginRight: 8,
    marginLeft: 12,
  },
  bulletText: {
    ...theme.sizes.typography.bodySmall,
    color: theme.colors.n900,
    flex: 1,
  },
  sectionTitle: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n900,
    marginBottom: theme.sizes.spacing.m,
    fontFamily: 'Manrope_700Bold',
  },
  listCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    paddingVertical: theme.sizes.spacing.m,
    paddingHorizontal: theme.sizes.spacing.l,
    marginBottom: theme.sizes.spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.sizes.spacing.m,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.sizes.spacing.m,
  },
  listText: {
    ...theme.sizes.typography.bodySmall,
    color: theme.colors.n900,
    flex: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: theme.sizes.spacing.l,
    paddingVertical: theme.sizes.spacing.l,
    backgroundColor: theme.colors.bg, 
  },
  saveBtn: {
    backgroundColor: theme.colors.p400,
    borderRadius: 24,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n900,
    fontFamily: 'Manrope_700Bold',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    backgroundColor: theme.colors.white,
    borderRadius: 32,
    padding: theme.sizes.spacing.xl,
    width: '85%',
    alignItems: 'center',
    position: 'relative',
  },
  modalClose: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
  },
  modalIconBox: {
    marginBottom: theme.sizes.spacing.l,
    marginTop: theme.sizes.spacing.m,
  },
  modalTitle: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n900,
    fontFamily: 'Manrope_700Bold',
    marginBottom: theme.sizes.spacing.s,
    textAlign: 'center',
  },
  modalDesc: {
    ...theme.sizes.typography.bodySmall,
    color: theme.colors.n900,
    textAlign: 'center',
    marginBottom: theme.sizes.spacing.xl,
  },
  modalBtn: {
    backgroundColor: theme.colors.p400,
    paddingVertical: 18,
    borderRadius: 24,
    width: '100%',
    alignItems: 'center',
  },
  modalBtnText: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n900,
    fontFamily: 'Manrope_700Bold',
  }
});
