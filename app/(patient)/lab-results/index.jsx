import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useSession } from '../../../src/context/SessionContext';
import { useTheme } from '../../../src/theme/ThemeContext';
import { Icon } from '../../../src/components/ui/Icon';
import { Input } from '../../../src/components/ui/Input';
import { getPatientLabResults } from '../../../src/api/labResultsApi';

const CATEGORIES = ['All', 'Blood', 'Vitamins', 'Hormones'];

const getMarkerIcon = (name) => {
  const n = name.toLowerCase();
  if (n.includes('hemoglobin') || n.includes('blood')) return { name: 'blood', color: /* TODO: color */ '#ff4d4f' };
  if (n.includes('ferritin') || n.includes('iron')) return { name: 'chemical', color: /* TODO: color */ '#faad14' };
  if (n.includes('cholesterol')) return { name: 'blood-analys', color: /* TODO: color */ '#13c2c2' };
  if (n.includes('vitamin')) return { name: 'drops', color: /* TODO: color */ '#52c41a' };
  if (n.includes('tsh') || n.includes('t4')) return { name: 'microscope', color: /* TODO: color */ '#ff4d4f' };
  return { name: 'drops', color: /* TODO: color */ '#faad14' }; // default
};

export default function LabResultsScreen() {
  const router = useRouter();
  const { session } = useSession();
  const { colors, sizes, spacing, fonts } = useTheme();
  
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const fetchResults = useCallback(async () => {
    try {
      const res = await getPatientLabResults(session.user.id);
      if (res && res.data) setResults(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session.user.id]);

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
        <View style={[styles.summaryCard, { backgroundColor: colors.surface, padding: spacing.sm, borderRadius: sizes.radius.md }]}>
          <Icon name="blood" size={20} color=/* TODO: color */ "#ff4d4f" wrapped wrapperOpacity={0.1} />
          <View style={{ marginLeft: spacing.xs }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: sizes.font.sm, color: colors.text }}>132</Text>
            <Text style={{ fontFamily: fonts.regular, fontSize: sizes.font.xs, color: colors.textSecondary }}>Hemoglobin</Text>
          </View>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: colors.surface, padding: spacing.sm, borderRadius: sizes.radius.md }]}>
          <Icon name="chemical" size={20} color=/* TODO: color */ "#faad14" wrapped wrapperOpacity={0.1} />
          <View style={{ marginLeft: spacing.xs }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: sizes.font.sm, color: colors.text }}>18</Text>
            <Text style={{ fontFamily: fonts.regular, fontSize: sizes.font.xs, color: colors.textSecondary }}>Ferritin</Text>
          </View>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: colors.surface, padding: spacing.sm, borderRadius: sizes.radius.md }]}>
          <Icon name="blood-analys" size={20} color=/* TODO: color */ "#13c2c2" wrapped wrapperOpacity={0.1} />
          <View style={{ marginLeft: spacing.xs }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: sizes.font.sm, color: colors.text }}>6.1</Text>
            <Text style={{ fontFamily: fonts.regular, fontSize: sizes.font.xs, color: colors.textSecondary }}>Cholesterol</Text>
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
        style={[styles.resultCard, { backgroundColor: colors.surface, borderRadius: sizes.radius.lg, padding: spacing.md, marginBottom: spacing.md }]}
        onPress={() => router.push(`/lab-results/${item.id}`)}
      >
        <View style={[styles.cardHeader, { marginBottom: spacing.sm }]}>
          <View>
            <Text style={{ fontFamily: fonts.bold, fontSize: sizes.font.md, color: colors.text }}>{item.title}</Text>
            <Text style={{ fontFamily: fonts.regular, fontSize: sizes.font.xs, color: colors.textSecondary }}>{date}</Text>
          </View>
          {flaggedCount > 0 && (
            <View style={[styles.flagBadge, { backgroundColor: 'rgba(250, 173, 20, 0.1)', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: sizes.radius.sm }]}>
              <Text style={{ fontFamily: fonts.medium, fontSize: sizes.font.xs, color: /* TODO: color */ '#faad14' }}>↑ {flaggedCount} flagged</Text>
            </View>
          )}
        </View>

        <View style={[styles.tableHeader, { paddingBottom: spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.border }]}>
          <Text style={{ flex: 2, fontFamily: fonts.regular, fontSize: sizes.font.xs, color: colors.textSecondary }}>Name</Text>
          <Text style={{ flex: 1, fontFamily: fonts.regular, fontSize: sizes.font.xs, color: colors.textSecondary }}>Value</Text>
          <Text style={{ flex: 1, fontFamily: fonts.regular, fontSize: sizes.font.xs, color: colors.textSecondary, textAlign: 'right' }}>Unit</Text>
        </View>

        {markers.slice(0, 3).map((marker, idx) => {
          const mIcon = getMarkerIcon(marker.name);
          const isHigh = marker.status === 'High';
          const isLow = marker.status === 'Low';
          const isNormal = marker.status === 'Normal';
          
          let statusColor = colors.textSecondary;
          let statusBg = 'transparent';
          let statusIcon = '';
          
          if (isHigh) { statusColor = /* TODO: color */ '#faad14'; statusBg = 'rgba(250, 173, 20, 0.1)'; statusIcon = '↑ '; }
          if (isLow) { statusColor = /* TODO: color */ '#ff4d4f'; statusBg = 'rgba(255, 77, 79, 0.1)'; statusIcon = '↓ '; }
          if (isNormal) { statusColor = /* TODO: color */ '#52c41a'; statusBg = 'rgba(82, 196, 26, 0.1)'; statusIcon = '✓ '; }

          return (
            <View key={idx} style={[styles.tableRow, { marginTop: spacing.sm }]}>
              <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center' }}>
                <Icon name={mIcon.name} size={16} color={mIcon.color} wrapped wrapperOpacity={0.1} wrapperSize={28} />
                <View style={{ marginLeft: spacing.xs }}>
                  <Text style={{ fontFamily: fonts.medium, fontSize: sizes.font.sm, color: colors.text }}>{marker.name}</Text>
                  <Text style={{ fontFamily: fonts.regular, fontSize: sizes.font.xs, color: colors.textSecondary }}>{marker.unit}</Text>
                </View>
              </View>
              <Text style={{ flex: 1, fontFamily: fonts.bold, fontSize: sizes.font.sm, color: colors.text }}>{marker.value}</Text>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <View style={{ backgroundColor: statusBg, paddingHorizontal: spacing.xs, paddingVertical: 2, borderRadius: sizes.radius.sm }}>
                  <Text style={{ fontFamily: fonts.medium, fontSize: sizes.font.xs, color: statusColor }}>
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
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { paddingHorizontal: spacing.md, paddingTop: spacing.xl, paddingBottom: spacing.md }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Icon name="arrow-back" size={24} color={colors.text} onPress={() => router.back()} />
            <Text style={{ marginLeft: spacing.sm, fontFamily: fonts.bold, fontSize: sizes.font.lg, color: colors.text }}>All Analyses</Text>
          </View>
          <Text style={{ fontFamily: fonts.medium, fontSize: sizes.font.sm, color: colors.primary }}>{results.length} total</Text>
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
                borderColor: activeCategory === cat ? colors.primary : colors.border,
                backgroundColor: activeCategory === cat ? colors.primary : 'transparent',
                borderRadius: sizes.radius.full,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.xs
              }
            ]}
          >
            <Text style={{ 
              fontFamily: fonts.medium, 
              fontSize: sizes.font.sm, 
              color: activeCategory === cat ? 'white' : colors.textSecondary 
            }}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {renderTopSummary()}

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : (
        <ScrollView 
          contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: spacing.xxl }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
          {groupedData.map((group, gIdx) => (
            <View key={gIdx} style={{ marginBottom: spacing.lg }}>
              <Text style={{ fontFamily: fonts.medium, fontSize: sizes.font.md, color: colors.textSecondary, marginBottom: spacing.sm }}>
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
