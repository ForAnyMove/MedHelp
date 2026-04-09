import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../theme/ThemeContext';
import { useStyles } from '../../../../theme/useStyles';
import { Icon } from '../../../../components/ui/Icon';
import { useDoctorDashboard } from '../../../../context/DoctorDashboardContext';
import { SubViewScreen } from '../../../../components/common/SubViewScreen';
import { Button } from '../../../../components/ui/Button';

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
    const colorsArr = [colors.sPink, colors.p500, colors.sCoral, colors.sYell];
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
          {t('doctor_consultation.completed_time') || 'Completed'}: <Text style={{ fontFamily: 'Manrope_600SemiBold', color: styles.subtitleBold?.color }}>45 min</Text>
        </Text>
        <TouchableOpacity>
          <Icon name="edit" size={sizes.scale(24)} color={styles.editIcon?.color} />
        </TouchableOpacity>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.mainNoteCard}>
          <Text style={styles.mainNoteText}>During the consultation we discussed your test results.</Text>
          <Text style={styles.mainNoteText}>You have:</Text>
          {mockPoints.map((p, idx) => (
            <View key={idx} style={[styles.bulletRow, { marginBottom: idx !== mockPoints.length - 1 ? sizes.spacing.s : 0 }]}>
              <View style={[styles.bullet, { backgroundColor: colors.p500 }]} />
              <Text style={styles.bulletText}>{p}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>{t('doctor_consultation.recommendations') || 'Recommendations'}</Text>
        <View style={styles.listCard}>
          {mockRecs.map((rec, idx) => (
            <View key={idx} style={styles.listItem} borderBottomWidth={idx !== mockRecs.length - 1 ? 1 : 0}>
              <Icon name="anemia" size={sizes.scale(24)} color={getIconColor(idx)} wrapperStyle={styles.iconBox} wrapped />
              <Text style={styles.listText}>{rec}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>{t('doctor_consultation.next_steps') || 'Next steps'}</Text>
        <View style={styles.listCard}>
          {mockRecs.map((rec, idx) => (
            <View key={idx} style={styles.listItem} borderBottomWidth={idx !== mockRecs.length - 1 ? 1 : 0}>
              <Icon name="anemia" size={sizes.scale(24)} color={getIconColor(idx)} wrapperStyle={styles.iconBox} wrapped />
              <Text style={styles.listText}>{rec}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {!isSummarySaved && (
        <View style={styles.footer}>
          <Button
            title={t('doctor_consultation.save_send') || 'Save & send'}
            onPress={handleSave}
            variant="primary"
            size="medium"
            style={styles.saveBtn}
            loading={isSaving}
          />
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
              <Icon name="close" size={sizes.scale(24)} color={colors.n900} />
            </TouchableOpacity>

            <View style={styles.modalIconBox}>
              <Icon name="check" size={sizes.scale(35)} color={colors.p500} />
            </View>
            <Text style={styles.modalTitle}>{t('doctor_consultation.saved_to_history') || 'Saved to patient history'}</Text>
            <Text style={styles.modalDesc}>
              {consultation?.patient?.firstName || 'Patient'} can now access this summary in her app
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
  mainNoteCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.m,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
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
    ...theme.sizes.typography.h3,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
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
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: theme.sizes.spacing.l,
    paddingVertical: theme.sizes.spacing.l,
    backgroundColor: theme.colors.bg,
  },
  saveBtn: {
    height: theme.sizes.scale(58),
  },
  saveBtnText: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n700,
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
