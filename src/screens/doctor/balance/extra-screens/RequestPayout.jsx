import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../theme/ThemeContext';
import { useStyles } from '../../../../theme/useStyles';
import { Icon } from '../../../../components/ui/Icon';
import { useDoctorDashboard } from '../../../../context/DoctorDashboardContext';
import { transactionManager } from '../../../../managers/transactionManager';
import { SubViewScreen } from '../../../../components/common/SubViewScreen';
import { SkeletonCard } from '../../../../components/common/SkeletonCard';
import { Button } from '../../../../components/ui/Button';

export function RequestPayout() {
  const { colors, sizes } = useTheme();
  const styles = useStyles(themeStyles);
  const { t } = useTranslation();
  const { navigateBack } = useDoctorDashboard();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    loadBalance();
  }, []);

  const loadBalance = async () => {
    try {
      const bData = await transactionManager.getBalanceInfo();
      setBalance(bData.availablePayout);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await transactionManager.requestPayout(balance, 'privatbank');
      // On success, go back to dashboard
      navigateBack();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SubViewScreen title={t('doctor_balance.request_payout') || 'Request payout'} onBack={navigateBack}>
      {loading ? (
        <View style={{ padding: sizes.scale(12) }}>
          <SkeletonCard lines={3} />
        </View>
      ) : (
        <View style={styles.card}>
          <View style={[styles.row, styles.rowBorder]}>
            <View style={styles.rowLeft}>
              <Icon name="price" size={sizes.scale(24)} color={colors.p400} />
              <Text style={styles.rowLabel}>{t('doctor_balance.amount') || 'Amount'}:</Text>
            </View>
            <Text style={styles.rowValue}>${balance}</Text>
          </View>

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Icon name="balance" size={sizes.scale(24)} color={colors.p400} />
              <Text style={styles.rowLabel}>{t('doctor_balance.method') || 'Method'}:</Text>
            </View>
            <Text style={styles.rowValue}>Privat Bank</Text>
          </View>
          <Button
            title={t('common.confirm') || 'Confirm'}
            onPress={handleConfirm}
            disabled={submitting || balance === 0}
            loading={submitting}
            style={styles.confirmBtn}
          />
        </View>
      )}
    </SubViewScreen>
  );
}

const themeStyles = (theme) => ({
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.m,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.sizes.scale(6),
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.n200,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowLabel: {
    ...theme.sizes.typography.bodyLarge,
    color: theme.colors.n700,
    fontFamily: 'Manrope_600SemiBold',
    marginLeft: theme.sizes.spacing.m,
  },
  rowValue: {
    ...theme.sizes.typography.bodyLarge,
    color: theme.colors.n700,
    fontFamily: 'Manrope_600SemiBold',
  },
  confirmBtn: {
    height: theme.sizes.scale(48),
    marginTop: theme.sizes.spacing.m,
  },
});
