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

export function RequestPayout() {
  const { colors } = useTheme();
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
        <View style={{ padding: 24 }}>
          <SkeletonCard lines={3} />
        </View>
      ) : (
        <View style={styles.card}>
           <View style={[styles.row, styles.rowBorder]}>
              <View style={styles.rowLeft}>
                 <View style={styles.iconBox}>
                    <Icon name="DollarSign" size={18} color={colors.p400} />
                 </View>
                 <Text style={styles.rowLabel}>{t('doctor_balance.amount') || 'Amount'}:</Text>
              </View>
              <Text style={styles.rowValue}>${balance}</Text>
           </View>

           <View style={styles.row}>
              <View style={styles.rowLeft}>
                 <View style={styles.iconBox}>
                    <Icon name="CreditCard" size={18} color={colors.p400} />
                 </View>
                 <Text style={styles.rowLabel}>{t('doctor_balance.method') || 'Method'}:</Text>
              </View>
              <Text style={styles.rowValue}>Privat Bank</Text>
           </View>

           <TouchableOpacity 
              style={styles.confirmBtn} 
              onPress={handleConfirm} 
              disabled={submitting || balance === 0}
           >
              {submitting ? (
                 <ActivityIndicator color={colors.white} />
              ) : (
                 <Text style={styles.confirmBtnText}>{t('common.confirm') || 'Confirm'}</Text>
              )}
           </TouchableOpacity>
        </View>
      )}
    </SubViewScreen>
  );
}

const themeStyles = (theme) => ({
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: 24,
    padding: theme.sizes.spacing.l,
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
    paddingVertical: theme.sizes.spacing.m,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.n100,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.p400,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.sizes.spacing.m,
  },
  rowLabel: {
    ...theme.sizes.typography.body,
    color: theme.colors.n900,
    fontWeight: '600',
  },
  rowValue: {
    ...theme.sizes.typography.body,
    color: theme.colors.n900,
    fontWeight: '700',
  },
  confirmBtn: {
    backgroundColor: theme.colors.p400,
    paddingVertical: 18,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: theme.sizes.spacing.xl,
    opacity: 1,
  },
  confirmBtnText: {
    ...theme.sizes.typography.h3,
    color: theme.colors.white,
    fontFamily: 'Manrope_700Bold',
  }
});
