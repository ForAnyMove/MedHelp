import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../theme/ThemeContext';
import { useStyles } from '../../../../theme/useStyles';
import { Icon } from '../../../../components/ui/Icon';
import Svg, { Path, Defs, LinearGradient, Stop, Line } from 'react-native-svg';
import { useDoctorDashboard } from '../../../../context/DoctorDashboardContext';
import { transactionManager } from '../../../../managers/transactionManager';
import { SkeletonCard } from '../../../../components/common/SkeletonCard';
import { EmptyState } from '../../../../components/common/EmptyState';

function CurvedLineChart({ data, labels, maxValue, width, height, chartPadding, colors }) {
  if (!data || data.length === 0) return null;

  const actualWidth = width - chartPadding.left - chartPadding.right;
  const actualHeight = height - chartPadding.top - chartPadding.bottom;

  const points = data.map((val, i) => {
    const x = chartPadding.left + (i / (data.length - 1)) * actualWidth;
    const y = chartPadding.top + actualHeight - (val / maxValue) * actualHeight;
    return { x, y };
  });

  let path = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }

  const areaPath = `${path} L ${chartPadding.left + actualWidth},${chartPadding.top + actualHeight} L ${chartPadding.left},${chartPadding.top + actualHeight} Z`;

  const yTicks = [0, 1, 2, 3, 4, 5, 6];

  return (
    <View style={{ width, height }}>
      {/* Y Axis Labels */}
      {yTicks.map(idx => {
        const val = Math.round((idx / 6) * maxValue);
        const yPos = chartPadding.top + actualHeight - (idx / 6) * actualHeight;
        return (
           <Text key={`y-${idx}`} style={{ position: 'absolute', left: 0, top: yPos - 8, fontSize: 10, color: '#98A2B3' }}>
              ${val}
           </Text>
        )
      })}
      
      {/* X Axis Labels */}
      <View style={{ position: 'absolute', bottom: 0, left: chartPadding.left, right: chartPadding.right, flexDirection: 'row', justifyContent: 'space-between' }}>
        {labels.map((lbl, idx) => (
           <Text key={`x-${idx}`} style={{ fontSize: 10, color: '#98A2B3' }}>{lbl}</Text>
        ))}
      </View>

      <Svg width={width} height={height}>
         <Defs>
            <LinearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
               <Stop offset="0" stopColor={colors.p400} stopOpacity="0.4" />
               <Stop offset="1" stopColor={colors.p400} stopOpacity="0.01" />
            </LinearGradient>
         </Defs>

         {yTicks.map(idx => {
           const y = chartPadding.top + actualHeight - (idx / 6) * actualHeight;
           return <Line key={`hl-${idx}`} x1={chartPadding.left + 10} y1={y} x2={width} y2={y} stroke="#F2F4F7" strokeWidth="1" />;
         })}

         <Path d={areaPath} fill="url(#chartGradient)" />
         <Path d={path} fill="none" stroke={colors.p400} strokeWidth="3" />
      </Svg>

      {/* Mocking a tooltip for visual parity */}
      <View style={{
        position: 'absolute',
        top: chartPadding.top + actualHeight - (data[12] / maxValue) * actualHeight - 60,
        left: chartPadding.left + (12 / (data.length - 1)) * actualWidth - 30,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        alignItems: 'center'
      }}>
         <Text style={{ fontSize: 16, fontWeight: '700', color: '#101828' }}>${data[12]}</Text>
         <Text style={{ fontSize: 12, color: '#98A2B3' }}>{labels[12]} Apr</Text>
         <View style={{
           position: 'absolute',
           bottom: -5,
           width: 10,
           height: 10,
           backgroundColor: '#FFFFFF',
           transform: [{rotate: '45deg'}]
         }} />
      </View>
      <View style={{
         position: 'absolute',
         top: chartPadding.top + actualHeight - (data[12] / maxValue) * actualHeight - 6,
         left: chartPadding.left + (12 / (data.length - 1)) * actualWidth - 6,
         width: 12, height: 12, borderRadius: 6, backgroundColor: '#FFFFFF',
         borderWidth: 3, borderColor: colors.p400
      }} />
    </View>
  );
}

export function BalanceDashboard() {
  const { colors } = useTheme();
  const styles = useStyles(themeStyles);
  const { t } = useTranslation();
  const { navigateToFullHistory, navigateToRequestPayout } = useDoctorDashboard();
  const screenWidth = Dimensions.get('window').width;

  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('Month');
  const [balanceData, setBalanceData] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bData, cData, tData] = await Promise.all([
        transactionManager.getBalanceInfo(),
        transactionManager.getChartData(period),
        transactionManager.getTransactionHistory()
      ]);
      setBalanceData(bData);
      setChartData(cData);
      setTransactions(tData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('doctor_balance.profit') || 'Profit'}</Text>
        <View style={styles.segmentedControl}>
           <TouchableOpacity 
             style={[styles.segmentBtn, period === 'Week' && styles.segmentBtnActive]} 
             onPress={() => setPeriod('Week')}
           >
              <Text style={[styles.segmentText, period === 'Week' && styles.segmentTextActive]}>
                {t('doctor_balance.week') || 'Week'}
              </Text>
           </TouchableOpacity>
           <TouchableOpacity 
             style={[styles.segmentBtn, period === 'Month' && styles.segmentBtnActive]} 
             onPress={() => setPeriod('Month')}
           >
              <Text style={[styles.segmentText, period === 'Month' && styles.segmentTextActive]}>
                {t('doctor_balance.month') || 'Month'}
              </Text>
           </TouchableOpacity>
        </View>
      </View>

      {/* Chart Card */}
      <View style={styles.chartCard}>
         {loading || !chartData ? (
           <View style={styles.loaderContainer}>
             <ActivityIndicator color={colors.p500} />
           </View>
         ) : (
           <CurvedLineChart 
             data={chartData.data} 
             labels={chartData.labels} 
             maxValue={chartData.maxValue} 
             width={screenWidth - 64} 
             height={220} 
             chartPadding={{top: 30, bottom: 20, left: 30, right: 0}}
             colors={colors}
           />
         )}
      </View>

      {/* Transactions Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t('doctor_balance.transaction_history') || 'Transaction history'}</Text>
        <TouchableOpacity style={styles.viewAllBtn} onPress={navigateToFullHistory}>
           <Text style={styles.viewAllText}>{t('doctor_balance.view_all') || 'View all'}</Text>
           <Icon name="ChevronRight" size={16} color={colors.p500} />
        </TouchableOpacity>
      </View>

      {/* Transactions List */}
      <View style={styles.listCard}>
         {loading ? (
             Array.from({ length: 3 }).map((_, idx) => <SkeletonCard key={idx} lines={2} />)
         ) : transactions.length === 0 ? (
             <EmptyState 
               icon="CreditCard" 
               title={t('common.empty') || 'No transactions yet'} 
               description={t('doctor_balance.empty_history') || 'Your completed payouts will appear here.'} 
             />
         ) : (
            transactions.slice(0, 5).map((tItem, idx) => (
                <View key={tItem.id} style={[styles.tRow, idx !== Math.min(4, transactions.length - 1) && styles.tRowBorder]}>
                   <View style={styles.tIconBox}>
                      <View style={[styles.iconCircle, { backgroundColor: tItem.isPayout ? '#E0F9F6' : '#FFF0F0' }]}>
                         <Icon name={tItem.isPayout ? "CreditCard" : "Stethoscope"} size={20} color={tItem.isPayout ? colors.p400 : colors.danger} />
                      </View>
                   </View>
                   <View style={styles.tInfoBox}>
                      <Text style={styles.tDate}>{tItem.date}</Text>
                      <Text style={styles.tTitle}>{tItem.title}</Text>
                   </View>
                   <Text style={[styles.tAmount, { color: tItem.amount > 0 ? colors.p400 : colors.danger }]}>
                      {tItem.amount > 0 ? '+' : ''}${Math.abs(tItem.amount)}
                   </Text>
                </View>
            ))
         )}
      </View>

      {/* Total Balance Card */}
      <Text style={styles.sectionTitle}>{t('doctor_balance.total_balance') || 'Total balance'}</Text>
      <View style={styles.balanceCard}>
         {loading || !balanceData ? (
            <ActivityIndicator color={colors.p500} style={{paddingVertical: 20}} />
         ) : (
            <>
               <View style={styles.balanceInfo}>
                  <Text style={styles.balanceSubtitle}>{t('doctor_balance.available') || 'Available for payout'}</Text>
                  <Text style={styles.balanceAmount}>{balanceData.availablePayout}$</Text>
               </View>
               <TouchableOpacity style={styles.payoutBtn} onPress={navigateToRequestPayout}>
                  <Text style={styles.payoutBtnText}>{t('doctor_balance.request_payout') || 'Request payout'}</Text>
               </TouchableOpacity>
            </>
         )}
      </View>
      
      <View style={{height: 100}} />
    </ScrollView>
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
    justifyContent: 'space-between',
    marginBottom: theme.sizes.spacing.l,
  },
  title: {
    ...theme.sizes.typography.h2,
    color: theme.colors.n900,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    padding: 4,
    borderWidth: 1,
    borderColor: theme.colors.n200,
  },
  segmentBtn: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  segmentBtnActive: {
    backgroundColor: theme.colors.p400,
  },
  segmentText: {
    ...theme.sizes.typography.bodySmall,
    color: theme.colors.n500,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: theme.colors.white,
  },
  chartCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 24,
    padding: theme.sizes.spacing.l,
    marginBottom: theme.sizes.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  loaderContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.sizes.spacing.m,
  },
  sectionTitle: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n900,
    fontFamily: 'Manrope_700Bold',
    marginBottom: theme.sizes.spacing.s,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    ...theme.sizes.typography.bodySmall,
    color: theme.colors.p400,
    marginRight: 4,
  },
  listCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 24,
    padding: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  tRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.sizes.spacing.m,
    paddingHorizontal: theme.sizes.spacing.m,
  },
  tRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.n100,
  },
  tIconBox: {
    marginRight: theme.sizes.spacing.m,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tInfoBox: {
    flex: 1,
  },
  tDate: {
    ...theme.sizes.typography.body,
    fontWeight: '700',
    color: theme.colors.n900,
    marginBottom: 2,
  },
  tTitle: {
    ...theme.sizes.typography.caption,
    color: theme.colors.n500,
  },
  tAmount: {
    ...theme.sizes.typography.body,
    fontWeight: '700',
  },
  balanceCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 24,
    padding: theme.sizes.spacing.xl,
    marginBottom: theme.sizes.spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  balanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.sizes.spacing.xl,
  },
  balanceSubtitle: {
    ...theme.sizes.typography.body,
    color: theme.colors.n900,
    fontWeight: '600',
  },
  balanceAmount: {
    ...theme.sizes.typography.h1,
    color: theme.colors.n900,
  },
  payoutBtn: {
    backgroundColor: theme.colors.p400,
    paddingVertical: 18,
    borderRadius: 24,
    alignItems: 'center',
  },
  payoutBtnText: {
    ...theme.sizes.typography.h3,
    color: theme.colors.white,
    fontFamily: 'Manrope_700Bold',
  }
});
