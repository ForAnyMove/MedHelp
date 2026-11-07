import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { Icon } from '../ui/Icon';
import { useSession } from '../../context/SessionContext';
import { useTranslation } from 'react-i18next';
import { createApiClient } from '../../api/apiClient';
import { createLabResultsApi } from '../../api/labResultsApi';

export function LabResultsBanner() {
  const { colors, sizes } = useTheme();
  const router = useRouter();
  const { session, refreshSessionToken } = useSession();
  const { t } = useTranslation();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const userId = session?.userId || session?.user?.id;
    if (!userId) return;

    const fetchResults = async () => {
      try {
        const api = createApiClient(session, refreshSessionToken);
        const labApi = createLabResultsApi(api);
        const res = await labApi.getPatientLabResults(userId);
        const list = Array.isArray(res) ? res : (res?.data || []);
        const unread = list.filter(r => r.status === 'ready' && !r.is_viewed).length;
        setUnreadCount(unread);
      } catch (err) {
        // Ignore if endpoint is not available or empty
      }
    };
    fetchResults();
  }, [session?.userId, session?.user?.id]);

  if (unreadCount === 0) return null;

  return (
    <TouchableOpacity 
      style={[styles.banner, { 
        backgroundColor: 'rgba(19, 194, 194, 0.1)',
        borderColor: 'rgba(19, 194, 194, 0.3)',
        borderWidth: 1,
        borderRadius: sizes.borderRadius.large,
        padding: sizes.spacing.m,
        marginBottom: sizes.spacing.m
      }]}
      onPress={() => router.push('/(patient)/lab-results')}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Icon name="files" size={sizes.scale(24)} color="#13c2c2" />
          <View style={{ marginLeft: sizes.spacing.s }}>
            <Text style={{ ...sizes.typography.bodyMedium, fontFamily: 'Manrope_700Bold', color: colors.n900 }}>
              {unreadCount} {t('dashboard.new_lab_results', 'new lab results')}
            </Text>
            <Text style={{ ...sizes.typography.bodySmall, color: colors.n500 }}>
              {t('dashboard.ready_for_review', 'Ready for your review')}
            </Text>
          </View>
        </View>
        <Icon name="arrow-right" size={sizes.scale(20)} color="#13c2c2" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {}
});
