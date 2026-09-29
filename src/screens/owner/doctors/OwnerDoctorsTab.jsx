import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useStyles } from '../../../theme/useStyles';
import { useTheme } from '../../../theme/ThemeContext';
import { useComponentContext } from '../../../context/GlobalContext';
import { useOwnerDashboard } from '../../../context/OwnerDashboardContext';
import { Icon } from '../../../components/ui/Icon';
import { EmptyState } from '../../../components/common/EmptyState';
import { OwnerJoinRequestsScreen } from './extra-screens/OwnerJoinRequestsScreen';
import { OwnerDoctorProfileSubView } from './extra-screens/OwnerDoctorProfileSubView';

export function OwnerDoctorsTab() {
  const styles = useStyles(themeStyles);
  const { sizes, colors } = useTheme();
  const { t } = useTranslation();
  const { ownerController } = useComponentContext();
  const { doctorsView, navigateToRequests, navigateToDoctorProfile, navigateBack } = useOwnerDashboard();

  const doctors = ownerController?.doctors || [];
  const pendingCount = ownerController?.pendingRequestsCount || 0;

  // Sub-view rendering
  if (doctorsView === 'requests') {
    return <OwnerJoinRequestsScreen onBack={navigateBack} />;
  }
  if (doctorsView === 'doctor-profile') {
    return <OwnerDoctorProfileSubView onBack={navigateBack} />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('owner_doctors.title')}</Text>
        <TouchableOpacity
          style={[styles.requestsBtn, pendingCount > 0 && styles.requestsBtnActive]}
          onPress={navigateToRequests}
        >
          <Icon
            name="notification"
            size={sizes.scale(18)}
            color={pendingCount > 0 ? colors.white : colors.n400}
          />
          {pendingCount > 0 && (
            <Text style={styles.requestsBtnText}>
              {pendingCount}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {doctors.length === 0 ? (
          <EmptyState
            icon="doctor-01"
            title={t('owner_doctors.no_doctors_title')}
            description={t('owner_doctors.no_doctors_desc')}
          />
        ) : (
          doctors.map((doctor, index) => (
            <TouchableOpacity
              key={doctor.id || doctor.profileId || doctor.requestId || index}
              style={styles.card}
              activeOpacity={0.85}
              onPress={() => navigateToDoctorProfile(doctor.id)}
            >
              {doctor.avatarUrl ? (
                <Image source={{ uri: doctor.avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, { justifyContent: 'center', alignItems: 'center' }]}>
                  <Icon name="profile" size={sizes.scale(24)} color={colors.n400} />
                </View>
              )}
              <View style={styles.cardBody}>
                <Text style={styles.doctorName}>
                  {t('doctors.dr_prefix')}{doctor.fullName}
                </Text>
                <Text style={styles.specialty}>{doctor.specialization || t('common.unknown')}</Text>
                <View style={styles.metaRow}>
                  <Icon name="star" size={sizes.scale(14)} color={colors.warning || '#F59E0B'} />
                  <Text style={styles.metaText}>{(doctor.rating || 0).toFixed(1)}</Text>
                  <Text style={styles.metaSep}>·</Text>
                  <Text style={styles.metaText}>{doctor.experience || 0} {t('doctor_history.years_count', { count: doctor.experience || 0 })}</Text>
                </View>
              </View>
              <Icon name="arrow-forward" size={sizes.scale(20)} color={colors.n400} />
            </TouchableOpacity>
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
  title: {
    ...theme.sizes.typography.h2,
    color: theme.colors.n900,
    fontFamily: 'Manrope_700Bold',
  },
  requestsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.sizes.scale(4),
    backgroundColor: theme.colors.n200,
    borderRadius: theme.sizes.borderRadius.full,
    paddingHorizontal: theme.sizes.spacing.m,
    paddingVertical: theme.sizes.spacing.s,
  },
  requestsBtnActive: {
    backgroundColor: theme.colors.p500,
  },
  requestsBtnText: {
    ...theme.sizes.typography.bodySmall,
    color: theme.colors.white,
    fontFamily: 'Manrope_700Bold',
  },
  scrollContent: {
    paddingHorizontal: theme.sizes.spacing.m,
    paddingBottom: theme.sizes.spacing.xl * 2,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.m,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.sizes.scale(4),
  },
  metaText: { ...theme.sizes.typography.caption, color: theme.colors.n500 },
  metaSep: { ...theme.sizes.typography.caption, color: theme.colors.n300 },
});
