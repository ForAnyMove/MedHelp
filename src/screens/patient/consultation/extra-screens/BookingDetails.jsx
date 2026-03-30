import React from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../theme/ThemeContext';
import { useStyles } from '../../../../theme/useStyles';
import { Icon } from '../../../../components/ui/Icon';
import { Button } from '../../../../components/ui/Button';
import { RegularDoctorCard } from '../../../../components/doctor/RegularDoctorCard';
import { formatIsoDate } from '../../../../utils/dateUtils';

export function BookingDetails({ visible, booking, onClose, onCancel }) {
  const { t } = useTranslation();
  const { colors, sizes } = useTheme();
  const styles = useStyles(themeStyles);

  if (!booking) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('consultation.booking_details')}</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="X" size={24} color={colors.n900} />
            </TouchableOpacity>
          </View>

          <RegularDoctorCard 
            doctor={booking.doctor} 
            variant="compact" 
            onProfilePress={() => {}}
          />

          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <Icon name="Calendar" size={20} color={colors.p500} />
              <View style={styles.detailInfo}>
                <Text style={styles.detailLabel}>{t('doctors.date')}</Text>
                <Text style={styles.detailValue}>
                  {formatIsoDate(booking.slot?.date || booking.date, 'full', t)}
                </Text>
              </View>
            </View>
            <View style={styles.detailRow}>
              <Icon name="Clock" size={20} color={colors.p500} />
              <View style={styles.detailInfo}>
                <Text style={styles.detailLabel}>{t('doctors.time')}</Text>
                <Text style={styles.detailValue}>{booking.slot?.time || booking.duration || '--:--'}</Text>
              </View>
            </View>
            <View style={styles.detailRow}>
              <Icon name="CreditCard" size={20} color={colors.p500} />
              <View style={styles.detailInfo}>
                <Text style={styles.detailLabel}>{t('consultation.price_label')}</Text>
                <Text style={styles.detailValue}>${booking.doctor.price}</Text>
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <Button 
              title={t('consultation.cancel_booking')} 
              variant="outlined" 
              onPress={() => onCancel(booking.id)} 
              style={styles.cancelBtn}
              textColor={colors.danger}
            />
            <Button 
              title={t('consultation.change_datetime')} 
              variant="primary" 
              onPress={onClose} 
              style={styles.closeBtn}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const themeStyles = (theme) => ({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: theme.sizes.spacing.l,
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: 32,
    padding: theme.sizes.spacing.l,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.sizes.spacing.l,
  },
  modalTitle: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n900,
  },
  detailCard: {
    backgroundColor: '#F8FBFB',
    borderRadius: 24,
    padding: theme.sizes.spacing.m,
    marginTop: theme.sizes.spacing.m,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.sizes.spacing.m,
  },
  detailInfo: {
    marginLeft: theme.sizes.spacing.m,
  },
  detailLabel: {
    ...theme.sizes.typography.caption,
    color: theme.colors.n500,
  },
  detailValue: {
    ...theme.sizes.typography.body,
    fontWeight: '700',
    color: theme.colors.n900,
  },
  footer: {
    marginTop: theme.sizes.spacing.xl,
    flexDirection: 'row',
    gap: theme.sizes.spacing.s,
  },
  cancelBtn: {
    flex: 1,
    borderColor: '#FF7D7D',
  },
  closeBtn: {
    flex: 1,
  }
});
