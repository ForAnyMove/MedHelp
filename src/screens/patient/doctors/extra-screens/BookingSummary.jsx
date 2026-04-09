import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useComponentContext } from '../../../../context/GlobalContext';
import { usePatientDashboard } from '../../../../context/PatientDashboardContext';
import { useStyles } from '../../../../theme/useStyles';
import { Icon } from '../../../../components/ui/Icon';
import { Button } from '../../../../components/ui/Button';
import { formatIsoDate } from '../../../../utils/dateUtils';

export function BookingSummary() {
  const { t } = useTranslation();
  const { doctorController, themeController: { colors, sizes } } = useComponentContext();
  const {
    selectedDoctor,
    selectedSlot,
    confirmBooking,
    goBack
  } = doctorController;

  const { navigateToConsultation } = usePatientDashboard();

  const styles = useStyles(themeStyles);

  const handleConfirm = async () => {
    await confirmBooking();
    navigateToConsultation();
  };

  if (!selectedDoctor || !selectedSlot.date) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
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

        <View style={styles.buttonsContainer}>
          <Button
            title={t('doctors.edit_datetime') || 'Edit date & time'}
            variant="outlined"
            onPress={goBack}
            style={styles.editButton}
            textStyle={styles.editButtonText}
          />

          <Button
            title={t('doctors.pay_now') || 'Pay now'}
            variant="primary"
            onPress={handleConfirm}
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
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
    height: 1,
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
  }
});
