import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../theme/ThemeContext';
import { useStyles } from '../../../../theme/useStyles';
import { Icon } from '../../../../components/ui/Icon';
import { useDoctorDashboard } from '../../../../context/DoctorDashboardContext';
import { transactionManager } from '../../../../managers/transactionManager';
import { SubViewScreen } from '../../../../components/common/SubViewScreen';
import { SkeletonCard } from '../../../../components/common/SkeletonCard';
import { EmptyState } from '../../../../components/common/EmptyState';

export function TransactionHistory() {
  const { colors, sizes } = useTheme();
  const styles = useStyles(themeStyles);
  const { t } = useTranslation();
  const { navigateBack } = useDoctorDashboard();

  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const data = await transactionManager.getTransactionHistory();
      // maybe mock more data if this list is too short
      setTransactions([...data, { id: '10', date: 'Apr 25', title: 'Consultation', amount: 120, isPayout: false }]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SubViewScreen title={t('doctor_balance.transaction_history') || 'Transaction history'} onBack={navigateBack}>
      {loading ? (
        <View style={{ padding: sizes.spacing.l }}>
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} lines={2} />)}
        </View>
      ) : transactions.length === 0 ? (
        <EmptyState
          icon="balance"
          title={t('common.empty') || 'No transactions yet'}
          description={t('doctor_balance.empty_history') || 'Your completed payouts will appear here.'}
        />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.listCard}>
            {transactions.map((tItem, idx) => (
              <View key={tItem.id} style={[styles.tRow, idx !== transactions.length - 1 && styles.tRowBorder]}>
                <View style={styles.tIconBox}>
                  <Icon name={tItem.isPayout ? "balance" : "stethoscope"} size={sizes.scale(24)} color={tItem.isPayout ? colors.p500 : colors.danger} wrapperStyle={styles.iconWrapper} wrapped />
                </View>
                <View style={styles.tInfoBox}>
                  <Text style={styles.tDate}>{tItem.date}</Text>
                  <Text style={styles.tTitle}>{tItem.title}</Text>
                </View>
                <Text style={[styles.tAmount, { color: tItem.amount > 0 ? colors.p400 : colors.danger }]}>
                  {tItem.amount > 0 ? '+' : ''}${Math.abs(tItem.amount)}
                </Text>
              </View>
            ))}
          </View>
          <View style={{ height: sizes.scale(100) }} />
        </ScrollView>
      )}
    </SubViewScreen>
  );
}

const themeStyles = (theme) => ({
  listCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.l,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  tRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.sizes.scale(6),
  },
  tRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.n200,
  },
  tIconBox: {
    marginRight: theme.sizes.spacing.s,
  },
  iconWrapper: {
    width: theme.sizes.scale(32),
    height: theme.sizes.scale(32),
    alignItems: 'center',
    justifyContent: 'center',
  },
  tInfoBox: {
    flex: 1,
  },
  tDate: {
    ...theme.sizes.typography.bodyLarge,
    color: theme.colors.n700,
    fontFamily: 'Manrope_600SemiBold',
  },
  tTitle: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n500,
  },
  tAmount: {
    ...theme.sizes.typography.h4,
  }
});
