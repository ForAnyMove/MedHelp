import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useStyles } from '../../../../theme/useStyles';
import { useTheme } from '../../../../theme/ThemeContext';
import { Icon } from '../../../../components/ui/Icon';
import { SegmentedControl } from '../../../../components/ui/SegmentedControl';
import { useComponentContext } from '../../../../context/GlobalContext';
import { useSession } from '../../../../context/SessionContext';
import { createApiClient } from '../../../../api/apiClient';
import { createLabResultsApi } from '../../../../api/labResultsApi';
import { useDoctorDashboard } from '../../../../context/DoctorDashboardContext';

// We'll separate the tabs into components below to keep it organized

export function PatientProfileSubView({ patientId: id, onBack }) {
  const { sizes, colors } = useTheme();
  const styles = useStyles(themeStyles);
  const { t, i18n } = useTranslation();
  const { consultationController } = useComponentContext();
  const lang = i18n.language === 'ru' ? 'ru-RU' : 'en-US';

  const [activeTab, setActiveTab] = useState('Profile');

  // Extract patient data from consultations
  const patientData = useMemo(() => {
    const consultations = consultationController?.allConsultations || [];
    const patientConsults = consultations.filter(c => c.patient_profile_id === id);

    if (patientConsults.length === 0) return null;

    const profile = patientConsults[0].patient;
    const sorted = [...patientConsults].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return {
      id,
      profile,
      visitsCount: patientConsults.length,
      lastVisit: sorted[0].created_at,
      consultations: sorted,
    };
  }, [id, consultationController?.allConsultations]);

  if (!patientData) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.p500} />
      </View>
    );
  }

  const name = `${patientData.profile?.first_name || ''} ${patientData.profile?.last_name || ''}`.trim() || 'Unknown';

  const calculateAge = (dobString) => {
    if (!dobString) return '?';
    const dob = new Date(dobString);
    const diff = Date.now() - dob.getTime();
    return Math.abs(new Date(diff).getUTCFullYear() - 1970);
  };

  const age = calculateAge(patientData.profile?.date_of_birth);
  const gender = patientData.profile?.gender === 'male' ? t('common.male', 'Male') : (patientData.profile?.gender === 'female' ? t('common.female', 'Female') : t('common.unknown', 'Unknown'));
  const avatar = patientData.profile?.avatar_url;

  const formatDate = (dateObj) => {
    if (!dateObj) return '';
    return new Date(dateObj).toLocaleDateString(lang, { month: 'short', day: 'numeric' });
  };

  return (
    <View style={styles.container}>
      {/* Header Area */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Icon name="arrow-back" size={sizes.scale(24)} color={colors.white}  />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('doctor_history.patient_profile', 'Patient profile')}</Text>
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
            <Text style={styles.subText}>{t('doctor_history.years_old', '{{age}} y.o.', { age })} · {gender}</Text>
            <Text style={styles.subText}>{t('doctor_history.last_visit', 'Last · {{date}}', { date: formatDate(patientData.lastVisit) })}</Text>
          </View>

          <View style={styles.visitsBadge}>
            <Text style={styles.visitsText}>{t('doctor_history.visits_count', '{{count}} visits', { count: patientData.visitsCount })}</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <SegmentedControl
          options={[
            { label: t('doctor_history.tab_profile', 'Profile'), value: 'Profile' },
            { label: t('doctor_history.tab_lab_results', 'Lab results'), value: 'Lab results' },
            { label: t('doctor_history.tab_documents', 'Documents'), value: 'Documents' }
          ]}
          value={activeTab}
          onChange={setActiveTab}
          style={styles.segmented}
        />

        {activeTab === 'Profile' && <ProfileTab patientData={patientData} />}
        {activeTab === 'Lab results' && <LabResultsTab patientId={id} />}
        {activeTab === 'Documents' && <DocumentsTab patientData={patientData} />}

      </ScrollView>
    </View>
  );
}

// ---------------- Profile Tab ----------------

function ProfileTab({ patientData }) {
  const { sizes, colors } = useTheme();
  const styles = useStyles(themeStyles);
  const { t, i18n } = useTranslation();
  const { session, refreshSessionToken } = useSession();
  const api = useMemo(() => createApiClient(session, refreshSessionToken), [session, refreshSessionToken]);
  const { navigateToHistoryDetail } = useDoctorDashboard();
  const lang = i18n.language === 'ru' ? 'ru-RU' : 'en-US';

  const [medicalData, setMedicalData] = useState({
    conditions: [],
    allergies: [],
    medications: [],
    loading: true
  });

  useEffect(() => {
    const fetchMedicalData = async () => {
      try {
        const res = await api.get(`/patients/${patientData.id}/medical-profile`);
        const { conditions, allergies, medications } = res;

        const extractNames = (arr, relation) => arr?.map(item => item.custom_name || item[relation]?.en || item[relation]?.ru) || [];

        setMedicalData({
          conditions: extractNames(conditions, 'condition_translations'),
          allergies: extractNames(allergies, 'allergy_translations'),
          medications: extractNames(medications, 'medication_translations'),
          loading: false
        });
      } catch (err) {
        console.error('Failed to fetch medical data:', err);
        setMedicalData(prev => ({ ...prev, loading: false }));
      }
    };
    fetchMedicalData();
  }, [patientData.id, api]);

  const profile = patientData.profile || {};
  const patientProfiles = profile.patient_profiles?.[0] || {};

  const dob = profile.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString(lang).replace(/\//g, '.') : 'Unknown';
  const height = patientProfiles.height ? `${patientProfiles.height} cm` : '--';
  const weight = patientProfiles.weight ? `${patientProfiles.weight} kg` : '--';
  const blood = patientProfiles.blood_type || 'Unknown';
  const genderStr = profile.gender ? (profile.gender === 'male' ? t('common.male', 'Male') : (profile.gender === 'female' ? t('common.female', 'Female') : t('common.unknown', 'Unknown'))) : t('common.unknown', 'Unknown');

  const renderInfoRow = (label, value, isDanger = false) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, isDanger && { color: colors.danger }]}>{value}</Text>
    </View>
  );

  return (
    <View>
      <Text style={styles.sectionTitle}>{t('doctor_history.personal_info', 'Personal info')}</Text>
      <View style={styles.card}>
        {renderInfoRow(t('doctor_history.date_of_birth', 'Date of birth:'), dob)}
        <View style={styles.divider} />
        {renderInfoRow(t('doctor_history.gender', 'Gender:'), genderStr)}
        <View style={styles.divider} />
        {renderInfoRow(t('doctor_history.height_weight', 'Height/Weight:'), `${height} / ${weight}`)}
        <View style={styles.divider} />
        {renderInfoRow(t('doctor_history.blood_type', 'Blood type:'), blood)}
      </View>

      <Text style={styles.sectionTitle}>{t('doctor_history.medical_data', 'Medical data')}</Text>
      <View style={styles.card}>
        {medicalData.loading ? (
          <ActivityIndicator size="small" color={colors.p500} style={{ padding: sizes.spacing.m }} />
        ) : (
          <>
            {renderInfoRow(t('doctor_history.chronic_conditions', 'Chronic conditions:'), medicalData.conditions.length > 0 ? medicalData.conditions.join(', ') : t('doctor_history.not_detected', 'Not detected'), false)}
            <View style={styles.divider} />
            {renderInfoRow(t('doctor_history.allergies', 'Allergies:'), medicalData.allergies.length > 0 ? medicalData.allergies.join(', ') : t('doctor_history.not_detected', 'Not detected'), medicalData.allergies.length > 0)}
            <View style={styles.divider} />
            {renderInfoRow(t('doctor_history.medications', 'Medications:'), medicalData.medications.length > 0 ? medicalData.medications.join(', ') : t('doctor_history.not_detected', 'Not detected'), false)}
            <View style={styles.divider} />
            {renderInfoRow(t('doctor_history.pregnancy', 'Pregnancy:'), profile.gender === 'female' ? t('common.no', 'No') : t('common.na', 'N/A'))}
          </>
        )}
      </View>

      <Text style={styles.sectionTitle}>{t('doctor_history.visit_history', 'Visit history with you')}</Text>
      <View style={styles.visitsContainer}>
        {patientData.consultations.map((c, i) => {
          const date = new Date(c.created_at).toLocaleDateString(lang, { month: 'short', day: 'numeric', year: 'numeric' });
          const time = new Date(c.created_at).toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' });
          const desc = c.results?.[0]?.diagnosis || c.purpose || t('doctor_history.general_checkup', 'General checkup');

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
              onPress={() => navigateToHistoryDetail(c.id)}
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
        })}
      </View>
    </View>
  );
}

// ---------------- Lab Results Tab ----------------

function LabResultsTab({ patientId }) {
  const { sizes, colors } = useTheme();
  const styles = useStyles(themeStyles);
  const { t, i18n } = useTranslation();
  const { session, refreshSessionToken } = useSession();
  const labApi = useMemo(() => createLabResultsApi(createApiClient(session, refreshSessionToken)), [session, refreshSessionToken]);
  const lang = i18n.language === 'ru' ? 'ru-RU' : 'en-US';

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const data = await labApi.getPatientLabResults(patientId);
        setResults(data || []);
      } catch (err) {
        console.error('Failed to fetch lab results', err);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [patientId, labApi]);

  if (loading) {
    return <ActivityIndicator size="large" color={colors.p500} style={{ padding: sizes.spacing.xl }} />;
  }

  if (results.length === 0) {
    return (
      <View style={{ paddingVertical: sizes.spacing.xl, alignItems: 'center' }}>
        <Text style={{ fontFamily: 'Manrope_500Medium', color: colors.n500 }}>{t('doctor_history.no_lab_results', 'No lab results found.')}</Text>
      </View>
    );
  }

  // Group by date (Latest, Earlier)
  const sorted = [...results].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const latestDate = new Date(sorted[0].created_at).toLocaleDateString(lang, { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <View style={styles.tabContainer}>
      <Text style={styles.sectionTitle}>{t('doctor_history.latest', 'Latest')} · {latestDate}</Text>
      {sorted.map(res => (
        <View key={res.id} style={styles.labCard}>
          <View style={styles.labCardHeader}>
            <Text style={styles.labTitle}>{res.title}</Text>
            <Text style={styles.labSubtitle}>{t('doctor_history.lab_test', 'Lab test')} · {new Date(res.created_at).toLocaleDateString(lang, { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
          </View>

          <Text style={styles.labDesc}>{res.description}</Text>

          <View style={styles.labStatusRow}>
            <View style={[styles.labStatusBadge, { backgroundColor: res.status === 'ready' ? colors.success + '20' : colors.warning + '20' }]}>
              <Text style={[styles.labStatusText, { color: res.status === 'ready' ? colors.success : colors.warning }]}>
                {res.status === 'ready' ? t('doctor_history.ready', 'Ready') : t('doctor_history.pending', 'Pending')}
              </Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

// ---------------- Documents Tab ----------------

function DocumentsTab({ patientData }) {
  const { sizes, colors } = useTheme();
  const styles = useStyles(themeStyles);
  const { t, i18n } = useTranslation();
  const { session, refreshSessionToken } = useSession();
  const labApi = useMemo(() => createLabResultsApi(createApiClient(session, refreshSessionToken)), [session, refreshSessionToken]);
  const lang = i18n.language === 'ru' ? 'ru-RU' : 'en-US';

  const [labFiles, setLabFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const data = await labApi.getPatientLabResults(patientData.id);
        const files = [];
        (data || []).forEach(res => {
          if (res.file_urls && res.file_urls.length > 0) {
            res.file_urls.forEach((url, idx) => {
              files.push({
                id: `lab-${res.id}-${idx}`,
                title: `${res.title.replace(/\s+/g, '_')}_file${idx > 0 ? idx + 1 : ''}.pdf`,
                url,
                date: res.created_at,
                type: 'PDF',
              });
            });
          }
        });
        setLabFiles(files);
      } catch (err) {
        console.error('Failed to fetch lab results for documents', err);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [patientData.id]);

  const consultationDocs = [];
  patientData.consultations.forEach(c => {
    if (c.results?.[0]?.file_urls?.length > 0) {
      c.results[0].file_urls.forEach((url, idx) => {
        consultationDocs.push({
          id: `consult-${c.id}-${idx}`,
          title: `Consultation_Notes_${new Date(c.created_at).toLocaleDateString(lang, { month: 'short', day: 'numeric' })}.pdf`,
          url,
          date: c.created_at,
          type: 'PDF',
          by: 'you'
        });
      });
    }
  });

  const renderDocCard = (doc, iconName, iconColor, iconBg) => (
    <TouchableOpacity key={doc.id} style={styles.docCard} onPress={() => Linking.openURL(doc.url)}>
      <View style={[styles.docIconBox, { backgroundColor: iconBg }]}>
        <Icon name={iconName} size={sizes.scale(24)} color={iconColor} />
      </View>
      <View style={styles.docInfo}>
        <Text style={styles.docTitle} numberOfLines={1}>{doc.title}</Text>
        <Text style={styles.docSubtitle}>
          {doc.type} · {new Date(doc.date).toLocaleDateString(lang, { month: 'short', day: 'numeric', year: 'numeric' })}
          {doc.by ? ` · by ${doc.by}` : ''}
        </Text>
      </View>
      <Icon name="arrow-right" size={sizes.scale(20)} color={colors.p500}  />
    </TouchableOpacity>
  );

  return (
    <View style={styles.tabContainer}>
      {loading ? (
        <ActivityIndicator size="small" color={colors.p500} style={{ padding: sizes.spacing.m }} />
      ) : (
        <>
          {labFiles.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>{t('doctor_history.uploaded_labs', 'Uploaded from Labs')}</Text>
              <View style={styles.docsContainer}>
                {labFiles.map(doc => renderDocCard(doc, 'FileText', colors.danger, colors.danger + '20'))}
              </View>
            </>
          )}

          {consultationDocs.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>{t('doctor_history.from_consultations', 'From consultations')}</Text>
              <View style={styles.docsContainer}>
                {consultationDocs.map(doc => renderDocCard(doc, 'FileText', colors.warning, colors.warning + '20'))}
              </View>
            </>
          )}

          {labFiles.length === 0 && consultationDocs.length === 0 && (
            <View style={{ paddingVertical: sizes.spacing.xl, alignItems: 'center' }}>
              <Text style={{ fontFamily: 'Manrope_500Medium', color: colors.n500 }}>{t('doctor_history.no_documents', 'No documents found.')}</Text>
            </View>
          )}
        </>
      )}
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
  visitsBadge: {
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.sizes.spacing.m,
    paddingVertical: theme.sizes.scale(6),
    borderRadius: theme.sizes.borderRadius.full,
  },
  visitsText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: theme.sizes.scale(13),
    color: theme.colors.p400,
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
    color: theme.colors.p500, // teal for default values
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
  },
  tabContainer: {
    paddingBottom: theme.sizes.spacing.xl,
  },
  labCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.m,
    shadowColor: /* TODO: color */ '#000',
    shadowOffset: { width: theme.sizes.scale(0), height: theme.sizes.scale(4) },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  labCardHeader: {
    marginBottom: theme.sizes.spacing.s,
  },
  labTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: theme.sizes.scale(16),
    color: theme.colors.n900,
  },
  labSubtitle: {
    fontFamily: 'Manrope_500Medium',
    fontSize: theme.sizes.scale(12),
    color: theme.colors.n500,
  },
  labDesc: {
    fontFamily: 'Manrope_500Medium',
    fontSize: theme.sizes.scale(14),
    color: theme.colors.n700,
    marginBottom: theme.sizes.spacing.m,
  },
  labStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  labStatusBadge: {
    paddingHorizontal: theme.sizes.spacing.m,
    paddingVertical: theme.sizes.scale(4),
    borderRadius: theme.sizes.borderRadius.full,
  },
  labStatusText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: theme.sizes.scale(12),
  },
  docsContainer: {
    gap: theme.sizes.spacing.m,
  },
  docCard: {
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
  docIconBox: {
    width: theme.sizes.scale(44),
    height: theme.sizes.scale(44),
    borderRadius: theme.sizes.borderRadius.small,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.sizes.spacing.m,
  },
  docInfo: {
    flex: 1,
  },
  docTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: theme.sizes.scale(15),
    color: theme.colors.n900,
    marginBottom: theme.sizes.scale(2),
  },
  docSubtitle: {
    fontFamily: 'Manrope_500Medium',
    fontSize: theme.sizes.scale(12),
    color: theme.colors.n500,
  }
});
