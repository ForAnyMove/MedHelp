import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../../src/theme/ThemeContext';
import { useSession } from '../../../src/context/SessionContext';
import { Icon } from '../../../src/components/ui/Icon';
import { Button } from '../../../src/components/ui/Button';
import { createApiClient } from '../../../src/api/apiClient';
import { createLabResultsApi } from '../../../src/api/labResultsApi';
import { isValidRouteUUID } from '../../../src/utils/routeValidation';

const getMarkerIcon = (name = '') => {
  const n = name.toLowerCase();
  if (n.includes('hemoglobin') || n.includes('blood')) return { name: 'blood', color: '#ff4d4f' };
  if (n.includes('ferritin') || n.includes('iron')) return { name: 'chemical', color: '#faad14' };
  if (n.includes('cholesterol')) return { name: 'blood-analys', color: '#13c2c2' };
  if (n.includes('vitamin')) return { name: 'drops', color: '#52c41a' };
  if (n.includes('tsh') || n.includes('t4')) return { name: 'microscope', color: '#ff4d4f' };
  return { name: 'drops', color: '#faad14' };
};

export default function LabResultDetailsScreen() {
  const { id } = useLocalSearchParams();
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

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!isValidRouteUUID(id)) {
        setLoading(false);
        router.replace('/+not-found');
        return;
      }
      try {
        const api = createApiClient(session, refreshSessionToken);
        const labApi = createLabResultsApi(api);
        const res = await labApi.getLabResultDetails(id);
        const data = res?.data || res;
        if (data) {
          setResult(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, session, refreshSessionToken]);

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(patient)/lab-results');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={themeColors.primary} />
      </View>
    );
  }

  if (!result) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.bg }]}>
        <View style={[styles.header, { paddingHorizontal: spacing.md, paddingTop: spacing.xl, paddingBottom: spacing.md }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Icon name="arrow-back" size={24} color={themeColors.text} onPress={handleGoBack} />
            <Text style={{ marginLeft: spacing.sm, fontFamily: fonts.bold, fontSize: fontSizes.lg, color: themeColors.text }}>Test results</Text>
          </View>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl }}>
          <Text style={{ fontFamily: fonts.medium, fontSize: fontSizes.md, color: themeColors.textSecondary }}>Result not found.</Text>
        </View>
      </View>
    );
  }

  const markers = result.markers || [];
  const flaggedCount = markers.filter(m => m.status && m.status !== 'Normal').length;
  const dateTaken = result.date_taken ? new Date(result.date_taken).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-';
  const resultDate = result.created_at ? new Date(result.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-';

  return (
    <View style={[styles.container, { backgroundColor: themeColors.bg }]}>
      <View style={[styles.header, { paddingHorizontal: spacing.md, paddingTop: spacing.xl, paddingBottom: spacing.md }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Icon name="arrow-back" size={24} color={themeColors.text} onPress={handleGoBack} />
            <Text style={{ marginLeft: spacing.sm, fontFamily: fonts.bold, fontSize: fontSizes.lg, color: themeColors.text }}>Test results</Text>
          </View>
          <TouchableOpacity onPress={() => {}}>
             <Text style={{ fontFamily: fonts.medium, fontSize: fontSizes.sm, color: themeColors.primary }}>Download</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: spacing.xxl || 48 }}>
        {flaggedCount > 0 && (
          <View style={[styles.warningBanner, { backgroundColor: 'rgba(250, 173, 20, 0.1)', borderColor: 'rgba(250, 173, 20, 0.3)', borderWidth: 1, borderRadius: radii.lg, padding: spacing.md, marginBottom: spacing.md, flexDirection: 'row', alignItems: 'center' }]}>
            <Icon name="important" size={24} color="#faad14" />
            <View style={{ marginLeft: spacing.sm }}>
              <Text style={{ fontFamily: fonts.bold, fontSize: fontSizes.md, color: '#faad14' }}>{flaggedCount} values outside range</Text>
              <Text style={{ fontFamily: fonts.regular, fontSize: fontSizes.sm, color: themeColors.textSecondary }}>Consult your doctor</Text>
            </View>
          </View>
        )}

        <View style={[styles.infoCard, { backgroundColor: themeColors.surface, borderRadius: radii.lg, padding: spacing.md, marginBottom: spacing.md }]}>
          <View style={[styles.infoRow, { marginBottom: spacing.sm }]}>
            <Text style={{ fontFamily: fonts.regular, fontSize: fontSizes.sm, color: themeColors.textSecondary }}>Lab:</Text>
            <Text style={{ fontFamily: fonts.medium, fontSize: fontSizes.sm, color: themeColors.text }}>{result.lab_name || 'Unknown'}</Text>
          </View>
          <View style={[styles.infoRow, { marginBottom: spacing.sm }]}>
            <Text style={{ fontFamily: fonts.regular, fontSize: fontSizes.sm, color: themeColors.textSecondary }}>Date taken:</Text>
            <Text style={{ fontFamily: fonts.bold, fontSize: fontSizes.sm, color: themeColors.text }}>{dateTaken}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={{ fontFamily: fonts.regular, fontSize: fontSizes.sm, color: themeColors.textSecondary }}>Results date:</Text>
            <Text style={{ fontFamily: fonts.bold, fontSize: fontSizes.sm, color: themeColors.text }}>{resultDate}</Text>
          </View>
        </View>

        <View style={[styles.resultCard, { backgroundColor: themeColors.surface, borderRadius: radii.lg, padding: spacing.md }]}>
          <View style={{ marginBottom: spacing.md }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: fontSizes.lg, color: themeColors.text }}>{result.title}</Text>
            <Text style={{ fontFamily: fonts.regular, fontSize: fontSizes.sm, color: themeColors.textSecondary }}>{result.category} test • {dateTaken}</Text>
          </View>

          <View style={[styles.tableHeader, { paddingBottom: spacing.xs, borderBottomWidth: 1, borderBottomColor: themeColors.border }]}>
            <Text style={{ flex: 2, fontFamily: fonts.regular, fontSize: fontSizes.xs, color: themeColors.textSecondary }}>Name</Text>
            <Text style={{ flex: 1, fontFamily: fonts.regular, fontSize: fontSizes.xs, color: themeColors.textSecondary }}>Value</Text>
            <Text style={{ flex: 1, fontFamily: fonts.regular, fontSize: fontSizes.xs, color: themeColors.textSecondary, textAlign: 'right' }}>Unit</Text>
          </View>

          {markers.map((marker, idx) => {
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
              <View key={idx} style={[styles.tableRow, { marginTop: spacing.md }]}>
                <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center' }}>
                  <Icon name={mIcon.name} size={20} color={mIcon.color} wrapped wrapperOpacity={0.1} wrapperSize={36} />
                  <View style={{ marginLeft: spacing.sm }}>
                    <Text style={{ fontFamily: fonts.medium, fontSize: fontSizes.md, color: themeColors.text }}>{marker.name}</Text>
                    <Text style={{ fontFamily: fonts.regular, fontSize: fontSizes.xs, color: themeColors.textSecondary }}>{marker.unit}</Text>
                  </View>
                </View>
                <Text style={{ flex: 1, fontFamily: fonts.bold, fontSize: fontSizes.md, color: themeColors.text }}>{marker.value}</Text>
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  <View style={{ backgroundColor: statusBg, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs || 4, borderRadius: radii.md }}>
                    <Text style={{ fontFamily: fonts.medium, fontSize: fontSizes.xs, color: statusColor }}>
                      {statusIcon}{marker.status || 'Normal'}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: themeColors.bg, padding: spacing.md, borderTopWidth: 1, borderTopColor: themeColors.border }]}>
        <Button 
          title="Ask doctor about results →" 
          variant="outline"
          onPress={() => {
            router.push('/doctors');
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {},
  warningBanner: {},
  infoCard: { shadowColor: /* TODO: color */ '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resultCard: { shadowColor: /* TODO: color */ '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  tableHeader: { flexDirection: 'row', alignItems: 'center' },
  tableRow: { flexDirection: 'row', alignItems: 'center' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0 },
});
