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
import { Button } from '../../../../components/ui/Button';
import { useResponsive } from '../../../../theme/useResponsive';

function CurvedLineChart({ data, labels, maxValue, width, height, chartPadding, colors }) {
  const { sizes } = useTheme();
  if (!data || data.length === 0 || width <= 0) return null;

  const actualWidth = Math.max(10, width - chartPadding.left - chartPadding.right);
  const actualHeight = Math.max(10, height - chartPadding.top - chartPadding.bottom);

  const points = data.map((val, i) => {
    const x = chartPadding.left + (i / Math.max(1, data.length - 1)) * actualWidth;
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

  // Dynamic highlight point (Apr 25 for month, Sat for week)
  const highlightIdx = Math.min(Math.max(0, data.length >= 14 ? 12 : data.length - 2), data.length - 1);
  const highlightVal = data[highlightIdx];
  const highlightLabel = labels[highlightIdx] || '';
  const highlightX = points[highlightIdx]?.x ?? (chartPadding.left + actualWidth / 2);
  const highlightY = points[highlightIdx]?.y ?? (chartPadding.top + actualHeight / 2);

  return (
    <View style={{ width, height, overflow: 'hidden' }}>
      {/* Y Axis Labels */}
      {yTicks.map(idx => {
        const val = Math.round((idx / 6) * maxValue);
        const yPos = chartPadding.top + actualHeight - (idx / 6) * actualHeight;
        return (
          <Text key={`y-${idx}`} style={{ position: 'absolute', left: sizes.scale(0), top: yPos - 8, fontSize: sizes.scale(10), color: '#98A2B3' }}>
            ${val}
          </Text>
        );
      })}

      {/* X Axis Labels */}
      <View style={{ position: 'absolute', bottom: sizes.scale(0), left: chartPadding.left, width: actualWidth, flexDirection: 'row', justifyContent: 'space-between' }}>
        {labels.map((lbl, idx) => (
          <Text key={`x-${idx}`} style={{ fontSize: sizes.scale(10), color: '#98A2B3' }}>{lbl}</Text>
        ))}
      </View>

      <Svg width={width} height={height} style={{ overflow: 'hidden' }}>
        <Defs>
          <LinearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.p400} stopOpacity="0.4" />
            <Stop offset="1" stopColor={colors.p400} stopOpacity="0.01" />
          </LinearGradient>
        </Defs>

        {yTicks.map(idx => {
          const y = chartPadding.top + actualHeight - (idx / 6) * actualHeight;
          return <Line key={`hl-${idx}`} x1={chartPadding.left} y1={y} x2={chartPadding.left + actualWidth} y2={y} stroke="#F2F4F7" strokeWidth="1" />;
        })}

        <Path d={areaPath} fill="url(#chartGradient)" />
        <Path d={path} fill="none" stroke={colors.p400} strokeWidth="3" />
      </Svg>

      {/* Tooltip */}
      <View style={{
        position: 'absolute',
        top: Math.max(4, highlightY - 56),
        left: Math.max(4, Math.min(width - 80, highlightX - 35)),
        backgroundColor: colors.white,
        borderRadius: sizes.scale(16),
        paddingHorizontal: sizes.scale(14),
        paddingVertical: sizes.scale(6),
        shadowColor: '#000',
        shadowOffset: { width: sizes.scale(0), height: sizes.scale(4) },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        alignItems: 'center',
        zIndex: 10,
      }}>
        <Text style={{ fontSize: sizes.scale(14), fontWeight: '700', color: '#101828' }}>${highlightVal}</Text>
        <Text style={{ fontSize: sizes.scale(11), color: '#98A2B3' }}>{highlightLabel}</Text>
        <View style={{
          position: 'absolute',
          bottom: sizes.scale(-4),
          width: sizes.scale(8),
          height: sizes.scale(8),
          backgroundColor: colors.white,
          transform: [{ rotate: '45deg' }]
        }} />
      </View>
      {/* Highlight dot on curve */}
      <View style={{
        position: 'absolute',
        top: highlightY - 6,
        left: highlightX - 6,
        width: sizes.scale(12),
        height: sizes.scale(12),
        borderRadius: sizes.scale(6),
        backgroundColor: colors.white,
        borderWidth: 3,
        borderColor: colors.p400,
        zIndex: 5,
      }} />
    </View>
  );
}

export function BalanceDashboard() {
  const { colors, sizes } = useTheme();
  const responsive = useResponsive();
  const isLandscapeLayout = !responsive?.isPortraitShell && (responsive?.isDesktop || responsive?.isDesktopWide || responsive?.isUltrawide || responsive?.isTabletLandscape);
  const styles = useStyles(themeStyles);
  const { t } = useTranslation();
  const { navigateToFullHistory, navigateToRequestPayout } = useDoctorDashboard();
  const [chartContainerWidth, setChartContainerWidth] = useState(0);

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

  const renderProfitAndChart = () => (
    <>
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

      <View
        style={styles.chartCard}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          if (w > 0 && Math.abs(w - chartContainerWidth) > 2) {
            setChartContainerWidth(w);
          }
        }}
      >
        {loading || !chartData || chartContainerWidth <= 0 ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator color={colors.p500} />
          </View>
        ) : (
          <CurvedLineChart
            data={chartData.data}
            labels={chartData.labels.map(l => {
              const dMap = { Mon: 'mon', Tue: 'tue', Wed: 'wed', Thu: 'thu', Fri: 'fri', Sat: 'sat', Sun: 'sun' };
              return dMap[l] ? t(`days.${dMap[l]}`, l) : l;
            })}
            maxValue={chartData.maxValue}
            width={Math.max(100, chartContainerWidth - (sizes.spacing.m * 2))}
            height={sizes.scale(220)}
            chartPadding={{ top: sizes.scale(30), bottom: sizes.scale(24), left: sizes.scale(36), right: sizes.scale(20) }}
            colors={colors}
          />
        )}
      </View>
    </>
  );

  const renderTransactions = () => (
    <>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t('doctor_balance.transaction_history') || 'Transaction history'}</Text>
        <TouchableOpacity style={styles.viewAllBtn} onPress={navigateToFullHistory}>
          <Text style={styles.viewAllText}>{t('doctor_balance.view_all') || 'View all'}</Text>
          <Icon name="arrow-right" size={sizes.scale(24)} color={colors.p500} />
        </TouchableOpacity>
      </View>

      <View style={styles.listCard}>
        {loading ? (
          Array.from({ length: 3 }).map((_, idx) => <SkeletonCard key={idx} lines={2} />)
        ) : transactions.length === 0 ? (
          <EmptyState
            icon="balance"
            title={t('common.empty') || 'No transactions yet'}
            description={t('doctor_balance.empty_history') || 'Your completed payouts will appear here.'}
          />
        ) : (
          transactions.slice(0, 5).map((tItem, idx) => (
            <View key={tItem.id} style={[styles.tRow, idx !== Math.min(4, transactions.length - 1) && styles.tRowBorder]}>
              <View style={styles.tIconBox}>
                <Icon name={tItem.isPayout ? "balance" : "stethoscope"} size={sizes.scale(24)} color={tItem.isPayout ? colors.p400 : colors.danger} wrapperStyle={styles.iconCircle} wrapped />
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
    </>
  );

  const renderBalanceCard = () => (
    <>
      <Text style={styles.sectionTitle}>{t('doctor_balance.total_balance') || 'Total balance'}</Text>
      <View style={styles.balanceCard}>
        {loading || !balanceData ? (
          <ActivityIndicator color={colors.p500} style={{ paddingVertical: sizes.scale(20) }} />
        ) : (
          <>
            <View style={styles.balanceInfo}>
              <Text style={styles.balanceSubtitle}>{t('doctor_balance.available') || 'Available for payout'}</Text>
              <Text style={styles.balanceAmount}>{balanceData.availablePayout}$</Text>
            </View>
            <Button
              title={t('doctor_balance.request_payout') || 'Request payout'}
              style={styles.payoutBtn}
              onPress={navigateToRequestPayout}
              variant="primary"
              size="large"
            />
          </>
        )}
      </View>
    </>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {isLandscapeLayout ? (
        <View style={styles.desktopRow}>
          <View style={styles.desktopColMain}>
            {renderProfitAndChart()}
            {!(responsive?.isDesktopWide || responsive?.isUltrawide) && renderTransactions()}
          </View>
          <View style={styles.desktopColSide}>
            {renderBalanceCard()}
            {(responsive?.isDesktopWide || responsive?.isUltrawide) && renderTransactions()}
          </View>
        </View>
      ) : (
        <>
          {renderProfitAndChart()}
          {renderTransactions()}
          {renderBalanceCard()}
        </>
      )}

      <View style={{ height: sizes.scale(100) }} />
    </ScrollView>
  );
}

const themeStyles = (theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    paddingHorizontal: theme.responsive?.contentPadding || theme.sizes.spacing.m,
    paddingTop: theme.sizes.spacing.xl,
    width: '100%',
    maxWidth: !theme.responsive?.isPortraitShell && (theme.responsive?.isTabletLandscape || theme.responsive?.isDesktop || theme.responsive?.isDesktopLarge)
      ? (theme.responsive?.containerMaxWidth || 1440)
      : theme.responsive?.isTabletPortrait ? 760 : undefined,
    alignSelf: 'center',
    marginHorizontal: 'auto',
  },
  desktopRow: {
    flexDirection: 'row',
    gap: theme.sizes.spacing.l,
    alignItems: 'flex-start',
    width: '100%',
  },
  desktopColMain: {
    flex: theme.responsive?.isDesktopLarge ? 1.35 : 3,
    minWidth: 0,
  },
  desktopColSide: {
    flex: theme.responsive?.isDesktopLarge ? 1 : 2,
    minWidth: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.sizes.spacing.s,
  },
  title: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n700,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: theme.colors.n200,
    borderRadius: theme.sizes.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.n300,
  },
  segmentBtn: {
    paddingVertical: theme.sizes.scale(6),
    paddingHorizontal: theme.sizes.scale(18),
    borderRadius: theme.sizes.borderRadius.full,
  },
  segmentBtnActive: {
    backgroundColor: theme.colors.p500,
  },
  segmentText: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n700,
  },
  segmentTextActive: {
    color: theme.colors.white,
  },
  chartCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.l,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: /* TODO: color */ '#000',
    shadowOffset: { width: theme.sizes.scale(0), height: theme.sizes.scale(4) },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  loaderContainer: {
    height: theme.sizes.scale(220),
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.sizes.spacing.s,
  },
  sectionTitle: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n700,
    fontFamily: 'Manrope_700Bold',
    marginBottom: theme.sizes.spacing.s,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    ...theme.sizes.typography.bodyMedium,
    fontSize: theme.sizes.scale(15),
    color: theme.colors.p500,
    marginRight: theme.sizes.spacing.xs,
  },
  listCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    paddingVertical: theme.sizes.spacing.m,
    paddingHorizontal: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.l,
    shadowColor: /* TODO: color */ '#000',
    shadowOffset: { width: theme.sizes.scale(0), height: theme.sizes.scale(4) },
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
  iconCircle: {
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
    fontFamily: 'Manrope_600SemiBold',
    color: theme.colors.n700,
  },
  tTitle: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n500,
  },
  tAmount: {
    ...theme.sizes.typography.h4,
  },
  balanceCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.m,
    shadowColor: /* TODO: color */ '#000',
    shadowOffset: { width: theme.sizes.scale(0), height: theme.sizes.scale(4) },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  balanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.sizes.spacing.m,
  },
  balanceSubtitle: {
    ...theme.sizes.typography.bodyLarge,
    color: theme.colors.n700,
    fontFamily: 'Manrope_600SemiBold',
  },
  balanceAmount: {
    ...theme.sizes.typography.h2,
    color: theme.colors.n700,
  },
  payoutBtn: {
    width: '100%',
  },
});
