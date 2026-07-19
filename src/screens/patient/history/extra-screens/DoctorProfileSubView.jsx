import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useStyles } from '../../../../theme/useStyles';
import { useTheme } from '../../../../theme/ThemeContext';
import { Icon } from '../../../../components/ui/Icon';
import { SegmentedControl } from '../../../../components/ui/SegmentedControl';
import { useComponentContext } from '../../../../context/GlobalContext';
import { useSession } from '../../../../context/SessionContext';
import { createApiClient } from '../../../../api/apiClient';
import { usePatientDashboard } from '../../../../context/PatientDashboardContext';

export function DoctorProfileSubView({ doctorId: id, onBack }) {
  const { sizes, colors } = useTheme();
  const styles = useStyles(themeStyles);
  const { t } = useTranslation();
  const { session, refreshSessionToken } = useSession();
  const api = useMemo(() => createApiClient(session, refreshSessionToken), [session, refreshSessionToken]);
  const { historyController } = useComponentContext();
  const { navigateToHistoryDetail } = usePatientDashboard();

  const [activeTab, setActiveTab] = useState('Profile');
  const [doctorData, setDoctorData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoctorData = async () => {
      try {
        const res = await api.get(`/doctors/${id}`);
        setDoctorData(res);
      } catch (err) {
        console.error('Failed to fetch doctor data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctorData();
  }, [id, api]);

  // Filter patient's past consultations with this specific doctor
  const doctorConsultations = useMemo(() => {
    return (historyController?.pastConsultations || []).filter(c => c.doctorId === id);
  }, [historyController?.pastConsultations, id]);

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
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Icon name="arrow-back" size={sizes.scale(24)} color={colors.white}  />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontFamily: 'Manrope_500Medium', color: colors.n500 }}>Doctor not found.</Text>
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
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Icon name="arrow-back" size={sizes.scale(24)} color={colors.white}  />
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
              <Icon name="star" size={sizes.scale(12)} color={colors.warning}  />
              <Text style={[styles.subText, { marginLeft: sizes.scale(4), marginBottom: sizes.scale(0) }]}>{rating.toFixed(1)} · {t('doctor_history.years_exp', '{{years}} yrs exp', { years: experience })}</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <SegmentedControl
          options={[
            { label: t('doctor_history.tab_profile', 'Profile'), value: 'Profile' },
            { label: t('doctor_history.tab_reviews', 'Reviews'), value: 'Reviews' },
            { label: t('doctor_history.tab_documents', 'Documents'), value: 'Documents' }
          ]}
          value={activeTab}
          onChange={setActiveTab}
          style={styles.segmented}
        />

        {activeTab === 'Profile' && (
          <ProfileTab 
            doctorData={doctorData} 
            consultations={doctorConsultations} 
            onVisitPress={navigateToHistoryDetail} 
          />
        )}
        {activeTab === 'Reviews' && <ReviewsTab doctorId={id} />}
        {activeTab === 'Documents' && <DocumentsTab doctorId={id} />}

      </ScrollView>
    </View>
  );
}

// ---------------- Tabs ----------------

function ProfileTab({ doctorData, consultations, onVisitPress }) {
  const { sizes } = useTheme();
  const styles = useStyles(themeStyles);
  const { t, i18n } = useTranslation();
  const lang = i18n.language === 'ru' ? 'ru-RU' : 'en-US';

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

      <Text style={styles.sectionTitle}>{t('doctor_history.visit_history', 'Visit history with you')}</Text>
      <View style={styles.visitsContainer}>
        {consultations.length > 0 ? consultations.map((c) => {
          const date = new Date(c.date).toLocaleDateString(lang, { month: 'short', day: 'numeric', year: 'numeric' });
          const time = new Date(c.date).toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' });
          const desc = c.diagnosis || c.purpose || t('doctor_history.general_checkup', 'General checkup');

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
            <TouchableOpacity 
              key={c.id} 
              style={styles.visitCard}
              onPress={() => onVisitPress(c.id)}
            >
              <View style={[styles.visitIconBox, { backgroundColor: iconBg }]}>
                <Icon name={iconName} size={sizes.scale(20)} color={iconColor} />
              </View>
              <View style={styles.visitInfo}>
                <Text style={styles.visitDate}>{date} · {time}</Text>
                <Text style={styles.visitDesc}>{desc}</Text>
              </View>
              <Icon name="arrow-right" size={sizes.scale(20)} color={colors.p500}  />
            </TouchableOpacity>
          );
        }) : (
          <View style={{ paddingVertical: sizes.scale(16), alignItems: 'center' }}>
            <Text style={{ fontFamily: 'Manrope_500Medium', color: colors.n500 }}>{t('doctor_history.no_previous_visits', 'No previous visits.')}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function ReviewsTab({ doctorId }) {
  const { sizes } = useTheme();
  const styles = useStyles(themeStyles);
  const { t } = useTranslation();
  
  return (
    <View style={{ paddingVertical: sizes.spacing.xl, alignItems: 'center' }}>
      <Icon name = 'MessageSquare' size={sizes.scale(32)} color={colors.n300} style={{ marginBottom: sizes.spacing.s }}  />
      <Text style={{ fontFamily: 'Manrope_500Medium', color: colors.n500 }}>{t('doctor_history.no_reviews', 'No reviews yet.')}</Text>
    </View>
  );
}

function DocumentsTab({ doctorId }) {
  const { sizes } = useTheme();
  const styles = useStyles(themeStyles);
  const { t } = useTranslation();
  
  return (
    <View style={{ paddingVertical: sizes.spacing.xl, alignItems: 'center' }}>
      <Icon name="note" size={sizes.scale(24)} color={colors.n300} style={{ marginBottom: sizes.spacing.s }}  />
      <Text style={{ fontFamily: 'Manrope_500Medium', color: colors.n500 }}>{t('doctor_history.no_documents_uploaded', 'No documents uploaded.')}</Text>
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
    shadowColor: /* TODO: color */ '#000',
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
  visitsContainer: {
    gap: theme.sizes.spacing.m,
  },
  visitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.medium,
    padding: theme.sizes.spacing.m,
    shadowColor: /* TODO: color */ '#000',
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
  }
});
