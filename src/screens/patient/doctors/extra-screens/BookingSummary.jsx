import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useComponentContext } from '../../../../context/GlobalContext';
import { usePatientDashboard } from '../../../../context/PatientDashboardContext';
import { useStyles } from '../../../../theme/useStyles';
import { Icon } from '../../../../components/ui/Icon';
import { Button } from '../../../../components/ui/Button';
import { formatIsoDate } from '../../../../utils/dateUtils';
import { isSpecialtyMatching } from '../../../../utils/specialtyMapper';

export function BookingSummary() {
  const { t } = useTranslation();
  const { doctorController, themeController: { colors, sizes } } = useComponentContext();
  const {
    selectedDoctor,
    selectedSlot,
    confirmBooking,
    goBack
  } = doctorController;

  const { 
    navigateToConsultation, 
    updateUrlParams, 
    pendingCheckupForBooking, 
    setPendingCheckupForBooking 
  } = usePatientDashboard();

  const handleBack = () => {
    goBack();
    if (updateUrlParams) updateUrlParams('doctors', 'profile', selectedDoctor?.id);
  };

  const [isProcessing, setIsProcessing] = React.useState(false);
  const [attachCheckup, setAttachCheckup] = React.useState(true);
  const styles = useStyles(themeStyles);

  const doctorProfession = selectedDoctor?.profession_code 
    || selectedDoctor?.professionCode 
    || (selectedDoctor?.specialization?.startsWith('professions.') ? selectedDoctor.specialization.replace('professions.', '') : '')
    || null;

  const checkupSpec = pendingCheckupForBooking?.recommendations?.recommendedSpecialty 
    || pendingCheckupForBooking?.recommendedSpecialty 
    || null;

  // Level 1: Clinical matching guard
  const isEligibleCheckup = Boolean(
    pendingCheckupForBooking?.id &&
    isSpecialtyMatching(checkupSpec, doctorProfession)
  );

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      // payment logic placeholder (e.g. Stripe checkout)
      // For now, simulate a network delay for confirmation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const checkupIdToAttach = (isEligibleCheckup && attachCheckup) ? pendingCheckupForBooking.id : null;
      const res = await confirmBooking(null, checkupIdToAttach);
      if (res) {
        if (setPendingCheckupForBooking) {
          setPendingCheckupForBooking(null);
        }
        if (navigateToConsultation) {
          navigateToConsultation();
        }
      }
    } catch (err) {
      console.error("Booking error:", err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!selectedDoctor || !selectedSlot.date) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Icon name="arrow-back" size={sizes.scale(24)} color={colors.p500} />
        </TouchableOpacity>
      </View>
      <Text style={styles.title}>{t('doctors.booking_summary')}</Text>

      <View style={styles.summaryCard}>
        <View style={styles.infoRow}>
          <View style={styles.iconLabel}>
            <Icon name="doctor-01" size={sizes.scale(24)} color={colors.p400} />
            <Text style={styles.labelText}>{t('doctors.billing_doctor')}</Text>
          </View>
          <Text style={styles.valueText}>{t('doctors.dr_prefix')}{selectedDoctor.firstName} {selectedDoctor.lastName}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <View style={styles.iconLabel}>
            <Icon name="calendar" size={sizes.scale(24)} color={colors.p400} />
            <Text style={styles.labelText}>{t('doctors.date')}</Text>
          </View>
          <Text style={styles.valueText}>{formatIsoDate(selectedSlot.date, 'full', t)}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <View style={styles.iconLabel}>
            <Icon name="time" size={sizes.scale(24)} color={colors.p400} />
            <Text style={styles.labelText}>{t('doctors.time')}</Text>
          </View>
          <Text style={styles.valueText}>{selectedSlot.time}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <View style={styles.iconLabel}>
            <Icon name="format" size={sizes.scale(24)} color={colors.p400} />
            <Text style={styles.labelText}>{t('doctors.format')}:</Text>
          </View>
          <Text style={styles.valueText}>{t('doctors.online')}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <View style={styles.iconLabel}>
            <Icon name="price" size={sizes.scale(24)} color={colors.p400} />
            <Text style={styles.labelText}>{t('doctors.price')}</Text>
          </View>
          <Text style={styles.valueText}>${selectedDoctor.price}</Text>
        </View>

        {/* Level 2 Guard: UI Checkup Confirmation Card */}
        {isEligibleCheckup && (
          <>
            <View style={styles.divider} />
            <TouchableOpacity 
              style={styles.attachCard}
              onPress={() => setAttachCheckup(prev => !prev)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkboxCircle, attachCheckup && styles.checkboxCircleActive]}>
                {attachCheckup && <Icon name="check" size={sizes.scale(14)} color={colors.white} />}
              </View>
              <View style={styles.attachTextContainer}>
                <Text style={styles.attachTitle}>
                  {t('quiz.attach_to_consultation', 'Прикрепить результаты опроса')}
                </Text>
                <Text style={styles.attachSubtitle}>
                  {t('quiz.attach_desc', 'Врач сможет заранее ознакомиться с вашими симптомами и рекомендациями')}
                </Text>
              </View>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.buttonsContainer}>
          <Button
            title={t('doctors.edit_datetime') || 'Edit date & time'}
            variant="outlined"
            onPress={handleBack}
            style={styles.editButton}
            textStyle={styles.editButtonText}
          />

          <Button
            title={t('doctors.pay_now') || 'Pay now'}
            variant="primary"
            onPress={handleConfirm}
            loading={isProcessing}
            style={styles.payButton}
            textStyle={styles.payButtonText}
          />
        </View>
      </View>
    </View>
  );
}

const themeStyles = (theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    paddingHorizontal: theme.sizes.spacing.m,
    paddingTop: theme.sizes.spacing.m,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.sizes.spacing.m,
  },
  backButton: {
    marginRight: theme.sizes.spacing.m,
  },
  title: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n700,
    marginBottom: theme.sizes.spacing.m,
  },
  summaryCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.xl,
    shadowColor: /* TODO: color */ '#000',
    shadowOffset: { width: theme.sizes.scale(0), height: theme.sizes.scale(4) },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.sizes.spacing.xs,
  },
  iconLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelText: {
    ...theme.sizes.typography.bodyMedium,
    fontSize: theme.sizes.scale(15),
    color: theme.colors.n700,
    marginLeft: theme.sizes.spacing.xs,
  },
  valueText: {
    ...theme.sizes.typography.bodyLarge,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: theme.sizes.scale(16),
    color: theme.colors.n700,
  },
  divider: {
    height: theme.sizes.scale(1),
    backgroundColor: theme.colors.n200,
    marginVertical: theme.sizes.spacing.xs,
  },
  buttonsContainer: {
    marginTop: theme.sizes.spacing.m,
  },
  editButton: {
    marginBottom: theme.sizes.spacing.m,
    height: theme.sizes.scale(48),
    borderWidth: 2,
  },
  editButtonText: {
    ...theme.sizes.typography.h3,
  },
  payButton: {
    height: theme.sizes.scale(48),
  },
  payButtonText: {
    ...theme.sizes.typography.h3,
  },
  attachCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '10',
    borderRadius: theme.sizes.borderRadius.medium,
    padding: theme.sizes.spacing.s,
    marginTop: theme.sizes.spacing.s,
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
  },
  checkboxCircle: {
    width: theme.sizes.scale(22),
    height: theme.sizes.scale(22),
    borderRadius: theme.sizes.scale(11),
    borderWidth: 2,
    borderColor: theme.colors.n400,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.sizes.spacing.s,
    backgroundColor: theme.colors.white,
  },
  checkboxCircleActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  attachTextContainer: {
    flex: 1,
  },
  attachTitle: {
    ...theme.sizes.typography.bodyMedium,
    fontSize: theme.sizes.scale(14),
    fontWeight: '700',
    color: theme.colors.n900,
  },
  attachSubtitle: {
    ...theme.sizes.typography.caption,
    color: theme.colors.n600,
    fontSize: theme.sizes.scale(12),
    marginTop: 2,
    lineHeight: 16,
  }
});
