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
           <Icon name="ArrowLeft" size={24} color={colors.p500} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('doctors.booking_summary')}</Text>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.infoRow}>
          <View style={styles.iconLabel}>
            <Icon name="User" size={20} color={colors.p500} />
            <Text style={styles.labelText}>{t('doctors.billing_doctor')}</Text>
          </View>
          <Text style={styles.valueText}>{t('doctors.dr_prefix')}{selectedDoctor.firstName} {selectedDoctor.lastName}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <View style={styles.iconLabel}>
            <Icon name="Calendar" size={20} color={colors.p500} />
            <Text style={styles.labelText}>{t('doctors.date')}</Text>
          </View>
          <Text style={styles.valueText}>{formatIsoDate(selectedSlot.date, 'full', t)}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <View style={styles.iconLabel}>
            <Icon name="Clock" size={20} color={colors.p500} />
            <Text style={styles.labelText}>{t('doctors.time')}</Text>
          </View>
          <Text style={styles.valueText}>{selectedSlot.time}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <View style={styles.iconLabel}>
            <Icon name="Video" size={20} color={colors.p500} />
            <Text style={styles.labelText}>{t('doctors.format')}</Text>
          </View>
          <Text style={styles.valueText}>{t('doctors.online')}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <View style={styles.iconLabel}>
            <Icon name="DollarSign" size={20} color={colors.p500} />
            <Text style={styles.labelText}>{t('doctors.price')}</Text>
          </View>
          <Text style={styles.valueText}>${selectedDoctor.price}</Text>
        </View>
      </View>

      <Button 
        title={t('doctors.edit_datetime')} 
        variant="outlined" 
        onPress={goBack}
        style={styles.editButton}
      />

      <Button 
        title={t('doctors.pay_now')} 
        variant="primary" 
        onPress={handleConfirm}
        style={styles.payButton}
      />
    </View>
  );
}

const themeStyles = (theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    paddingHorizontal: theme.sizes.spacing.l,
    paddingTop: theme.sizes.spacing.m,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.sizes.spacing.xl,
  },
  backButton: {
    marginRight: theme.sizes.spacing.m,
  },
  title: {
    ...theme.sizes.typography.h2,
    color: theme.colors.n900,
  },
  summaryCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.l,
    marginBottom: theme.sizes.spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.sizes.spacing.s,
  },
  iconLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelText: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n700,
    marginLeft: theme.sizes.spacing.s,
  },
  valueText: {
    ...theme.sizes.typography.bodyMedium,
    fontFamily: 'Manrope_600SemiBold',
    color: theme.colors.n900,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.n200,
    marginVertical: theme.sizes.spacing.xs,
  },
  editButton: {
    marginBottom: theme.sizes.spacing.m,
    height: theme.sizes.scale(56),
  },
  payButton: {
    height: theme.sizes.scale(56),
  }
});
