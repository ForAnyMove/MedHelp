import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useStyles } from '../../../theme/useStyles';
import { useTheme } from '../../../theme/ThemeContext';
import { useComponentContext } from '../../../context/GlobalContext';
import { useOwnerDashboard } from '../../../context/OwnerDashboardContext';
import { Icon } from '../../../components/ui/Icon';
import { BottomSheet } from '../../../components/ui/BottomSheet';
import { ProfileNotifications } from '../../universal/profile/components/ProfileNotifications';

export function OwnerHomeTab() {
  const styles = useStyles(themeStyles);
  const { sizes, colors } = useTheme();
  const { t } = useTranslation();
  const { user, ownerController, notificationController } = useComponentContext();
  const { setTabIndex, navigateToRequests } = useOwnerDashboard();
  const [isNotificationSheetOpen, setIsNotificationSheetOpen] = React.useState(false);

  const org = ownerController?.organization;
  const pendingCount = ownerController?.pendingRequestsCount || 0;
  const doctorsCount = org?.doctorsCount || 0;
  const firstName = user?.firstName || '';

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{t('owner_home.greeting', { name: firstName })}</Text>
            <Text style={styles.orgName}>{org?.name || t('owner_home.no_org')}</Text>
          </View>
          <TouchableOpacity onPress={() => setIsNotificationSheetOpen(true)} style={styles.notifBtn}>
            <Icon name="notifications" size={sizes.scale(24)} color={colors.p500} />
            {(notificationController?.notifications || []).filter(n => !n.is_read).length > 0 && (
              <View style={styles.notifDot} />
            )}
          </TouchableOpacity>
        </View>

        {/* Org Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Icon name="doctor-01" size={sizes.scale(28)} color={colors.p500} />
            <Text style={styles.statValue}>{doctorsCount}</Text>
            <Text style={styles.statLabel}>{t('owner_home.doctors_count')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Icon name="notifications" size={sizes.scale(28)} color={pendingCount > 0 ? colors.warning || '#F59E0B' : colors.n400} />
            <Text style={[styles.statValue, pendingCount > 0 && styles.statValueHighlight]}>{pendingCount}</Text>
            <Text style={styles.statLabel}>{t('owner_home.requests_count')}</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>{t('owner_home.quick_actions')}</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionCard} onPress={() => setTabIndex(1)}>
            <View style={styles.actionIconWrap}>
              <Icon name="doctor-01" size={sizes.scale(24)} color={colors.p500} />
            </View>
            <Text style={styles.actionTitle}>{t('owner_home.doctors_list')}</Text>
            <Text style={styles.actionDesc}>{t('owner_home.doctors_list_desc', { count: doctorsCount })}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, pendingCount > 0 && styles.actionCardHighlight]}
            onPress={() => { setTabIndex(1); navigateToRequests(); }}
          >
            <View style={[styles.actionIconWrap, pendingCount > 0 && styles.actionIconWrapHighlight]}>
              <Icon name="notifications" size={sizes.scale(24)} color={pendingCount > 0 ? colors.white : colors.p500} />
            </View>
            <Text style={styles.actionTitle}>{t('owner_home.join_requests')}</Text>
            <Text style={styles.actionDesc}>
              {pendingCount > 0
                ? t('owner_home.pending_requests', { count: pendingCount })
                : t('owner_home.no_requests')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => setTabIndex(2)}>
            <View style={styles.actionIconWrap}>
              <Icon name="calendar" size={sizes.scale(24)} color={colors.p500} />
            </View>
            <Text style={styles.actionTitle}>{t('owner_home.calendar')}</Text>
            <Text style={styles.actionDesc}>{t('owner_home.calendar_desc')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => setTabIndex(3)}>
            <View style={styles.actionIconWrap}>
              <Icon name="medic-history" size={sizes.scale(24)} color={colors.p500} />
            </View>
            <Text style={styles.actionTitle}>{t('owner_home.history')}</Text>
            <Text style={styles.actionDesc}>{t('owner_home.history_desc')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <BottomSheet
        visible={isNotificationSheetOpen}
        onClose={() => setIsNotificationSheetOpen(false)}
        initialHeight={sizes.height}
      >
        <ProfileNotifications user={user} onClose={() => setIsNotificationSheetOpen(false)} />
      </BottomSheet>
    </View>
  );
}

const themeStyles = (theme) => ({
  screen: { flex: 1, backgroundColor: theme.colors.bg },
  scrollContent: {
    paddingHorizontal: theme.sizes.spacing.m,
    paddingTop: theme.sizes.spacing.l,
    paddingBottom: theme.sizes.spacing.xl * 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.sizes.spacing.l,
  },
  greeting: {
    ...theme.sizes.typography.h2,
    color: theme.colors.n900,
    fontFamily: 'Manrope_700Bold',
  },
  orgName: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.p500,
    marginTop: theme.sizes.scale(2),
    fontFamily: 'Manrope_600SemiBold',
  },
  notifBtn: {
    position: 'relative',
    padding: theme.sizes.spacing.xs,
  },
  notifDot: {
    position: 'absolute',
    top: theme.sizes.scale(6),
    right: theme.sizes.scale(6),
    width: theme.sizes.scale(8),
    height: theme.sizes.scale(8),
    borderRadius: theme.sizes.scale(4),
    backgroundColor: theme.colors.danger || '#F05252',
    borderWidth: 1.5,
    borderColor: theme.colors.white,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.l,
    marginBottom: theme.sizes.spacing.l,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  statItem: { flex: 1, alignItems: 'center', gap: theme.sizes.scale(4) },
  statDivider: { width: 1, backgroundColor: theme.colors.n200, marginVertical: theme.sizes.scale(4) },
  statValue: {
    ...theme.sizes.typography.h2,
    color: theme.colors.n900,
    fontFamily: 'Manrope_700Bold',
  },
  statValueHighlight: { color: theme.colors.warning || '#F59E0B' },
  statLabel: { ...theme.sizes.typography.caption, color: theme.colors.n500 },
  sectionTitle: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n900,
    fontFamily: 'Manrope_700Bold',
    marginBottom: theme.sizes.spacing.m,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.sizes.spacing.m,
  },
  actionCard: {
    width: '47%',
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.m,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: theme.sizes.scale(6),
  },
  actionCardHighlight: {
    backgroundColor: theme.colors.p100,
    borderWidth: 1.5,
    borderColor: theme.colors.p500,
  },
  actionIconWrap: {
    width: theme.sizes.scale(44),
    height: theme.sizes.scale(44),
    borderRadius: theme.sizes.scale(12),
    backgroundColor: theme.colors.p100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconWrapHighlight: {
    backgroundColor: theme.colors.p500,
  },
  actionTitle: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n900,
    fontFamily: 'Manrope_700Bold',
  },
  actionDesc: { ...theme.sizes.typography.caption, color: theme.colors.n500 },
});
