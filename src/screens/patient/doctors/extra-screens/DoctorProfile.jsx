import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useComponentContext } from '../../../../context/GlobalContext';
import { useStyles } from '../../../../theme/useStyles';
import { Icon } from '../../../../components/ui/Icon';
import { Button } from '../../../../components/ui/Button';
import { DoctorAvatar } from '../../../../components/doctor/DoctorAvatar';
import { SlotPicker } from '../../../../components/doctor/SlotPicker';
import { useSession } from '../../../../context/SessionContext';
import { usePatientDashboard } from '../../../../context/PatientDashboardContext';

export function DoctorProfile() {
  const { t } = useTranslation();
  const { doctorController, themeController: { colors, sizes } } = useComponentContext();
  const {
    selectedDoctor,
    availableSlots,
    selectedSlot,
    selectSlot,
    navigateToSummary,
    goBack,
    rescheduleBooking,
    setRescheduleBooking
  } = doctorController;

  const { session, refreshSessionToken } = useSession();
  const { navigateToConsultationDetail, updateUrlParams } = usePatientDashboard();
  const { consultationController } = useComponentContext();

  const [modalState, setModalState] = useState('hidden');

  const executeReschedule = async () => {
    setModalState('loading');
    try {
      const { createApiClient } = require('../../../../api/apiClient');
      const { createConsultationsApi } = require('../../../../api/consultationsApi');
      const api = createApiClient(session, refreshSessionToken);
      const consultApi = createConsultationsApi(api);
      
      await consultApi.update(rescheduleBooking.id, { slot_id: selectedSlot.slotId });
      
      if (consultationController?.loadConsultations) {
        await consultationController.loadConsultations();
      }
      setModalState('success');
    } catch (err) {
      console.error('Reschedule failed', err);
      setModalState('error');
    }
  };

  const handleBack = () => {
    if (rescheduleBooking) {
      const b = rescheduleBooking;
      setRescheduleBooking(null);
      goBack();
      if (consultationController?.bookings) {
        const updated = consultationController.bookings.find(bx => bx.id === b.id) || b;
        navigateToConsultationDetail(updated);
      } else {
        navigateToConsultationDetail(b);
      }
    } else {
      goBack();
      if (updateUrlParams) updateUrlParams('doctors');
    }
  };

  const styles = useStyles(themeStyles);

  if (!selectedDoctor) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Icon name="arrow-back" size={sizes.scale(24)} color={colors.p500} />
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>{t('doctors.profile_title')}</Text>
        <View style={styles.profileCard}>
          <View style={styles.profileTop}>
            <DoctorAvatar
              url={selectedDoctor.avatarUrl}
              firstName={selectedDoctor.firstName}
              lastName={selectedDoctor.lastName}
              size={sizes.scale(78)}
            />
            <View style={styles.profileMainInfo}>
              <Text style={styles.doctorName}>{t('doctors.dr_prefix')}{selectedDoctor.firstName} {selectedDoctor.lastName}</Text>
              <Text style={styles.doctorSpec}>{t(selectedDoctor.specialization)}</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{t('doctors.rating')}</Text>
              <View style={styles.statValueRow}>
                <Icon name="star" size={sizes.scale(18)} color={colors.sYell} />
                <Text style={styles.statValue}>{selectedDoctor.rating} ({selectedDoctor.reviewsCount})</Text>
              </View>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{t('doctors.experience')}</Text>
              <Text style={styles.statValue}>{selectedDoctor.experience} {t('doctors.years')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{t('doctors.price')}</Text>
              <Text style={styles.statValue}>${selectedDoctor.price}{t('doctors.per_hour')}</Text>
            </View>
          </View>

          <Text style={styles.description}>
            {selectedDoctor.description}
          </Text>
        </View>

        <View style={styles.bookingSection}>
          <Text style={styles.bookingTitle}>{t('doctors.book_online_consultation')}</Text>
          <Text style={styles.bookingSubtitle}>{t('doctors.available_dates_hint') || t('doctors.choose_datetime')}</Text>

          <View style={styles.bookingCard}>
            <SlotPicker
              availableSlots={availableSlots}
              selectedSlot={selectedSlot}
              onSelectSlot={selectSlot}
            />

            <Button
              title={rescheduleBooking ? t('common.reschedule', 'Перенести консультацию') : t('doctors.book_consultation')}
              variant="primary"
              disabled={!selectedSlot?.date || !selectedSlot?.time}
              onPress={() => {
                if (rescheduleBooking) {
                  setModalState('confirm');
                } else {
                  navigateToSummary();
                  if (updateUrlParams) updateUrlParams('doctors', 'summary', selectedDoctor?.id);
                }
              }}
              style={styles.bookButton}
            />
          </View>

          <Text style={styles.disclaimer}>{t('doctors.free_cancellation')}</Text>
        </View>
      </ScrollView>

      <Modal visible={modalState !== 'hidden'} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {modalState === 'confirm' && (
              <>
                <Text style={styles.modalTitle}>{t('common.confirm_reschedule', 'Подтверждение переноса')}</Text>
                <Text style={styles.modalText}>
                  {t('common.reschedule_desc', 'Вы уверены, что хотите перенести консультацию на')} {selectedSlot?.date} {selectedSlot?.time}?
                </Text>
                <View style={styles.modalButtons}>
                  <Button title={t('common.cancel', 'Отмена')} variant="outlined" onPress={() => setModalState('hidden')} style={{ flex: 1, marginRight: sizes.spacing.s }} />
                  <Button title={t('common.confirm', 'Да, перенести')} variant="primary" onPress={executeReschedule} style={{ flex: 1, marginLeft: sizes.spacing.s }} />
                </View>
              </>
            )}
            {modalState === 'loading' && (
              <View style={{ padding: sizes.spacing.xl, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={colors.p500} />
                <Text style={[styles.modalText, { marginTop: sizes.spacing.m }]}>{t('common.updating', 'Обновление данных...')}</Text>
              </View>
            )}
            {modalState === 'success' && (
              <>
                <Icon name="check-circle" size={sizes.scale(48)} color={colors.success} style={{ alignSelf: 'center', marginBottom: sizes.spacing.m }} />
                <Text style={[styles.modalTitle, { textAlign: 'center' }]}>{t('common.success', 'Успешно')}</Text>
                <Text style={[styles.modalText, { textAlign: 'center', marginBottom: sizes.spacing.xl }]}>{t('common.reschedule_success', 'Ваша консультация успешно перенесена.')}</Text>
                <Button title={t('common.ok', 'OK')} variant="primary" onPress={() => {
                  setModalState('hidden');
                  const b = rescheduleBooking;
                  setRescheduleBooking(null);
                  goBack();
                  if (consultationController?.bookings) {
                    const updated = consultationController.bookings.find(bx => bx.id === b.id) || b;
                    navigateToConsultationDetail(updated);
                  } else {
                    navigateToConsultationDetail(b);
                  }
                }} />
              </>
            )}
            {modalState === 'error' && (
              <>
                <Icon name="alert-circle" size={sizes.scale(48)} color={colors.danger} style={{ alignSelf: 'center', marginBottom: sizes.spacing.m }} />
                <Text style={[styles.modalTitle, { textAlign: 'center' }]}>{t('common.error', 'Ошибка')}</Text>
                <Text style={[styles.modalText, { textAlign: 'center', marginBottom: sizes.spacing.xl }]}>{t('common.reschedule_error', 'Не удалось перенести консультацию. Попробуйте еще раз.')}</Text>
                <View style={styles.modalButtons}>
                  <Button title={t('common.close', 'Закрыть')} variant="outlined" onPress={() => setModalState('hidden')} style={{ flex: 1, marginRight: sizes.spacing.s }} />
                  <Button title={t('common.try_again', 'Повторить')} variant="primary" onPress={executeReschedule} style={{ flex: 1, marginLeft: sizes.spacing.s }} />
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const themeStyles = (theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  scrollContent: {
    paddingHorizontal: theme.sizes.spacing.m,
    paddingTop: theme.sizes.spacing.m,
    paddingBottom: theme.sizes.spacing.s,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.sizes.spacing.s,
  },
  backButton: {
    marginRight: theme.sizes.spacing.m,
  },
  title: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n700,
    marginBottom: theme.sizes.spacing.s,
  },
  profileCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.l,
    shadowColor: /* TODO: color */ '#000',
    shadowOffset: { width: theme.sizes.scale(0), height: theme.sizes.scale(2) },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.sizes.spacing.s,
  },
  profileMainInfo: {
    marginLeft: theme.sizes.spacing.m,
    flex: 1,
  },
  doctorName: {
    ...theme.sizes.typography.h4,
    color: theme.colors.n700,
  },
  doctorSpec: {
    ...theme.sizes.typography.bodyMedium,
    fontSize: theme.sizes.scale(15),
    color: theme.colors.n500,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.sizes.spacing.m,
    borderTopWidth: 1,
    borderTopColor: theme.colors.n200,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.n200,
    paddingVertical: theme.sizes.spacing.xs,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    ...theme.sizes.typography.bodySmall,
    color: theme.colors.n500,
    marginBottom: theme.sizes.spacing.xs,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statValue: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n700,
    marginLeft: theme.sizes.spacing.xs,
  },
  statDivider: {
    width: theme.sizes.scale(1),
    height: '100%',
    backgroundColor: theme.colors.n200,
    alignSelf: 'center',
  },
  description: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n700,
  },
  bookingSection: {
    marginBottom: theme.sizes.spacing.xl,
  },
  bookingCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.m,
    shadowColor: /* TODO: color */ '#000',
    shadowOffset: { width: theme.sizes.scale(0), height: theme.sizes.scale(4) },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
  },
  bookingTitle: {
    ...theme.sizes.typography.h3,
    fontSize: theme.sizes.scale(16),
    color: theme.colors.n700,
  },
  bookingSubtitle: {
    ...theme.sizes.typography.bodySmall,
    color: theme.colors.n500,
    marginBottom: theme.sizes.spacing.s,
  },
  bookButton: {
    marginTop: theme.sizes.spacing.m,
    height: theme.sizes.scale(58),
  },
  disclaimer: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n500,
    textAlign: 'center',
    marginTop: theme.sizes.spacing.s,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: /* TODO: color */ 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.sizes.spacing.l,
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.l,
    width: '100%',
    maxWidth: theme.sizes.scale(400),
  },
  modalTitle: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n700,
    marginBottom: theme.sizes.spacing.m,
  },
  modalText: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n500,
    marginBottom: theme.sizes.spacing.xl,
    lineHeight: theme.sizes.scale(22),
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  }
});
