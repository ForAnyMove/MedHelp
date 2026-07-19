import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useComponentContext } from '../../../../context/GlobalContext';
import { usePatientDashboard } from '../../../../context/PatientDashboardContext';
import { useStyles } from '../../../../theme/useStyles';
import { Icon } from '../../../../components/ui/Icon';
import { Button } from '../../../../components/ui/Button';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { formatIsoDate } from '../../../../utils/dateUtils';
import { useTheme } from '../../../../theme/ThemeContext';
import { createApiClient } from '../../../../api/apiClient';
import { createConsultationsApi } from '../../../../api/consultationsApi';

/** Returns icon name, accent color and background color based on consultation status */
function getTypeConfig(status, colors) {
    switch (status) {
        case 'scheduled':
            return { icon: 'calendar', color: colors.info, bg: colors.info + '22', borderColor: colors.info };
        case 'canceled':
            return { icon: 'calendar-x', color: colors.danger, bg: colors.danger + '22', borderColor: colors.danger };
        case 'completed':
        default:
            return { icon: 'stethoscope', color: colors.p500, bg: colors.p100, borderColor: colors.p500 };
    }
}

/** Maps consultation status → translation key for the page title */
function getTitleKey(status) {
    if (status === 'scheduled') return 'doctor_history.detail_title_upcoming';
    if (status === 'canceled') return 'doctor_history.detail_title_canceled';
    return 'doctor_history.detail_title_completed';
}

/** Maps consultation status → translation key for the status label */
function getStatusKey(status) {
    if (status === 'scheduled') return 'doctor_history.status_upcoming';
    if (status === 'canceled') return 'doctor_history.status_canceled';
    return 'doctor_history.status_completed';
}

/** Formats time portion from ISO date string (HH:MM) */
function formatTime(isoDate) {
    if (!isoDate) return '—';
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return '—';
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
}

export function PatientCompletedConsultation({ id: propId }) {
    const { t } = useTranslation();
    const router = useRouter();
    const params = useLocalSearchParams();
    const id = propId || params.openHistoryId;
    const { session, refreshSessionToken, historyController } = useComponentContext();
    const { pastConsultations, isLoaded } = historyController;
    const { navigateBack, navigateToHistorySummary, navigateToHistoryDoctorProfile } = usePatientDashboard();
    const styles = useStyles(themeStyles);
    const { colors, sizes } = useTheme();

    const [consultation, setConsultation] = useState(null);
    const [patientHistory, setPatientHistory] = useState(null);
    const [ratingData, setRatingData] = useState(null);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Rating state
    const [ratingValue, setRatingValue] = useState(0);
    const [ratingComment, setRatingComment] = useState('');
    const [ratingSubmitting, setRatingSubmitting] = useState(false);

    useEffect(() => {
        if (id && isLoaded && pastConsultations) {
            const found = pastConsultations.find(c => String(c.id) === String(id));
            if (found) {
                setConsultation(prev => {
                    if (!prev) return found;
                    return {
                        ...prev,
                        ...found,
                        hasResult: prev.hasResult !== undefined ? prev.hasResult : found.hasResult,
                        is_draft: prev.is_draft !== undefined ? prev.is_draft : found.is_draft,
                        result: prev.result !== undefined ? prev.result : found.result,
                        resultId: prev.resultId !== undefined ? prev.resultId : found.resultId,
                    };
                });
            }
        }
    }, [id, pastConsultations, isLoaded]);

    useEffect(() => {
        if (consultation && session) {
            const fetchData = async () => {
                setLoadingHistory(true);
                try {
                    const api = createApiClient(session, refreshSessionToken);
                    const consultApi = createConsultationsApi(api);

                    const [historyRes, resultRes, ratingRes] = await Promise.all([
                        consultApi.getPatientHistory(consultation.id).catch(() => null),
                        consultApi.getResults(consultation.id).catch(() => null),
                        consultApi.getRating(consultation.id).catch(() => null)
                    ]);

                    console.log('[PatientCompletedConsultation] resultRes:', resultRes);
                    console.log('[PatientCompletedConsultation] ratingRes:', ratingRes);

                    if (historyRes) {
                        setPatientHistory(historyRes);
                    }
                    if (resultRes) {
                        setConsultation(prev => ({
                            ...prev,
                            hasResult: true,
                            is_draft: resultRes.is_draft,
                            resultId: resultRes.id,
                            result: resultRes
                        }));
                    } else if (resultRes === null) {
                        setConsultation(prev => ({
                            ...prev,
                            hasResult: false,
                            is_draft: true,
                            resultId: null,
                            result: null
                        }));
                    }
                    if (ratingRes && ratingRes.rating) {
                        setRatingData(ratingRes);
                        setRatingValue(ratingRes.rating);
                        setRatingComment(ratingRes.comment || '');
                    }
                } catch (error) {
                    console.error('[CompletedConsultation] Error fetching data:', error);
                } finally {
                    setLoadingHistory(false);
                }
            };
            fetchData();
        }
    }, [consultation?.id, session]);

    if (!consultation) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={styles.loadingText}>{t('doctor_history.loading')}</Text>
            </View>
        );
    }

    const typeConfig = getTypeConfig(consultation.status, colors);
    const isCompleted = consultation.status === 'completed';
    const isCanceled = consultation.status === 'canceled';
    const isScheduled = consultation.status === 'scheduled';

    // Derive time window: start time + duration
    const startTime = formatTime(consultation.date);
    const endTime = (() => {
        if (!consultation.date || !consultation.duration) return null;
        const d = new Date(consultation.date);
        if (isNaN(d.getTime())) return null;
        d.setMinutes(d.getMinutes() + Number(consultation.duration));
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    })();
    const timeValue = endTime ? `${startTime} – ${endTime}` : startTime;

    const formatValue = consultation.format === 'offline'
        ? t('doctor_history.format_offline')
        : t('doctor_history.format_online');

    const translateMeta = (metaStr) => {
        if (!metaStr) return '';
        return metaStr.split(' · ').map(part => {
            if (part === 'Male') return t('common.male', 'Мужской');
            if (part === 'Female') return t('common.female', 'Женский');
            if (part.endsWith(' y.o.')) {
                const num = parseInt(part);
                return t('common.years_old', { count: num, defaultValue: `${num} лет` });
            }
            return part;
        }).join(' · ');
    };

    // Reminder Calculation
    const getReminderText = () => {
        if (!consultation.date || !consultation.serverNow) return null;
        const dateObj = new Date(consultation.date);
        const serverNowObj = new Date(consultation.serverNow);

        const deltaMs = dateObj.getTime() - serverNowObj.getTime();
        const deltaHours = Math.max(0, Math.floor(deltaMs / (1000 * 60 * 60)));
        const timeStr = formatTime(consultation.date);

        const todayStart = new Date(serverNowObj);
        todayStart.setHours(0, 0, 0, 0);
        const tomorrowStart = new Date(todayStart);
        tomorrowStart.setDate(tomorrowStart.getDate() + 1);
        const nextDayStart = new Date(tomorrowStart);
        nextDayStart.setDate(nextDayStart.getDate() + 1);

        if (dateObj >= todayStart && dateObj < tomorrowStart) {
            return t('doctor_history.reminder_today', { hours: deltaHours, time: timeStr });
        } else if (dateObj >= tomorrowStart && dateObj < nextDayStart) {
            return t('doctor_history.reminder_tomorrow', { time: timeStr });
        } else {
            return t('doctor_history.reminder_later', {
                date: formatIsoDate(consultation.date, 'medium', t),
                time: timeStr
            });
        }
    };

    const handleRatingSubmit = async () => {
        if (ratingValue === 0) return;
        setRatingSubmitting(true);
        try {
            const api = createApiClient(session, refreshSessionToken);
            const consultApi = createConsultationsApi(api);
            await consultApi.submitRating(consultation.id, { rating: ratingValue, comment: ratingComment });
            setRatingData({ rating: ratingValue, comment: ratingComment });
        } catch (err) {
            console.error('Failed to submit rating:', err);
        } finally {
            setRatingSubmitting(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={navigateBack} style={styles.backButton}>
                    <Icon name="arrow-back" size={sizes.scale(24)} color={colors.p500} />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>
                    {t(getTitleKey(consultation.status))}
                </Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* UPCOMING: Reminder Pill */}
                {isScheduled && getReminderText() && (
                    <View style={styles.reminderPill}>
                        <Icon name="clock" size={sizes.scale(16)} color={colors.info} />
                        <Text style={styles.reminderText}>{getReminderText()}</Text>
                    </View>
                )}

                {/* Patient Info Card (shows doctor info) */}
                <TouchableOpacity
                    style={[styles.patientCard, { backgroundColor: typeConfig.bg, borderColor: typeConfig.borderColor }]}
                    onPress={() => navigateToHistoryDoctorProfile(consultation.doctorId)}
                >
                    {consultation.avatarUrl ? (
                        <Image
                            source={{ uri: consultation.avatarUrl }}
                            style={styles.patientAvatar}
                        />
                    ) : (
                        <View style={[styles.patientAvatar, { backgroundColor: typeConfig.color }]}>
                            <Icon name="profile" size={sizes.scale(24)} color={colors.white} />
                        </View>
                    )}
                    <View style={styles.patientInfo}>
                        <Text style={styles.patientName}>
                            {consultation.doctorName || t('doctor_history.doctor', 'Doctor')}
                        </Text>
                        {consultation.doctorMeta ? (
                            <Text style={[styles.patientMeta, { color: typeConfig.color }]}>
                                {translateMeta(consultation.doctorMeta)}
                            </Text>
                        ) : null}
                    </View>

                    {/* Type badge */}
                    <View style={[styles.typeBadge, { backgroundColor: typeConfig.color }]}>
                        <Icon name={typeConfig.icon} size={sizes.scale(14)} color={colors.white} />
                    </View>
                </TouchableOpacity>

                {/* CANCELED: Info Card */}
                {isCanceled && (
                    <View style={styles.canceledCard}>
                        <View style={styles.canceledHeader}>
                            <Icon name="info" size={sizes.scale(18)} color={colors.danger} />
                            <Text style={styles.canceledTitle}>
                                {consultation.canceledBy === consultation.patientId
                                    ? t('doctor_history.canceled_by_patient')
                                    : t('doctor_history.canceled_by_doctor')}
                            </Text>
                        </View>
                        <Text style={styles.canceledDate}>
                            {consultation.canceledAt ? formatIsoDate(consultation.canceledAt, 'medium', t) : ''}
                        </Text>
                        <Text style={styles.canceledReason}>
                            {consultation.cancelReason || t('doctor_history.no_reason')}
                        </Text>
                    </View>
                )}

                {/* Details Card */}
                <View style={styles.detailsCard}>
                    <DetailRow
                        icon="calendar"
                        label={t('doctor_history.label_date')}
                        value={formatIsoDate(consultation.date, 'medium', t)}
                    />
                    <DetailRow
                        icon="clock"
                        label={t('doctor_history.label_time')}
                        value={timeValue}
                    />
                    {consultation.duration ? (
                        <DetailRow
                            icon="timer"
                            label={t('doctor_history.label_duration')}
                            value={t('doctor_history.duration', { duration: consultation.duration })}
                        />
                    ) : null}
                    <DetailRow
                        icon="video"
                        label={t('doctor_history.label_format')}
                        value={formatValue}
                    />
                    <DetailRow
                        icon={isCanceled ? 'x-circle' : isCompleted ? 'check-circle' : 'calendar-clock'}
                        label={t('doctor_history.label_status')}
                        value={t(getStatusKey(consultation.status))}
                        valueColor={typeConfig.color}
                        isLast
                    />
                </View>

                {/* UPCOMING: Patient's Note Card */}
                {isScheduled && consultation.purpose && (
                    <View style={styles.purposeCard}>
                        <View style={styles.purposeHeader}>
                            <Icon name="file-text" size={sizes.scale(18)} color={colors.p500} />
                            <Text style={styles.purposeTitle}>{t('doctor_history.patient_note_title')}</Text>
                        </View>
                        <Text style={styles.purposeText}>{consultation.purpose}</Text>
                    </View>
                )}

                {/* COMPLETED: Summary & Rating */}
                {isCompleted && (
                    <View style={styles.resultsContainer}>
                        {consultation.hasResult && !consultation.is_draft ? (
                            <TouchableOpacity
                                style={[styles.summaryReadyCard, { backgroundColor: colors.p400 }]}
                                onPress={() => navigateToHistorySummary(consultation.id)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.summaryReadyInner}>
                                    <Icon name="medic-history" size={sizes.scale(24)} color={colors.p500} wrapped wrapperStyle={{ marginRight: sizes.spacing.m }} />
                                    <View style={styles.summaryTexts}>
                                        <Text style={styles.summaryTitle}>{t('doctor_history.consultation_summary', 'Consultation summary')}</Text>
                                        <Text style={styles.summarySub}>{t('doctor_history.summary_desc', "Doctor's diagnosis, conclusion, recommendations & next steps.")}</Text>
                                    </View>
                                    <Icon name="arrow-right" size={sizes.scale(20)} color={colors.p500} />
                                </View>
                            </TouchableOpacity>
                        ) : (
                            <View style={[styles.summaryReadyCard, { backgroundColor: colors.p400, opacity: 0.8 }]}>
                                <View style={styles.summaryReadyInner}>
                                    <Icon name="medic-history" size={sizes.scale(24)} color={colors.p500} wrapped wrapperStyle={{ marginRight: sizes.spacing.m }} />
                                    <View style={styles.summaryTexts}>
                                        <Text style={styles.summaryTitle}>{t('doctor_history.consultation_summary', 'Consultation summary')}</Text>
                                        <Text style={styles.summarySub}>
                                            {t('consultation.waiting_for_results', 'Необходимо дождаться результатов консультации от доктора')}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* Rating Block */}
                        <View style={styles.rateCard}>
                            <View style={styles.rateHeader}>
                                <Icon name="star-flag" size={sizes.scale(32)} color={colors.sYell2} style={{ marginRight: sizes.spacing.m }} />
                                <View style={styles.rateTexts}>
                                    <Text style={styles.rateTitle}>
                                        {ratingData
                                            ? t('consultation.rated', 'You rated this consultation')
                                            : t('consultation.rate_this', 'Rate this consultation')}
                                    </Text>
                                    {!ratingData && (
                                        <Text style={styles.rateSub}>{t('consultation.help_others', 'Help others by sharing your experience')}</Text>
                                    )}
                                </View>
                            </View>

                            <View style={styles.starsContainer}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <TouchableOpacity
                                        key={star}
                                        onPress={() => !ratingData && setRatingValue(star)}
                                        style={styles.starButton}
                                        activeOpacity={ratingData ? 1 : 0.7}
                                    >
                                        <Icon
                                            name={star <= ratingValue ? 'rate-star' : 'rate-star-empty'}
                                            size={sizes.scale(36)}
                                            color={colors.sYell2}
                                        />
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {(!ratingData || ratingComment) && (
                                <View style={styles.commentBox}>
                                    <TextInput
                                        style={[styles.commentInput, ratingData && { color: colors.n700 }]}
                                        placeholder={ratingData ? '' : t('consultation.leave_comment', 'Leave a comment (optional)')}
                                        placeholderTextColor={colors.n400}
                                        multiline
                                        numberOfLines={3}
                                        textAlignVertical="top"
                                        value={ratingComment}
                                        onChangeText={setRatingComment}
                                        maxLength={100}
                                        editable={!ratingData}
                                    />
                                    {!ratingData && <Text style={styles.charCount}>{ratingComment.length}/100</Text>}
                                </View>
                            )}

                            {!ratingData && (
                                <Button
                                    title={t('consultation.submit_rating', 'Submit rating')}
                                    variant={'outlined'}
                                    onPress={handleRatingSubmit}
                                    style={styles.submitRatingBtn}
                                    textStyle={{ color: colors.warning }}
                                    loading={ratingSubmitting}
                                    disabled={ratingSubmitting || ratingValue === 0}
                                />
                            )}
                        </View>
                    </View>
                )}

                {/* UPCOMING or CANCELED: Previous Visits */}
                {(isScheduled || isCanceled) && (
                    <View style={styles.previousVisitsCard}>
                        <Text style={styles.previousVisitsTitle}>{t('doctor_history.previous_visits_title')}</Text>

                        {loadingHistory ? (
                            <Text style={styles.loadingHistoryText}>{t('doctor_history.loading')}</Text>
                        ) : patientHistory && patientHistory.totalVisits > 0 ? (
                            <View style={styles.visitsList}>
                                <DetailRow
                                    icon="calendar"
                                    label={t('doctor_history.label_last_visit')}
                                    value={formatIsoDate(patientHistory.lastVisitDate, 'medium', t)}
                                />
                                <DetailRow
                                    icon="file-text"
                                    label={t('doctor_history.label_last_diagnosis')}
                                    value={patientHistory.lastDiagnosis || '—'}
                                />
                                <DetailRow
                                    icon="activity"
                                    label={t('doctor_history.label_total_visits')}
                                    value={String(patientHistory.totalVisits)}
                                    isLast
                                />
                            </View>
                        ) : (
                            <Text style={styles.noVisitsText}>{t('doctor_history.no_previous_visits')}</Text>
                        )}
                    </View>
                )}

            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <Button
                    title={t('doctor_history.view_doctor_profile', 'View doctor profile')}
                    variant="outlined"
                    iconRight={<Icon name="arrow-right" size={sizes.scale(20)} color={colors.p500} />}
                    onPress={() => navigateToHistoryDoctorProfile(consultation.doctorId)}
                    style={styles.viewProfileBtn}
                    textStyle={styles.viewProfileText}
                />
            </View>
        </View>
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
    loadingText: {
        ...theme.sizes.typography.bodyMedium,
        color: theme.colors.n500,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.sizes.spacing.m,
        paddingTop: theme.sizes.spacing.m,
        paddingBottom: theme.sizes.spacing.s,
    },
    backButton: {
        padding: theme.sizes.spacing.xs,
    },
    headerTitle: {
        ...theme.sizes.typography.h3,
        color: theme.colors.n900,
        fontFamily: 'Manrope_700Bold',
        flex: 1,
        marginLeft: theme.sizes.spacing.s,
    },
    scrollContent: {
        paddingHorizontal: theme.sizes.spacing.m,
        paddingTop: theme.sizes.spacing.m,
        paddingBottom: theme.sizes.spacing.xl,
    },

    /* ── Reminder Pill ── */
    reminderPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.info + '1A',
        paddingVertical: theme.sizes.spacing.s,
        paddingHorizontal: theme.sizes.spacing.m,
        borderRadius: theme.sizes.borderRadius.full,
        alignSelf: 'flex-start',
        marginBottom: theme.sizes.spacing.m,
    },
    reminderText: {
        ...theme.sizes.typography.bodyMedium,
        fontFamily: 'Manrope_600SemiBold',
        color: theme.colors.info,
        marginLeft: theme.sizes.spacing.s,
    },

    /* ── Patient card ── */
    patientCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: theme.sizes.borderRadius.large,
        padding: theme.sizes.spacing.m,
        marginBottom: theme.sizes.spacing.m,
        borderWidth: 1,
        borderColor: theme.colors.p500,
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

    /* ── Details card ── */
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

    /* ── Purpose/Note Card ── */
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

    /* ── Previous Visits Card ── */
    previousVisitsCard: {
        backgroundColor: theme.colors.white,
        borderRadius: theme.sizes.borderRadius.large,
        paddingHorizontal: theme.sizes.spacing.m,
        paddingVertical: theme.sizes.spacing.m,
        marginBottom: theme.sizes.spacing.m,
        shadowColor: /* TODO: color */ '#000',
        shadowOffset: { width: theme.sizes.scale(0), height: theme.sizes.scale(4) },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    previousVisitsTitle: {
        ...theme.sizes.typography.h4,
        color: theme.colors.n900,
        fontFamily: 'Manrope_700Bold',
        marginBottom: theme.sizes.spacing.m,
    },
    loadingHistoryText: {
        ...theme.sizes.typography.bodyMedium,
        color: theme.colors.n400,
    },
    noVisitsText: {
        ...theme.sizes.typography.bodyMedium,
        color: theme.colors.n500,
    },
    visitsList: {
        // Details Row styles applied internally
    },

    /* ── Notes card ── */
    notesCard: {
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
    notesHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.sizes.spacing.m,
    },
    notesTitle: {
        ...theme.sizes.typography.h4,
        color: theme.colors.n900,
        fontFamily: 'Manrope_700Bold',
    },
    editNotesBtn: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    editNotesText: {
        ...theme.sizes.typography.bodyMedium,
        color: theme.colors.p500,
        fontFamily: 'Manrope_600SemiBold',
        marginLeft: theme.sizes.spacing.xs,
    },
    notesReadOnlyContainer: {
        backgroundColor: theme.colors.n50,
        borderRadius: theme.sizes.borderRadius.medium,
        padding: theme.sizes.spacing.m,
        minHeight: theme.sizes.scale(100),
    },
    notesReadOnlyText: {
        ...theme.sizes.typography.bodyMedium,
        color: theme.colors.n900,
        flex: 1,
    },
    notesPlaceholder: {
        color: theme.colors.n400,
    },
    charCount: {
        ...theme.sizes.typography.caption,
        color: theme.colors.n400,
        textAlign: 'right',
        marginTop: theme.sizes.spacing.xs,
    },

    /* ── Summary & Rating Blocks ── */
    resultsContainer: {
        marginBottom: theme.sizes.spacing.m,
    },
    summaryReadyCard: {
        backgroundColor: theme.colors.p500,
        borderRadius: theme.sizes.borderRadius.large,
        padding: theme.sizes.spacing.m,
        marginBottom: theme.sizes.spacing.l,
    },
    summaryReadyInner: {
        backgroundColor: theme.colors.white,
        borderRadius: theme.sizes.borderRadius.large,
        padding: theme.sizes.spacing.m,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: /* TODO: color */ '#000',
        shadowOffset: { width: theme.sizes.scale(0), height: theme.sizes.scale(2) },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 1,
    },
    summaryIconBox: {
        width: theme.sizes.scale(48),
        height: theme.sizes.scale(48),
        borderRadius: theme.sizes.scale(12),
        backgroundColor: theme.colors.p50,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.sizes.spacing.m,
    },
    summaryTexts: {
        flex: 1,
        marginRight: theme.sizes.spacing.s,
    },
    summaryTitle: {
        ...theme.sizes.typography.bodyMedium,
        fontFamily: 'Manrope_700Bold',
        color: theme.colors.n900,
        marginBottom: theme.sizes.scale(2),
    },
    summarySub: {
        ...theme.sizes.typography.caption,
        color: theme.colors.n500,
    },
    rateCard: {
        backgroundColor: theme.colors.sYell + '33',
        borderRadius: theme.sizes.borderRadius.large,
        padding: theme.sizes.spacing.m,
        width: '100%',
        marginBottom: theme.sizes.spacing.l,
        borderWidth: 1,
        borderColor: theme.colors.sYell2 + '66',
    },
    rateHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.sizes.spacing.m,
    },
    rateTexts: {
        flex: 1,
    },
    rateTitle: {
        ...theme.sizes.typography.bodyMedium,
        fontFamily: 'Manrope_700Bold',
        color: theme.colors.sYell2,
    },
    rateSub: {
        ...theme.sizes.typography.caption,
        color: theme.colors.n500,
    },
    starsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.sizes.spacing.m,
        gap: theme.sizes.spacing.xs,
    },
    starButton: {
        padding: theme.sizes.spacing.xs,
    },
    commentBox: {
        backgroundColor: theme.colors.white,
        borderRadius: theme.sizes.borderRadius.large,
        padding: theme.sizes.spacing.m,
        marginBottom: theme.sizes.spacing.m,
        borderWidth: 1,
        borderColor: theme.colors.n300,
    },
    commentInput: {
        ...theme.sizes.typography.body,
        color: theme.colors.n700,
        borderWidth: 1,
        borderColor: theme.colors.n300,
        borderRadius: theme.sizes.borderRadius.large,
        paddingVertical: theme.sizes.spacing.s,
        paddingHorizontal: theme.sizes.spacing.m,
        minHeight: theme.sizes.scale(60),
    },
    charCount: {
        ...theme.sizes.typography.caption,
        color: theme.colors.n400,
        textAlign: 'right',
        marginTop: theme.sizes.spacing.xs,
    },
    submitRatingBtn: {
        borderColor: theme.colors.sYell2,
        borderWidth: 1,
    },

    /* ── Buttons ── */
    footer: {
        padding: theme.sizes.spacing.m,
        paddingBottom: theme.sizes.spacing.xl,
        borderTopWidth: 1,
        borderTopColor: theme.colors.n200,
        backgroundColor: theme.colors.white,
    },
    viewProfileBtn: {
        height: theme.sizes.scale(56),
        borderWidth: 2,
    },
    viewProfileText: {
        ...theme.sizes.typography.h3,
    },
});
