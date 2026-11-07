import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useSession } from '../../../src/context/SessionContext';
import { useTheme } from '../../../src/theme/ThemeContext';
import { Icon } from '../../../src/components/ui/Icon';
import { Input } from '../../../src/components/ui/Input';
import { createApiClient } from '../../../src/api/apiClient';
import { createLabResultsApi } from '../../../src/api/labResultsApi';

const CATEGORIES = ['All', 'Blood', 'Vitamins', 'Hormones'];

const getMarkerIcon = (name = '') => {
  const n = name.toLowerCase();
  if (n.includes('hemoglobin') || n.includes('blood')) return { name: 'blood', color: '#ff4d4f' };
  if (n.includes('ferritin') || n.includes('iron')) return { name: 'chemical', color: '#faad14' };
  if (n.includes('cholesterol')) return { name: 'blood-analys', color: '#13c2c2' };
  if (n.includes('vitamin')) return { name: 'drops', color: '#52c41a' };
  if (n.includes('tsh') || n.includes('t4')) return { name: 'microscope', color: '#ff4d4f' };
  return { name: 'drops', color: '#faad14' };
};

export default function LabResultsScreen() {
  const router = useRouter();
  const { session, refreshSessionToken } = useSession();
  const { colors, sizes } = useTheme();

  const spacing = useMemo(() => ({
    xs: sizes?.spacing?.xs ?? 4,
    sm: sizes?.spacing?.s ?? 8,
    md: sizes?.spacing?.m ?? 16,
    lg: sizes?.spacing?.l ?? 24,
    xl: sizes?.spacing?.xl ?? 32,
    xxl: sizes?.spacing?.xxl ?? 48,
  }), [sizes]);

  const fonts = {
    regular: 'Manrope_400Regular',
    medium: 'Manrope_500Medium',
    bold: 'Manrope_700Bold',
  };

  const fontSizes = useMemo(() => ({
    xs: sizes?.scale ? sizes.scale(12) : 12,
    sm: sizes?.scale ? sizes.scale(14) : 14,
    md: sizes?.scale ? sizes.scale(16) : 16,
    lg: sizes?.scale ? sizes.scale(20) : 20,
  }), [sizes]);

  const radii = useMemo(() => ({
    sm: sizes?.borderRadius?.small ?? 8,
    md: sizes?.borderRadius?.medium ?? 12,
    lg: sizes?.borderRadius?.large ?? 16,
    full: sizes?.borderRadius?.full ?? 999,
  }), [sizes]);

  const themeColors = useMemo(() => ({
    bg: colors?.bg || '#F8FAFC',
    surface: colors?.white || '#FFFFFF',
    text: colors?.n900 || '#0F172A',
    textSecondary: colors?.n500 || '#64748B',
    primary: colors?.p500 || '#14B8A6',
    border: colors?.n200 || '#E2E8F0',
  }), [colors]);

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const userId = session?.userId || session?.user?.id;

  const fetchResults = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const api = createApiClient(session, refreshSessionToken);
      const labApi = createLabResultsApi(api);
      const res = await labApi.getPatientLabResults(userId);
      const list = Array.isArray(res) ? res : (res?.data || []);
      setResults(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, session, refreshSessionToken]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchResults();
  };

  const filteredResults = useMemo(() => {
    return results.filter(r => {
      const matchSearch = r.title.toLowerCase().includes(search.toLowerCase());
      const matchCategory = activeCategory === 'All' || r.category === activeCategory;
      return matchSearch && matchCategory;
    });
  }, [results, search, activeCategory]);

  // Group by month-year
  const groupedData = useMemo(() => {
    const groups = {};
    filteredResults.forEach(item => {
      const date = new Date(item.created_at || item.date_taken);
      const monthYear = date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      if (!groups[monthYear]) groups[monthYear] = [];
      groups[monthYear].push(item);
    });
    return Object.entries(groups).map(([month, data]) => ({ month, data }));
  }, [filteredResults]);

  const renderTopSummary = () => {
    return (
      <View style={[styles.summaryContainer, { gap: spacing.sm, paddingHorizontal: spacing.md, paddingBottom: spacing.lg }]}>
        <View style={[styles.summaryCard, { backgroundColor: themeColors.surface, padding: spacing.sm, borderRadius: radii.md }]}>
          <Icon name="blood" size={20} color="#ff4d4f" wrapped wrapperOpacity={0.1} />
          <View style={{ marginLeft: spacing.xs }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: fontSizes.sm, color: themeColors.text }}>132</Text>
            <Text style={{ fontFamily: fonts.regular, fontSize: fontSizes.xs, color: themeColors.textSecondary }}>Hemoglobin</Text>
          </View>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: themeColors.surface, padding: spacing.sm, borderRadius: radii.md }]}>
          <Icon name="chemical" size={20} color="#faad14" wrapped wrapperOpacity={0.1} />
          <View style={{ marginLeft: spacing.xs }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: fontSizes.sm, color: themeColors.text }}>18</Text>
            <Text style={{ fontFamily: fonts.regular, fontSize: fontSizes.xs, color: themeColors.textSecondary }}>Ferritin</Text>
          </View>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: themeColors.surface, padding: spacing.sm, borderRadius: radii.md }]}>
          <Icon name="blood-analys" size={20} color="#13c2c2" wrapped wrapperOpacity={0.1} />
          <View style={{ marginLeft: spacing.xs }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: fontSizes.sm, color: themeColors.text }}>6.1</Text>
            <Text style={{ fontFamily: fonts.regular, fontSize: fontSizes.xs, color: themeColors.textSecondary }}>Cholesterol</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderResultCard = (item) => {
    const date = new Date(item.created_at || item.date_taken).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const markers = item.markers || [];
    const flaggedCount = markers.filter(m => m.status && m.status !== 'Normal').length;

    return (
      <TouchableOpacity 
        style={[styles.resultCard, { backgroundColor: themeColors.surface, borderRadius: radii.lg, padding: spacing.md, marginBottom: spacing.md }]}
        onPress={() => router.push(`/(patient)/lab-results/${item.id}`)}
      >
        <View style={[styles.cardHeader, { marginBottom: spacing.sm }]}>
          <View>
            <Text style={{ fontFamily: fonts.bold, fontSize: fontSizes.md, color: themeColors.text }}>{item.title}</Text>
            <Text style={{ fontFamily: fonts.regular, fontSize: fontSizes.xs, color: themeColors.textSecondary }}>{date}</Text>
          </View>
          {flaggedCount > 0 && (
            <View style={[styles.flagBadge, { backgroundColor: 'rgba(250, 173, 20, 0.1)', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radii.sm }]}>
              <Text style={{ fontFamily: fonts.medium, fontSize: fontSizes.xs, color: '#faad14' }}>↑ {flaggedCount} flagged</Text>
            </View>
          )}
        </View>

        <View style={[styles.tableHeader, { paddingBottom: spacing.xs, borderBottomWidth: 1, borderBottomColor: themeColors.border }]}>
          <Text style={{ flex: 2, fontFamily: fonts.regular, fontSize: fontSizes.xs, color: themeColors.textSecondary }}>Name</Text>
          <Text style={{ flex: 1, fontFamily: fonts.regular, fontSize: fontSizes.xs, color: themeColors.textSecondary }}>Value</Text>
          <Text style={{ flex: 1, fontFamily: fonts.regular, fontSize: fontSizes.xs, color: themeColors.textSecondary, textAlign: 'right' }}>Unit</Text>
        </View>

        {markers.slice(0, 3).map((marker, idx) => {
          const mIcon = getMarkerIcon(marker.name);
          const isHigh = marker.status === 'High';
          const isLow = marker.status === 'Low';
          const isNormal = marker.status === 'Normal';
          
          let statusColor = themeColors.textSecondary;
          let statusBg = 'transparent';
          let statusIcon = '';
          
          if (isHigh) { statusColor = '#faad14'; statusBg = 'rgba(250, 173, 20, 0.1)'; statusIcon = '↑ '; }
          if (isLow) { statusColor = '#ff4d4f'; statusBg = 'rgba(255, 77, 79, 0.1)'; statusIcon = '↓ '; }
          if (isNormal) { statusColor = '#52c41a'; statusBg = 'rgba(82, 196, 26, 0.1)'; statusIcon = '✓ '; }

          return (
            <View key={idx} style={[styles.tableRow, { marginTop: spacing.sm }]}>
              <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center' }}>
                <Icon name={mIcon.name} size={16} color={mIcon.color} wrapped wrapperOpacity={0.1} wrapperSize={28} />
                <View style={{ marginLeft: spacing.xs }}>
                  <Text style={{ fontFamily: fonts.medium, fontSize: fontSizes.sm, color: themeColors.text }}>{marker.name}</Text>
                  <Text style={{ fontFamily: fonts.regular, fontSize: fontSizes.xs, color: themeColors.textSecondary }}>{marker.unit}</Text>
                </View>
              </View>
              <Text style={{ flex: 1, fontFamily: fonts.bold, fontSize: fontSizes.sm, color: themeColors.text }}>{marker.value}</Text>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <View style={{ backgroundColor: statusBg, paddingHorizontal: spacing.xs, paddingVertical: Math.round(spacing.xs / 2) || 2, borderRadius: radii.sm }}>
                  <Text style={{ fontFamily: fonts.medium, fontSize: fontSizes.xs, color: statusColor }}>
                    {statusIcon}{marker.status || 'Normal'}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.bg }]}>
      <View style={[styles.header, { paddingHorizontal: spacing.md, paddingTop: spacing.xl, paddingBottom: spacing.md }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Icon name="arrow-back" size={24} color={themeColors.text} onPress={() => router.canGoBack() ? router.back() : router.replace('/home')} />
            <Text style={{ marginLeft: spacing.sm, fontFamily: fonts.bold, fontSize: fontSizes.lg, color: themeColors.text }}>All Analyses</Text>
          </View>
          <Text style={{ fontFamily: fonts.medium, fontSize: fontSizes.sm, color: themeColors.primary }}>{results.length} total</Text>
        </View>
        <View style={{ marginTop: spacing.md }}>
          <Input 
            placeholder="Search by test name..." 
            value={search} 
            onChangeText={setSearch} 
            leftIcon="search"
          />
        </View>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={{ paddingHorizontal: spacing.md, gap: spacing.sm }}
        style={{ flexGrow: 0, marginBottom: spacing.md }}
      >
        {CATEGORIES.map(cat => (
          <TouchableOpacity 
            key={cat} 
            onPress={() => setActiveCategory(cat)}
            style={[
              styles.categoryPill, 
              { 
                borderColor: activeCategory === cat ? themeColors.primary : themeColors.border,
                backgroundColor: activeCategory === cat ? themeColors.primary : 'transparent',
                borderRadius: radii.full,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.xs
              }
            ]}
          >
            <Text style={{ 
              fontFamily: fonts.medium, 
              fontSize: fontSizes.sm, 
              color: activeCategory === cat ? 'white' : themeColors.textSecondary 
            }}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {renderTopSummary()}

      {loading ? (
        <ActivityIndicator size="large" color={themeColors.primary} style={{ marginTop: spacing.xl }} />
      ) : (
        <ScrollView 
          contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: spacing.xxl }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={themeColors.primary} />}
        >
          {groupedData.map((group, gIdx) => (
            <View key={gIdx} style={{ marginBottom: spacing.lg }}>
              <Text style={{ fontFamily: fonts.medium, fontSize: fontSizes.md, color: themeColors.textSecondary, marginBottom: spacing.sm }}>
                {group.month}
              </Text>
              {group.data.map((item, iIdx) => (
                <React.Fragment key={iIdx}>
                  {renderResultCard(item)}
                </React.Fragment>
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {},
  categoryPill: { borderWidth: 1 },
  summaryContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryCard: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  resultCard: { shadowColor: /* TODO: color */ '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  flagBadge: {},
  tableHeader: { flexDirection: 'row', alignItems: 'center' },
  tableRow: { flexDirection: 'row', alignItems: 'center' },
});
