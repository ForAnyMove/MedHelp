import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { Icon } from '../ui/Icon';
import { useSession } from '../../context/SessionContext';
import { useTranslation } from 'react-i18next';
import { getPatientLabResults } from '../../api/labResultsApi';

export function LabResultsBanner() {
  const { colors, sizes, spacing, fonts } = useTheme();
  const router = useRouter();
  const { session } = useSession();
  const { t } = useTranslation();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await getPatientLabResults(session.user.id);
        if (res && res.data) {
          const unread = res.data.filter(r => r.status === 'ready' && !r.is_viewed).length;
          setUnreadCount(unread);
        }
      } catch (err) {
        console.error(err);
      }
    };
    if (session?.user?.id) fetchResults();
  }, [session]);

  if (unreadCount === 0) return null;

  return (
    <TouchableOpacity 
      style={[styles.banner, { 
        backgroundColor: /* TODO: color */ 'rgba(19, 194, 194, 0.1)',
        borderColor: /* TODO: color */ 'rgba(19, 194, 194, 0.3)',
        borderWidth: 1,
        borderRadius: sizes.radius.lg,
        padding: spacing.md,
        marginBottom: spacing.md
      }]}
      onPress={() => router.push('/lab-results')}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Icon name="files" size={sizes.scale(24)} color=/* TODO: color */ "#13c2c2" />
          <View style={{ marginLeft: spacing.sm }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: sizes.font.md, color: colors.text }}>
              {unreadCount} {t('dashboard.new_lab_results', 'new lab results')}
            </Text>
            <Text style={{ fontFamily: fonts.regular, fontSize: sizes.font.sm, color: colors.textSecondary }}>
              {t('dashboard.ready_for_review', 'Ready for your review')}
            </Text>
          </View>
        </View>
        <Icon name="arrow-right" size={sizes.scale(20)} color=/* TODO: color */ "#13c2c2" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {
    // Basic styles, overriden by theme
  }
});
