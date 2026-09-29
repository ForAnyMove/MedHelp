import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useStyles } from '../../../../theme/useStyles';
import { useTheme } from '../../../../theme/ThemeContext';
import { useComponentContext } from '../../../../context/GlobalContext';
import { useOwnerDashboard } from '../../../../context/OwnerDashboardContext';
import { Icon } from '../../../../components/ui/Icon';
import { EmptyState } from '../../../../components/common/EmptyState';
import { Button } from '../../../../components/ui/Button';

export function OwnerJoinRequestsScreen({ onBack }) {
  const styles = useStyles(themeStyles);
  const { sizes, colors } = useTheme();
  const { t } = useTranslation();
  const { ownerController } = useComponentContext();
  const { navigateToDoctorProfile } = useOwnerDashboard();

  const joinRequests = ownerController?.joinRequests || [];
  const acceptRequest = ownerController?.acceptRequest;
  const rejectRequest = ownerController?.rejectRequest;

  const handleAccept = async (request) => {
    const result = await acceptRequest(request.requestId);
    if (!result.success) {
      Alert.alert(t('common.error'), result.error);
    }
  };

  const handleReject = async (request) => {
    const result = await rejectRequest(request.requestId);
    if (!result.success) {
      Alert.alert(t('common.error'), result.error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Icon name="arrow-back" size={sizes.scale(24)} color={colors.p500} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('owner_doctors.requests_title')}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {joinRequests.length === 0 ? (
          <EmptyState
            icon="notification"
            title={t('owner_doctors.no_requests_title')}
            description={t('owner_doctors.no_requests_desc')}
          />
        ) : (
          joinRequests.map((request) => (
            <View
              key={request.requestId}
              style={styles.card}
            >
              <TouchableOpacity
                style={styles.cardTop}
                activeOpacity={0.7}
                onPress={() => navigateToDoctorProfile(request.doctorId)}
              >
                {request.avatarUrl ? (
                  <Image source={{ uri: request.avatarUrl }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, { justifyContent: 'center', alignItems: 'center' }]}>
                    <Icon name="profile" size={sizes.scale(24)} color={colors.n400} />
                  </View>
                )}
                <View style={styles.cardBody}>
                  <Text style={styles.doctorName}>{t('doctors.dr_prefix')}{request.fullName}</Text>
                  <Text style={styles.specialty}>{request.specialization || t('common.unknown')}</Text>
                  <View style={styles.metaRow}>
                    <Icon name="star" size={sizes.scale(14)} color={colors.warning || '#F59E0B'} />
                    <Text style={styles.metaText}>{(request.rating || 0).toFixed(1)}</Text>
                    <Text style={styles.metaSep}>·</Text>
                    <Text style={styles.metaText}>{request.experience || 0} {t('doctor_history.years_count', { count: request.experience || 0 })}</Text>
                  </View>
                </View>
                <Icon name="arrow-forward" size={sizes.scale(20)} color={colors.n400} />
              </TouchableOpacity>

              {/* Action buttons - don't propagate press to card */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.rejectBtn}
                  onPress={() => handleReject(request)}
                  activeOpacity={0.8}
                >
                  <Icon name="close" size={sizes.scale(18)} color={colors.danger || '#F05252'} />
                  <Text style={styles.rejectBtnText}>{t('owner_doctors.reject_btn')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.acceptBtn}
                  onPress={() => handleAccept(request)}
                  activeOpacity={0.8}
                >
                  <Icon name="check2" size={sizes.scale(18)} color={colors.white} />
                  <Text style={styles.acceptBtnText}>{t('owner_doctors.accept_btn')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const themeStyles = (theme) => ({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.sizes.spacing.m,
    paddingTop: theme.sizes.spacing.l,
    paddingBottom: theme.sizes.spacing.m,
  },
  backBtn: {
    padding: theme.sizes.spacing.xs,
    width: theme.sizes.scale(40),
  },
  title: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n900,
    fontFamily: 'Manrope_700Bold',
    flex: 1,
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: theme.sizes.spacing.m,
    paddingBottom: theme.sizes.spacing.xl * 2,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.m,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: theme.sizes.spacing.m,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: theme.sizes.scale(52),
    height: theme.sizes.scale(52),
    borderRadius: theme.sizes.scale(26),
    marginRight: theme.sizes.spacing.m,
    backgroundColor: theme.colors.n200,
  },
  cardBody: { flex: 1 },
  doctorName: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n900,
    fontFamily: 'Manrope_700Bold',
    marginBottom: theme.sizes.scale(2),
  },
  specialty: {
    ...theme.sizes.typography.caption,
    color: theme.colors.p500,
    marginBottom: theme.sizes.scale(4),
    fontFamily: 'Manrope_600SemiBold',
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: theme.sizes.scale(4) },
  metaText: { ...theme.sizes.typography.caption, color: theme.colors.n500 },
  metaSep: { ...theme.sizes.typography.caption, color: theme.colors.n300 },
  actionRow: {
    flexDirection: 'row',
    gap: theme.sizes.spacing.m,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.sizes.scale(6),
    paddingVertical: theme.sizes.spacing.m,
    borderRadius: theme.sizes.borderRadius.medium,
    borderWidth: 1.5,
    borderColor: theme.colors.danger || '#F05252',
  },
  rejectBtnText: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.danger || '#F05252',
    fontFamily: 'Manrope_600SemiBold',
  },
  acceptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.sizes.scale(6),
    paddingVertical: theme.sizes.spacing.m,
    borderRadius: theme.sizes.borderRadius.medium,
    backgroundColor: theme.colors.p500,
  },
  acceptBtnText: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.white,
    fontFamily: 'Manrope_700Bold',
  },
});
