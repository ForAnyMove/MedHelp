import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../theme/ThemeContext';
import { useStyles } from '../../../../theme/useStyles';
import { SubViewScreen } from '../../../../components/common/SubViewScreen';
import { Icon } from '../../../../components/ui/Icon';
import { Button } from '../../../../components/ui/Button';
import { useComponentContext } from '../../../../context/GlobalContext';
import { useSession } from '../../../../context/SessionContext';
import { formatIsoDate } from '../../../../utils/dateUtils';
import { useRouter } from 'expo-router';

function getTypeConfig(status, colors) {
  switch (status) {
    case 'scheduled':
    case 'occupied':
      return { icon: 'calendar', color: colors.info, bg: colors.info + '22' };
    case 'canceled':
      return { icon: 'calendar-x', color: colors.danger, bg: colors.danger + '22' };
    case 'completed':
    default:
      return { icon: 'stethoscope', color: colors.p500, bg: colors.p100 };
  }
}

function getTitleKey(status) {
  if (status === 'completed') return 'doctor_history.detail_title_completed';
  return 'consultation.booking_details';
}

function getStatusKey(status) {
  if (status === 'scheduled' || status === 'occupied') return 'doctor_history.status_upcoming';
  if (status === 'canceled') return 'doctor_history.status_canceled';
  return 'doctor_history.status_completed';
}

function formatTime(isoDate) {
  if (!isoDate) return '—';
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return '—';
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export function PatientConsultationCard({ booking, onBack, onConnect, onCancel, onReschedule }) {
  const { t } = useTranslation();
  const { colors, sizes } = useTheme();
  const styles = useStyles(themeStyles);
  const { session, refreshSessionToken } = useSession();
  const router = useRouter();

  const [isDoctorWaiting, setIsDoctorWaiting] = useState(booking.status === 'occupied');
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);

  const translateSpecialization = (spec) => {
    if (!spec) return t('doctor_history.general_practitioner', 'General Practitioner');
    const lower = spec.toLowerCase();
    if (lower.includes('general') || lower === 'general practitioner' || lower === 'general') {
      return t('doctor_history.general_practitioner', 'General Practitioner');
    }
    return spec;
  };
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isRated, setIsRated] = useState(false);

  const isCompleted = booking.status === 'completed';
  const isCanceled = booking.status === 'canceled';
  const isScheduled = booking.status === 'scheduled' || booking.status === 'occupied';

  const doctor = booking.doctor || {};
  const typeConfig = getTypeConfig(booking.status, colors);

  const startTime = formatTime(booking.date);
  const endTime = (() => {
    if (!booking.date || !booking.duration) return null;
    const d = new Date(booking.date);
    if (isNaN(d.getTime())) return null;
    d.setMinutes(d.getMinutes() + Number(booking.duration));
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  })();
  const timeValue = endTime ? `${startTime} – ${endTime}` : startTime;
  const formatValue = booking.format === 'offline' ? t('doctor_history.format_offline') : t('doctor_history.format_online');

  useEffect(() => {
    let intervalId;
    const fetchStatus = async () => {
      try {
        const { createApiClient } = require('../../../../api/apiClient');
        const api = createApiClient(session, refreshSessionToken);
        const { data } = await api.get(`/consultations/${booking.id}`);
        if (data && data.data) {
          if (data.data.status === 'occupied') {
            setIsDoctorWaiting(true);
          } else {
            setIsDoctorWaiting(false);
          }
          if (data.data.rating) {
            setRating(data.data.rating);
            setComment(data.data.review || '');
            setIsRated(true);
          }
        }
      } catch (err) {
        console.error('Failed to fetch consultation status:', err);
      } finally {
        setLoadingStatus(false);
      }
    };

    if (!isCompleted && !isCanceled) {
      fetchStatus();
      intervalId = setInterval(fetchStatus, 10000);
    } else if (isCompleted) {
      fetchStatus();
    }

    // Listen for real-time consultation_started socket event (no polling delay)
    const { DeviceEventEmitter } = require('react-native');
    const sub = DeviceEventEmitter.addListener('consultation_updated', (event) => {
      if (!event?.consultationId || event.consultationId === booking.id) {
        // Immediately show the Connect button
        setIsDoctorWaiting(true);
        setLoadingStatus(false);
      }
    });

    return () => {
      if (intervalId) clearInterval(intervalId);
      sub.remove();
    };
  }, [booking.id, isCompleted, isCanceled]);

  const submitRating = async () => {
    if (rating === 0) {
      Alert.alert(t('common.error'), 'Please select a rating');
      return;
    }
    try {
      const { createApiClient } = require('../../../../api/apiClient');
      const api = createApiClient(session, refreshSessionToken);
      await api.post(`/consultations/${booking.id}/rating`, {
        rating,
        review: comment
      });
      setIsRated(true);
      Alert.alert('Success', 'Rating submitted successfully!');
    } catch (error) {
      console.error('Submit rating error:', error);
      Alert.alert(t('common.error'), 'Failed to submit rating.');
    }
  };

  const renderStars = () => (
    <View style={styles.starsContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => !isRated && setRating(star)}
          disabled={isRated}
        >
          <Icon
            name={star <= rating ? "star" : "star-outline"}
            size={sizes.scale(36)}
            color={colors.sYell}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SubViewScreen title={t(getTitleKey(booking.status))} onBack={onBack}>
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

          {/* COMPLETED FLOW */}
          {isCompleted && (
            <>
              {/* Merged Doctor & Details Card */}
              <View style={styles.mergedCard}>
                <View style={styles.mergedDoctorRow}>
                  {doctor?.avatarUrl ? (
                    <Image source={{ uri: doctor.avatarUrl }} style={styles.patientAvatar} />
                  ) : (
                    <View style={[styles.patientAvatar, { backgroundColor: typeConfig.color }]}>
                      <Icon name="profile" size={sizes.scale(24)} color={colors.white} />
                    </View>
                  )}
                  <View style={styles.patientInfo}>
                    <Text style={styles.patientName}>{t('doctor_history.dr', 'Dr.')} {doctor.firstName} {doctor.lastName}</Text>
                    <Text style={styles.patientMeta}>{translateSpecialization(doctor.specialization)}</Text>
                  </View>
                  <Icon name="chevron-right" size={sizes.scale(20)} color={colors.p500} />
                </View>

                <View style={styles.mergedDetailsList}>
                  <DetailRow icon="calendar" label={t('doctor_history.label_date')} value={formatIsoDate(booking.date, 'medium', t)} />
                  <DetailRow icon="clock" label={t('doctor_history.label_time')} value={timeValue} />
                  <DetailRow icon="video" label={t('doctor_history.label_format')} value={formatValue} />
                  <DetailRow icon="file-text" label={t('doctor_history.label_reason', 'Reason:')} value={booking.summary || booking.purpose || '—'} />
                  <DetailRow
                    icon="check-circle"
                    label={t('doctor_history.label_status')}
                    value={t(getStatusKey(booking.status))}
                    valueColor={colors.sBlue}
                    isLast
                  />
                </View>
              </View>

              {/* Consultation Summary Banner */}
              <TouchableOpacity style={styles.summaryCard}>
                <View style={styles.summaryIconBox}>
                  <Icon name="file-text" size={sizes.scale(24)} color={colors.p500} />
                </View>
                <View style={styles.summaryTexts}>
                  <Text style={styles.summaryTitle}>{t('doctor_history.consultation_summary', 'Consultation summary')}</Text>
                  <Text style={styles.summarySub}>{t('doctor_history.summary_desc', "Doctor's diagnosis, conclusion, recommendations & next steps.")}</Text>
                </View>
                <Icon name="chevron-right" size={sizes.scale(20)} color={colors.n400} />
              </TouchableOpacity>

              {/* Files from this visit */}
              <Text style={styles.sectionTitle}>{t('doctor_history.files_visit', 'Files from this visit')}</Text>
              <View style={styles.fileCard}>
                <View style={styles.fileIconBox}>
                  <Icon name="file-text" size={sizes.scale(20)} color={colors.sYell} />
                </View>
                <View style={styles.fileTexts}>
                  <Text style={styles.fileName}>Prescription_Jun5.pdf</Text>
                  <Text style={styles.fileMeta}>{t('doctor_history.file_meta', '0.3 MB · by Dr. {{name}}', { name: doctor.lastName })}</Text>
                </View>
                <Icon name="chevron-right" size={sizes.scale(20)} color={colors.n400} />
              </View>

              {/* Rate this consultation */}
              <View style={styles.rateCard}>
                <View style={styles.rateHeader}>
                  <Icon name="star" size={sizes.scale(24)} color={colors.sYell} />
                  <View style={styles.rateTexts}>
                    <Text style={styles.rateTitle}>{t('doctor_history.rate_consultation', 'Rate this consultation')}</Text>
                    <Text style={styles.rateSub}>{t('doctor_history.rate_desc', 'Help others by sharing your experience')}</Text>
                  </View>
                </View>

                {renderStars()}

                <View style={styles.commentBox}>
                  <TextInput
                    style={[styles.commentInput, isRated && { color: colors.n700 }]}
                    placeholder={t('doctor_history.leave_comment', 'Leave a comment (optional)')}
                    placeholderTextColor={colors.n400}
                    multiline
                    value={comment}
                    onChangeText={setComment}
                    editable={!isRated}
                  />
                  {!isRated && <Text style={styles.charCount}>{comment.length}/100</Text>}
                </View>

                {!isRated && (
                  <Button
                    title={t('doctor_history.submit_rating', 'Submit rating')}
                    variant="outlined"
                    style={styles.submitRatingBtn}
                    textStyle={styles.submitRatingText}
                    onPress={submitRating}
                  />
                )}
              </View>
            </>
          )}

          {/* UPCOMING & CANCELED FLOW */}
          {!isCompleted && (
            <>
              {/* Doctor Info Card */}
              <View style={[styles.patientCard, { backgroundColor: typeConfig.bg }]}>
                {doctor?.avatarUrl ? (
                  <Image source={{ uri: doctor.avatarUrl }} style={styles.patientAvatar} />
                ) : (
                  <View style={[styles.patientAvatar, { backgroundColor: typeConfig.color }]}>
                    <Icon name="profile" size={sizes.scale(24)} color={colors.white} />
                  </View>
                )}
                <View style={styles.patientInfo}>
                  <Text style={styles.patientName}>
                    {t('doctor_history.dr', 'Dr.')} {doctor.firstName} {doctor.lastName}
                  </Text>
                  <Text style={[styles.patientMeta, { color: typeConfig.color }]}>
                    {translateSpecialization(doctor.specialization)}
                  </Text>
                </View>
                <View style={[styles.typeBadge, { backgroundColor: typeConfig.color }]}>
                  <Icon name={typeConfig.icon} size={sizes.scale(14)} color={colors.white} />
                </View>
              </View>

              {/* Canceled Banner */}
              {isCanceled && (
                <View style={styles.canceledCard}>
                  <View style={styles.canceledHeader}>
                    <Icon name="info" size={sizes.scale(18)} color={colors.danger} />
                    <Text style={styles.canceledTitle}>
                      {t('doctor_history.canceled_by', 'Canceled by {{who}}', { who: booking.canceledBy === booking.patientId ? t('doctor_history.patient', 'Patient') : t('doctor_history.doctor', 'Doctor') })}
                    </Text>
                  </View>
                  <Text style={styles.canceledDate}>
                    {booking.canceledAt ? formatIsoDate(booking.canceledAt, 'medium', t) : ''}
                  </Text>
                  <Text style={styles.canceledReason}>
                    {booking.cancelReason || t('doctor_history.no_reason', 'No reason provided')}
                  </Text>
                </View>
              )}

              {/* Details Card */}
              <View style={styles.detailsCard}>
                <DetailRow icon="calendar" label={t('doctor_history.label_date')} value={formatIsoDate(booking.date, 'medium', t)} />
                <DetailRow icon="clock" label={t('doctor_history.label_time')} value={timeValue} />
                <DetailRow icon="video" label={t('doctor_history.label_format')} value={formatValue} />
                <DetailRow icon={isCanceled ? 'x-circle' : 'calendar-clock'} label={t('doctor_history.label_status')} value={t(getStatusKey(booking.status))} valueColor={typeConfig.color} isLast />
              </View>

              {/* Reason / Purpose Card */}
              {isScheduled && booking.purpose && (
                <View style={styles.purposeCard}>
                  <View style={styles.purposeHeader}>
                    <Icon name="file-text" size={sizes.scale(18)} color={colors.p500} />
                    <Text style={styles.purposeTitle}>{t('doctor_history.reason_for_visit', 'Reason for visit')}</Text>
                  </View>
                  <Text style={styles.purposeText}>{booking.purpose}</Text>
                </View>
              )}
            </>
          )}

        </ScrollView>

        {/* Footer Buttons for Upcoming */}
        {!isCompleted && !isCanceled && (
          <View style={styles.footer}>
            {!loadingStatus && isDoctorWaiting ? (
              <Button
                title={t('consultation.connect_btn')}
                variant="primary"
                onPress={() => onConnect && onConnect(booking)}
                style={styles.connectButton}
              />
            ) : isScheduled ? (
              <>
                <Button
                  title={t('consultation.cancel_booking')}
                  variant="outlined"
                  onPress={() => onCancel && onCancel(booking)}
                  style={styles.actionButton}
                />
                <Button
                  title={t('consultation.change_datetime')}
                  variant="primary"
                  onPress={() => onReschedule && onReschedule(booking)}
                  style={styles.actionButton}
                />
              </>
            ) : null}
          </View>
        )}
      </View>
    </SubViewScreen>
  );
}

const DetailRow = ({ icon, label, value, valueColor, isLast }) => {
  const { colors, sizes } = useTheme();
  const styles = useStyles(themeStyles);
  return (
    <View style={[styles.detailRow, isLast && styles.detailRowLast]}>
      <View style={styles.detailLabelContainer}>
        <Icon name={icon} size={sizes.scale(18)} color={colors.n400} />
        <Text style={styles.detailLabel}>{label}</Text>
      </View>
      <Text style={[styles.detailValue, valueColor && { color: valueColor }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
};

const themeStyles = (theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  scrollContent: {
    // paddingHorizontal: theme.sizes.spacing.m,
    paddingBottom: theme.sizes.spacing.xl,
    paddingTop: theme.sizes.spacing.m,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: theme.sizes.spacing.m,
    paddingBottom: theme.sizes.spacing.l,
    paddingTop: theme.sizes.spacing.m,
    marginHorizontal: -theme.sizes.spacing.m,
    gap: theme.sizes.spacing.m,
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.n200,
  },
  actionButton: {
    flex: 1,
    paddingHorizontal: theme.sizes.spacing.xs,
  },
  connectButton: {
    flex: 1,
    height: theme.sizes.scale(56),
  },

  /* ── Doctor Card (Upcoming) ── */
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.m,
  },
  patientAvatar: {
    width: theme.sizes.scale(48),
    height: theme.sizes.scale(48),
    borderRadius: theme.sizes.scale(24),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.sizes.spacing.m,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    ...theme.sizes.typography.h4,
    color: theme.colors.n900,
    fontFamily: 'Manrope_700Bold',
    marginBottom: theme.sizes.spacing.xs / 2,
  },
  patientMeta: {
    ...theme.sizes.typography.caption,
  },
  typeBadge: {
    width: theme.sizes.scale(28),
    height: theme.sizes.scale(28),
    borderRadius: theme.sizes.scale(14),
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* ── Merged Card (Completed) ── */
  mergedCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.m,
    shadowColor: /* TODO: color */ '#000',
    shadowOffset: { width: theme.sizes.scale(0), height: theme.sizes.scale(4) },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  mergedDoctorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: theme.sizes.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.n100,
  },
  mergedDetailsList: {
    paddingTop: theme.sizes.spacing.s,
  },

  /* ── Details Row ── */
  detailsCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    paddingHorizontal: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.m,
    shadowColor: /* TODO: color */ '#000',
    shadowOffset: { width: theme.sizes.scale(0), height: theme.sizes.scale(4) },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.sizes.spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.n100,
  },
  detailRowLast: {
    borderBottomWidth: 0,
  },
  detailLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n500,
    marginLeft: theme.sizes.spacing.s,
  },
  detailValue: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n900,
    fontFamily: 'Manrope_700Bold',
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: theme.sizes.spacing.s,
  },

  /* ── Purpose Card ── */
  purposeCard: {
    backgroundColor: theme.colors.p50,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.m,
  },
  purposeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.sizes.spacing.s,
  },
  purposeTitle: {
    ...theme.sizes.typography.bodyMedium,
    fontFamily: 'Manrope_700Bold',
    color: theme.colors.p500,
    marginLeft: theme.sizes.spacing.xs,
  },
  purposeText: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n800,
  },

  /* ── Canceled Card ── */
  canceledCard: {
    backgroundColor: theme.colors.danger + '11',
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.danger + '33',
  },
  canceledHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.sizes.spacing.xs,
  },
  canceledTitle: {
    ...theme.sizes.typography.bodyMedium,
    fontFamily: 'Manrope_700Bold',
    color: theme.colors.danger,
    marginLeft: theme.sizes.spacing.xs,
  },
  canceledDate: {
    ...theme.sizes.typography.caption,
    color: theme.colors.n500,
    marginBottom: theme.sizes.spacing.xs,
  },
  canceledReason: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n800,
  },

  /* ── Summary Banner ── */
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.p50,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.l,
    borderWidth: 1,
    borderColor: theme.colors.p100,
  },
  summaryIconBox: {
    width: theme.sizes.scale(48),
    height: theme.sizes.scale(48),
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.scale(12),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.sizes.spacing.m,
  },
  summaryTexts: {
    flex: 1,
  },
  summaryTitle: {
    ...theme.sizes.typography.h4,
    color: theme.colors.n900,
    fontFamily: 'Manrope_700Bold',
    marginBottom: theme.sizes.scale(2),
  },
  summarySub: {
    ...theme.sizes.typography.caption,
    color: theme.colors.n500,
  },

  /* ── Files Section ── */
  sectionTitle: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n900,
    fontFamily: 'Manrope_700Bold',
    marginBottom: theme.sizes.spacing.m,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.xl,
    shadowColor: /* TODO: color */ '#000',
    shadowOffset: { width: theme.sizes.scale(0), height: theme.sizes.scale(4) },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  fileIconBox: {
    width: theme.sizes.scale(40),
    height: theme.sizes.scale(40),
    backgroundColor: theme.colors.sYell + '22',
    borderRadius: theme.sizes.scale(10),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.sizes.spacing.m,
  },
  fileTexts: {
    flex: 1,
  },
  fileName: {
    ...theme.sizes.typography.bodyMedium,
    fontFamily: 'Manrope_600SemiBold',
    color: theme.colors.n900,
  },
  fileMeta: {
    ...theme.sizes.typography.caption,
    color: theme.colors.n400,
  },

  /* ── Rating Card ── */
  rateCard: {
    backgroundColor: theme.colors.sYell + '11',
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.sYell + '33',
    marginBottom: theme.sizes.spacing.xl,
  },
  rateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.sizes.spacing.m,
  },
  rateTexts: {
    marginLeft: theme.sizes.spacing.s,
  },
  rateTitle: {
    ...theme.sizes.typography.h4,
    color: theme.colors.sYell,
    fontFamily: 'Manrope_700Bold',
  },
  rateSub: {
    ...theme.sizes.typography.caption,
    color: theme.colors.n500,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.m,
  },
  commentBox: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.medium,
    padding: theme.sizes.spacing.m,
    minHeight: theme.sizes.scale(80),
    marginBottom: theme.sizes.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.n200,
  },
  commentInput: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n900,
    flex: 1,
    textAlignVertical: 'top',
  },
  charCount: {
    ...theme.sizes.typography.caption,
    color: theme.colors.n400,
    textAlign: 'right',
    marginTop: theme.sizes.spacing.xs,
  },
  submitRatingBtn: {
    borderColor: theme.colors.sYell,
  },
  submitRatingText: {
    color: theme.colors.sYell,
  }
});
