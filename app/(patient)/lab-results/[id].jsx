import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../../src/theme/ThemeContext';
import { Icon } from '../../../src/components/ui/Icon';
import { Button } from '../../../src/components/ui/Button';
import { getLabResultDetails } from '../../../src/api/labResultsApi';

const getMarkerIcon = (name) => {
  const n = name.toLowerCase();
  if (n.includes('hemoglobin') || n.includes('blood')) return { name: 'blood', color: /* TODO: color */ '#ff4d4f' };
  if (n.includes('ferritin') || n.includes('iron')) return { name: 'chemical', color: /* TODO: color */ '#faad14' };
  if (n.includes('cholesterol')) return { name: 'blood-analys', color: /* TODO: color */ '#13c2c2' };
  if (n.includes('vitamin')) return { name: 'drops', color: /* TODO: color */ '#52c41a' };
  if (n.includes('tsh') || n.includes('t4')) return { name: 'microscope', color: /* TODO: color */ '#ff4d4f' };
  return { name: 'drops', color: /* TODO: color */ '#faad14' }; // default
};

export default function LabResultDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colors, sizes, spacing, fonts } = useTheme();
  
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getLabResultDetails(id);
        if (res && res.data) {
          setResult(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading || !result) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const markers = result.markers || [];
  const flaggedCount = markers.filter(m => m.status && m.status !== 'Normal').length;
  const dateTaken = result.date_taken ? new Date(result.date_taken).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-';
  const resultDate = result.created_at ? new Date(result.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-';

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { paddingHorizontal: spacing.md, paddingTop: spacing.xl, paddingBottom: spacing.md }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Icon name="arrow-back" size={24} color={colors.text} onPress={() => router.back()} />
            <Text style={{ marginLeft: spacing.sm, fontFamily: fonts.bold, fontSize: sizes.font.lg, color: colors.text }}>Test results</Text>
          </View>
          <TouchableOpacity onPress={() => {/* Download file logic */}}>
             <Text style={{ fontFamily: fonts.medium, fontSize: sizes.font.sm, color: colors.primary }}>Download</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: 100 }}>
        {flaggedCount > 0 && (
          <View style={[styles.warningBanner, { backgroundColor: 'rgba(250, 173, 20, 0.1)', borderColor: 'rgba(250, 173, 20, 0.3)', borderWidth: 1, borderRadius: sizes.radius.lg, padding: spacing.md, marginBottom: spacing.md, flexDirection: 'row', alignItems: 'center' }]}>
            <Icon name="important" size={24} color=/* TODO: color */ "#faad14" />
            <View style={{ marginLeft: spacing.sm }}>
              <Text style={{ fontFamily: fonts.bold, fontSize: sizes.font.md, color: /* TODO: color */ '#faad14' }}>{flaggedCount} values outside range</Text>
              <Text style={{ fontFamily: fonts.regular, fontSize: sizes.font.sm, color: colors.textSecondary }}>Consult your doctor</Text>
            </View>
          </View>
        )}

        <View style={[styles.infoCard, { backgroundColor: colors.surface, borderRadius: sizes.radius.lg, padding: spacing.md, marginBottom: spacing.md }]}>
          <View style={[styles.infoRow, { marginBottom: spacing.sm }]}>
            <Text style={{ fontFamily: fonts.regular, fontSize: sizes.font.sm, color: colors.textSecondary }}>Lab:</Text>
            <Text style={{ fontFamily: fonts.medium, fontSize: sizes.font.sm, color: colors.text }}>{result.lab_name || 'Unknown'}</Text>
          </View>
          <View style={[styles.infoRow, { marginBottom: spacing.sm }]}>
            <Text style={{ fontFamily: fonts.regular, fontSize: sizes.font.sm, color: colors.textSecondary }}>Date taken:</Text>
            <Text style={{ fontFamily: fonts.bold, fontSize: sizes.font.sm, color: colors.text }}>{dateTaken}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={{ fontFamily: fonts.regular, fontSize: sizes.font.sm, color: colors.textSecondary }}>Results date:</Text>
            <Text style={{ fontFamily: fonts.bold, fontSize: sizes.font.sm, color: colors.text }}>{resultDate}</Text>
          </View>
        </View>

        <View style={[styles.resultCard, { backgroundColor: colors.surface, borderRadius: sizes.radius.lg, padding: spacing.md }]}>
          <View style={{ marginBottom: spacing.md }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: sizes.font.lg, color: colors.text }}>{result.title}</Text>
            <Text style={{ fontFamily: fonts.regular, fontSize: sizes.font.sm, color: colors.textSecondary }}>{result.category} test • {dateTaken}</Text>
          </View>

          <View style={[styles.tableHeader, { paddingBottom: spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.border }]}>
            <Text style={{ flex: 2, fontFamily: fonts.regular, fontSize: sizes.font.xs, color: colors.textSecondary }}>Name</Text>
            <Text style={{ flex: 1, fontFamily: fonts.regular, fontSize: sizes.font.xs, color: colors.textSecondary }}>Value</Text>
            <Text style={{ flex: 1, fontFamily: fonts.regular, fontSize: sizes.font.xs, color: colors.textSecondary, textAlign: 'right' }}>Unit</Text>
          </View>

          {markers.map((marker, idx) => {
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
              <View key={idx} style={[styles.tableRow, { marginTop: spacing.md }]}>
                <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center' }}>
                  <Icon name={mIcon.name} size={20} color={mIcon.color} wrapped wrapperOpacity={0.1} wrapperSize={36} />
                  <View style={{ marginLeft: spacing.sm }}>
                    <Text style={{ fontFamily: fonts.medium, fontSize: sizes.font.md, color: colors.text }}>{marker.name}</Text>
                    <Text style={{ fontFamily: fonts.regular, fontSize: sizes.font.xs, color: colors.textSecondary }}>{marker.unit}</Text>
                  </View>
                </View>
                <Text style={{ flex: 1, fontFamily: fonts.bold, fontSize: sizes.font.md, color: colors.text }}>{marker.value}</Text>
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  <View style={{ backgroundColor: statusBg, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: sizes.radius.md }}>
                    <Text style={{ fontFamily: fonts.medium, fontSize: sizes.font.xs, color: statusColor }}>
                      {statusIcon}{marker.status || 'Normal'}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.bg, padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border }]}>
        <Button 
          title="Ask doctor about results →" 
          variant="outline"
          onPress={() => {
            // Navigate to doctor chat or consultation creation
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
