import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, Platform, Alert, Modal } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useStyles } from '../../../../theme/useStyles';
import { useTheme } from '../../../../theme/ThemeContext';
import { Icon } from '../../../../components/ui/Icon';
import { SegmentedControl } from '../../../../components/ui/SegmentedControl';
import { useComponentContext } from '../../../../context/GlobalContext';
import { useSession } from '../../../../context/SessionContext';
import { createApiClient } from '../../../../api/apiClient';
import { useOwnerDashboard } from '../../../../context/OwnerDashboardContext';

/**
 * Doctor profile viewed by an owner.
 * Uses the exact same visual structure as DoctorProfileSubView but adapts visitsContainer:
 * - For doctors NOT yet confirmed in org → no visits block
 * - For confirmed doctors → shows their consultation history from ownerController.consultations
 */
export function OwnerDoctorProfileSubView({ onBack }) {
  const { sizes, colors } = useTheme();
  const styles = useStyles(themeStyles);
  const { t } = useTranslation();
  const { session, refreshSessionToken } = useSession();
  const api = useMemo(() => createApiClient(session, refreshSessionToken), [session, refreshSessionToken]);
  const { selectedDoctorId, setView, setSelectedDoctorId, navigateToRequests, navigateToDoctorsList } = useOwnerDashboard();
  const { ownerController } = useComponentContext();

  const [activeTab, setActiveTab] = useState('Profile');
  const [doctorData, setDoctorData] = useState(null);
  const [loading, setLoading] = useState(true);

  const id = selectedDoctorId;

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get(`/doctors/${id}`)
      .then(res => setDoctorData(res))
      .catch(err => console.error('OwnerDoctorProfileSubView: fetchDoctorData error', err))
      .finally(() => setLoading(false));
  }, [id, api]);

  // Check if this doctor is confirmed (accepted) in the org
  const isConfirmedMember = useMemo(() => {
    return (ownerController?.doctors || []).some(d => d.id === id);
  }, [ownerController?.doctors, id]);

  // Get this doctor's consultations from org data
  const doctorConsultations = useMemo(() => {
    return (ownerController?.consultations || []).filter(c => c.doctorId === id);
  }, [ownerController?.consultations, id]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.p500} />
      </View>
    );
  }

  if (!doctorData) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigateToDoctorsList()} style={styles.backButton}>
            <Icon name="arrow-back" size={sizes.scale(24)} color={colors.white} />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontFamily: 'Manrope_500Medium', color: colors.n500 }}>{t('doctor_history.doctor_not_found', 'Doctor not found.')}</Text>
        </View>
      </View>
    );
  }

  const name = `${doctorData.firstName || ''} ${doctorData.lastName || ''}`.trim() || 'Unknown';
  const avatar = doctorData.avatarUrl;
  const rating = doctorData.rating || 0;
  const experience = doctorData.experience || 0;

  return (
    <View style={styles.container}>
      {/* Header Area */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => isConfirmedMember ? navigateToDoctorsList() : navigateToRequests()} style={styles.backButton}>
            <Icon name="arrow-back" size={sizes.scale(24)} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('doctor_history.doctor_profile', 'Doctor profile')}</Text>
        </View>

        <View style={styles.profileInfoRow}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>{name.charAt(0)}</Text>
            </View>
          )}

          <View style={styles.infoCol}>
            <Text style={styles.nameText}>{name}</Text>
            <Text style={styles.subText}>{doctorData.specialization || t('doctor_history.specialist', 'Specialist')}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: sizes.scale(4) }}>
              <Icon name="star" size={sizes.scale(12)} color={colors.warning} />
              <Text style={[styles.subText, { marginLeft: sizes.scale(4), marginBottom: sizes.scale(0) }]}>{rating.toFixed(1)} · {t('doctor_history.years_exp', '{{years}} yrs exp', { years: experience })}</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <SegmentedControl
          options={[
            { label: t('doctor_history.tab_profile', 'Profile'), value: 'Profile' },
            { label: t('doctor_history.tab_reviews', 'Reviews'), value: 'Reviews' }
          ]}
          value={activeTab}
          onChange={setActiveTab}
          style={styles.segmented}
        />

        {activeTab === 'Profile' && (
          <ProfileTab
            doctorData={doctorData}
            consultations={doctorConsultations}
            isConfirmedMember={isConfirmedMember}
            ownerController={ownerController}
            doctorId={id}
            onBack={() => {
              if (isConfirmedMember) {
                navigateToDoctorsList();
              } else {
                navigateToRequests();
              }
            }}
          />
        )}
        {activeTab === 'Reviews' && <ReviewsTab doctorId={id} />}

      </ScrollView>
    </View>
  );
}

// ---------------- Tabs ----------------

function ProfileTab({ doctorData, consultations, isConfirmedMember, ownerController, doctorId, onBack }) {
  const { sizes, colors } = useTheme();
  const styles = useStyles(themeStyles);
  const { t, i18n } = useTranslation();
  const lang = i18n.language === 'ru' ? 'ru-RU' : 'en-US';
  const [isRemoving, setIsRemoving] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleRemoveDoctor = () => setShowConfirmModal(true);

  const proceedRemove = async () => {
    if (ownerController?.removeDoctor) {
      setIsRemoving(true);
      const res = await ownerController.removeDoctor(doctorId);
      setIsRemoving(false);
      if (res.success) {
        setShowConfirmModal(false);
        onBack();
      } else {
        setShowConfirmModal(false);
        Alert.alert(t('common.error', 'Error'), res.error);
      }
    }
  };

  const renderInfoRow = (label, value) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );

  return (
    <View>
      <Text style={styles.sectionTitle}>{t('doctor_history.about', 'About')}</Text>
      <View style={styles.card}>
        <Text style={styles.bioText}>{doctorData.description || t('doctor_history.no_description', 'No description provided.')}</Text>
      </View>

      <Text style={styles.sectionTitle}>{t('doctor_history.details', 'Details')}</Text>
      <View style={styles.card}>
        {renderInfoRow(t('doctor_history.specialty', 'Specialty:'), doctorData.specialization === 'General' ? t('doctor_history.general', 'General') : doctorData.specialization || t('doctor_history.general', 'General'))}
        <View style={styles.divider} />
        {renderInfoRow(t('doctor_history.experience', 'Experience:'), t('doctor_history.years_count', '{{count}} years', { count: doctorData.experience || 0 }))}
        <View style={styles.divider} />
        {renderInfoRow(t('doctor_history.consultation_price', 'Consultation price:'), `$${doctorData.price || 0}`)}
      </View>

      {isConfirmedMember && (
        <>
          <TouchableOpacity
            style={[styles.removeBtn, isRemoving && { opacity: 0.7 }]}
            onPress={handleRemoveDoctor}
            disabled={isRemoving}
            activeOpacity={0.8}
          >
            {isRemoving ? (
              <ActivityIndicator size="small" color={colors.danger} />
            ) : (
              <>
                <Icon name="close" size={sizes.scale(18)} color={colors.danger} />
                <Text style={styles.removeBtnText}>{t('owner_doctors.remove_doctor_btn', 'Remove from Organization')}</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>{t('owner_doctors.doctor_consultations', 'Consultations')}</Text>
          <View style={styles.visitsContainer}>
            {consultations.length > 0 ? consultations.map((c) => {
              const date = c.date ? new Date(c.date).toLocaleDateString(lang, { month: 'short', day: 'numeric', year: 'numeric' }) : '';
              const time = c.date ? new Date(c.date).toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' }) : '';
              const desc = c.patientName || t('common.unknown', 'Unknown');

              let iconName = 'stethoscope';
              let iconColor = colors.p500;
              let iconBg = colors.p100;

              if (c.status === 'scheduled') {
                iconName = 'calendar';
                iconColor = colors.info || colors.info;
                iconBg = (colors.info || colors.info) + '22';
              } else if (c.status === 'canceled') {
                iconName = 'CalendarX';
                iconColor = colors.danger || colors.danger;
                iconBg = (colors.danger || colors.danger) + '22';
              }

              return (
                <View
                  key={c.id}
                  style={styles.visitCard}
                >
                  <View style={[styles.visitIconBox, { backgroundColor: iconBg }]}>
                    <Icon name={iconName} size={sizes.scale(20)} color={iconColor} />
                  </View>
                  <View style={styles.visitInfo}>
                    <Text style={styles.visitDate}>{date} {time ? `· ${time}` : ''}</Text>
                    <Text style={styles.visitDesc}>{desc}</Text>
                  </View>
                  <View style={[styles.statusBadge, c.status === 'completed' && styles.statusCompleted, c.status === 'canceled' && styles.statusCanceled]}>
                    <Text style={styles.statusText}>{t(`doctor_history.status_${c.status}`) || c.status}</Text>
                  </View>
                </View>
              );
            }) : (
              <View style={{ paddingVertical: sizes.scale(16), alignItems: 'center' }}>
                <Text style={{ fontFamily: 'Manrope_500Medium', color: colors.n500 }}>{t('doctor_history.no_previous_visits', 'No previous visits.')}</Text>
              </View>
            )}
          </View>
        </>
      )}

      {/* Confirmation Modal */}
      <Modal 
        visible={showConfirmModal} 
        transparent={true} 
        animationType="fade" 
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('owner_doctors.remove_doctor_title', 'Remove Doctor')}</Text>
            <Text style={styles.modalDesc}>{t('owner_doctors.remove_doctor_confirm', 'Are you sure you want to remove this doctor from your organization?')}</Text>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalCancelBtn} 
                onPress={() => setShowConfirmModal(false)}
                disabled={isRemoving}
              >
                <Text style={styles.modalCancelText}>{t('common.cancel', 'Cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalConfirmBtn} 
                onPress={proceedRemove} 
                disabled={isRemoving}
              >
                {isRemoving ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Text style={styles.modalConfirmText}>{t('common.yes', 'Yes')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function ReviewsTab({ doctorId }) {
  const { sizes, colors } = useTheme();
  const styles = useStyles(themeStyles);
  const { t } = useTranslation();

  return (
    <View style={{ paddingVertical: sizes.spacing.xl, alignItems: 'center' }}>
      <Icon name='MessageSquare' size={sizes.scale(32)} color={colors.n300} style={{ marginBottom: sizes.spacing.s }} />
      <Text style={{ fontFamily: 'Manrope_500Medium', color: colors.n500 }}>{t('doctor_history.no_reviews', 'No reviews yet.')}</Text>
    </View>
  );
}

// ---------------- Styles ----------------

const themeStyles = (theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  header: {
    backgroundColor: theme.colors.p400,
    paddingTop: theme.sizes.spacing.xxl + 10,
    paddingBottom: theme.sizes.spacing.l,
    borderBottomLeftRadius: theme.sizes.borderRadius.large,
    borderBottomRightRadius: theme.sizes.borderRadius.large,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.l,
  },
  backButton: {
    padding: theme.sizes.spacing.xs,
    marginRight: theme.sizes.spacing.s,
  },
  headerTitle: {
    flex: 1,
    fontFamily: 'Manrope_700Bold',
    fontSize: theme.sizes.scale(22),
    color: theme.colors.white,
  },
  profileInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.sizes.spacing.m,
  },
  avatar: {
    width: theme.sizes.scale(64),
    height: theme.sizes.scale(64),
    borderRadius: theme.sizes.scale(32),
    marginRight: theme.sizes.spacing.m,
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  avatarPlaceholder: {
    backgroundColor: theme.colors.p200,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: theme.colors.p100,
  },
  avatarText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: theme.sizes.scale(28),
    color: theme.colors.p500,
  },
  infoCol: {
    flex: 1,
  },
  nameText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: theme.sizes.scale(18),
    color: theme.colors.white,
    marginBottom: theme.sizes.scale(4),
  },
  subText: {
    fontFamily: 'Manrope_500Medium',
    fontSize: theme.sizes.scale(13),
    color: theme.colors.white,
    opacity: 0.9,
    marginBottom: theme.sizes.scale(2),
  },
  scrollContent: {
    padding: theme.sizes.spacing.m,
    paddingBottom: theme.sizes.spacing.xxl,
  },
  segmented: {
    marginBottom: theme.sizes.spacing.l,
    marginTop: theme.sizes.spacing.xs,
  },
  sectionTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: theme.sizes.scale(18),
    color: theme.colors.n900,
    marginBottom: theme.sizes.spacing.m,
    marginTop: theme.sizes.spacing.m,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    paddingHorizontal: theme.sizes.spacing.m,
    paddingVertical: theme.sizes.spacing.m,
    shadowColor: '#000',
    shadowOffset: { width: theme.sizes.scale(0), height: theme.sizes.scale(4) },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  bioText: {
    fontFamily: 'Manrope_500Medium',
    fontSize: theme.sizes.scale(14),
    color: theme.colors.n700,
    lineHeight: theme.sizes.scale(22),
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.sizes.spacing.s,
  },
  infoLabel: {
    fontFamily: 'Manrope_500Medium',
    fontSize: theme.sizes.scale(14),
    color: theme.colors.n400,
  },
  infoValue: {
    fontFamily: 'Manrope_700Bold',
    fontSize: theme.sizes.scale(14),
    color: theme.colors.n900,
    maxWidth: '60%',
    textAlign: 'right',
  },
  divider: {
    height: theme.sizes.scale(1),
    backgroundColor: theme.colors.n200,
  },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.sizes.scale(8),
    marginTop: theme.sizes.spacing.xl,
    paddingVertical: theme.sizes.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.danger || '#F05252',
    borderRadius: theme.sizes.borderRadius.large,
    backgroundColor: (theme.colors.danger || '#F05252') + '11',
  },
  removeBtnText: {
    fontFamily: 'Manrope_700Bold',
    color: theme.colors.danger || '#F05252',
  },
  visitsContainer: {
    gap: theme.sizes.spacing.m,
  },
  visitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.medium,
    padding: theme.sizes.spacing.m,
    shadowColor: '#000',
    shadowOffset: { width: theme.sizes.scale(0), height: theme.sizes.scale(2) },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  visitIconBox: {
    width: theme.sizes.scale(40),
    height: theme.sizes.scale(40),
    borderRadius: theme.sizes.borderRadius.small,
    backgroundColor: theme.colors.p100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.sizes.spacing.m,
  },
  visitInfo: {
    flex: 1,
  },
  visitDate: {
    fontFamily: 'Manrope_700Bold',
    fontSize: theme.sizes.scale(15),
    color: theme.colors.n900,
    marginBottom: theme.sizes.scale(2),
  },
  visitDesc: {
    fontFamily: 'Manrope_500Medium',
    fontSize: theme.sizes.scale(13),
    color: theme.colors.n500,
  },
  statusBadge: {
    paddingHorizontal: theme.sizes.spacing.s,
    paddingVertical: theme.sizes.scale(3),
    borderRadius: theme.sizes.borderRadius.full,
    backgroundColor: theme.colors.n200,
  },
  statusCompleted: { backgroundColor: theme.colors.success100 || '#D1FAE5' },
  statusCanceled: { backgroundColor: theme.colors.danger100 || '#FEE2E2' },
  statusText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: theme.sizes.scale(12),
    color: theme.colors.n700
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.sizes.spacing.l,
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.xl,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalTitle: {
    ...theme.sizes.typography.h4,
    fontFamily: 'Manrope_700Bold',
    color: theme.colors.n900,
    marginBottom: theme.sizes.spacing.s,
    textAlign: 'center',
  },
  modalDesc: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n600,
    textAlign: 'center',
    marginBottom: theme.sizes.spacing.xl,
  },
  modalActions: {
    flexDirection: 'row',
    gap: theme.sizes.spacing.m,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: theme.sizes.spacing.m,
    borderRadius: theme.sizes.borderRadius.medium,
    backgroundColor: theme.colors.n100,
    alignItems: 'center',
  },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: theme.sizes.spacing.m,
    borderRadius: theme.sizes.borderRadius.medium,
    backgroundColor: theme.colors.danger || '#F05252',
    alignItems: 'center',
  },
  modalCancelText: {
    ...theme.sizes.typography.bodyMedium,
    fontFamily: 'Manrope_600SemiBold',
    color: theme.colors.n700,
  },
  modalConfirmText: {
    ...theme.sizes.typography.bodyMedium,
    fontFamily: 'Manrope_600SemiBold',
    color: theme.colors.white,
  },
});
