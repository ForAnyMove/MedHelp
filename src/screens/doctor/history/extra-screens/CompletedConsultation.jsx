import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useComponentContext } from '../../../../context/GlobalContext';
import { useStyles } from '../../../../theme/useStyles';
import { Icon } from '../../../../components/ui/Icon';
import { Button } from '../../../../components/ui/Button';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { formatIsoDate } from '../../../../utils/dateUtils';
import { useTheme } from '../../../../theme/ThemeContext';
import { useDoctorDashboard } from '../../../../context/DoctorDashboardContext';
import { createApiClient } from '../../../../api/apiClient';
import { createConsultationsApi } from '../../../../api/consultationsApi';
import { mapConsultationToDoctorHistory } from '../../../../utils/consultationMapper';

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

export function CompletedConsultation({ id }) {
    const { t } = useTranslation();
    const { session, refreshSessionToken, historyController, doctorProfileController } = useComponentContext();
    const { doctorPastConsultations, isLoaded } = historyController;
    const { consultations: upcomingConsultations } = doctorProfileController;
    const { navigateBack, navigateToHistoryPatientProfile, openConsultationById } = useDoctorDashboard();
    const styles = useStyles(themeStyles);
    const { colors, sizes } = useTheme();

    const [consultation, setConsultation] = useState(null);
    const [patientHistory, setPatientHistory] = useState(null);
    const [loadingHistory, setLoadingHistory] = useState(false);

    useEffect(() => {
        if (id && isLoaded) {
            let found = doctorPastConsultations?.find(c => String(c.id) === String(id));
            if (!found && upcomingConsultations) {
                found = upcomingConsultations.find(c => String(c.id) === String(id));
            }
            if (found) {
                setConsultation(found);
            } else if (session) {
                const fetchConsultation = async () => {
                    try {
                        const api = createApiClient(session, refreshSessionToken);
                        const consultApi = createConsultationsApi(api);
                        const res = await consultApi.getById(id);
                        if (res) {
                            setConsultation(mapConsultationToDoctorHistory(res));
                        }
                    } catch (e) {
                        console.error('[CompletedConsultation] fetch error:', e);
                    }
                };
                fetchConsultation();
            }
        }
    }, [id, doctorPastConsultations, upcomingConsultations, isLoaded, session]);

    useEffect(() => {
        if (consultation && session) {
            const fetchData = async () => {
                setLoadingHistory(true);
                try {
                    const api = createApiClient(session, refreshSessionToken);
                    const consultApi = createConsultationsApi(api);

                    const [historyRes, resultRes] = await Promise.all([
                        consultApi.getPatientHistory(consultation.id).catch(() => null),
                        consultApi.getResults(consultation.id).catch(() => null)
                    ]);

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
                } catch (error) {
                    console.error('[CompletedConsultation] Error fetching extra data:', error);
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

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigateBack()} style={styles.backButton}>
                    <Icon name="arrow-back" size={sizes.scale(24)} color={colors.p500} />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>
                    {t(getTitleKey(consultation.status))}
                </Text>
                {isCompleted && consultation.hasResult && !consultation.is_draft ? (
                    <TouchableOpacity
                        style={styles.headerEditBtn}
                        onPress={() => {
                            openConsultationById(consultation.id, 'form', 'history');
                        }}
                    >
                        <Icon name="edit" size={sizes.scale(16)} color={colors.p500} />
                        <Text style={styles.headerEditText}>{t('doctor_history.edit', 'Edit')}</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={{ width: sizes.scale(48) }} />
                )}
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* UPCOMING: Reminder Pill */}
                {isScheduled && getReminderText() && (
                    <View style={styles.reminderPill}>
                        <Icon name="clock" size={sizes.scale(16)} color={colors.info} />
                        <Text style={styles.reminderText}>{getReminderText()}</Text>
                    </View>
                )}

                {/* Patient Info Card */}
                <TouchableOpacity
                    style={[styles.patientCard, { backgroundColor: typeConfig.bg, borderColor: typeConfig.borderColor }]}
                    onPress={() => navigateToHistoryPatientProfile(consultation.patientId)}
                >
                    <View style={[styles.patientAvatar, { backgroundColor: typeConfig.color }]}>
                        <Icon name="profile" size={sizes.scale(24)} color={colors.white} />
                    </View>
                    <View style={styles.patientInfo}>
                        <Text style={styles.patientName}>
                            {consultation.patientName || t('doctor_history.label_patient')}
                        </Text>
                        {consultation.patientMeta ? (
                            <Text style={[styles.patientMeta, { color: typeConfig.color }]}>
                                {translateMeta(consultation.patientMeta)}
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

                {/* COMPLETED: Diagnosis & Notes */}
                {isCompleted && (
                    <View style={styles.resultsContainer}>
                        {consultation.hasResult ? (
                            <ResultBlocks consultation={consultation} styles={styles} colors={colors} sizes={sizes} t={t} />
                        ) : (
                            <View style={styles.notesCard}>
                                <View style={styles.notesHeader}>
                                    <Text style={styles.notesTitle}>{t('doctor_history.diagnosis_notes_title')}</Text>
                                </View>
                                <View style={styles.notesReadOnlyContainer}>
                                    <Text style={styles.notesPlaceholder}>{t('doctor_history.diagnosis_empty')}</Text>
                                </View>
                            </View>
                        )}

                        {(!consultation.hasResult || consultation.is_draft) && (
                            <Button
                                title={consultation.hasResult ? t('doctor_history.save_send', "Save & send") : t('doctor_history.fill_results', "Fill results")}
                                variant="primary"
                                onPress={() => {
                                    openConsultationById(consultation.id, 'form', 'history');
                                }}
                                style={styles.saveBtn}
                                textStyle={styles.saveBtnText}
                            />
                        )}
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
                    title={t('doctor_history.view_patient_profile')}
                    variant="outlined"
                    iconRight={<Icon name="arrow-right" size={sizes.scale(20)} color={colors.p500} />}
                    onPress={() => navigateToHistoryPatientProfile(consultation.patientId)}
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

const ResultBlocks = ({ consultation, styles, colors, sizes, t }) => {
    const res = consultation.result;
    if (!res) return null;

    const patientHas = (typeof res.patient_has === 'string' ? JSON.parse(res.patient_has) : res.patient_has) || [];
    const recommendations = (typeof res.recommendations === 'string' ? JSON.parse(res.recommendations) : res.recommendations) || [];
    const nextSteps = (typeof res.next_steps === 'string' ? JSON.parse(res.next_steps) : res.next_steps) || [];

    return (
        <View style={styles.resultBlocksWrapper}>
            {/* Overview */}
            {(res.overview || patientHas.length > 0) && (
                <View style={styles.resultBlock}>
                    <Text style={styles.resultBlockTitle}>{t('doctor_history.overview', 'Overview')}</Text>
                    <View style={styles.resultCard}>
                        {res.overview ? <Text style={styles.resultText}>{res.overview}</Text> : null}
                        {patientHas.length > 0 && (
                            <View style={[styles.bulletList, res.overview && { marginTop: sizes.scale(12) }]}>
                                {patientHas.map((item, idx) => (
                                    <View key={idx} style={styles.bulletRow}>
                                        <View style={styles.bulletDot} />
                                        <Text style={styles.bulletText}>{item}</Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                </View>
            )}

            {/* Diagnosis */}
            {(res.diagnosis_icd10 || res.diagnosis_name) && (
                <View style={styles.resultBlock}>
                    <Text style={styles.resultBlockTitle}>{t('doctor_history.diagnosis', 'Diagnosis')}</Text>
                    <View style={[styles.resultCard, { flexDirection: 'row', alignItems: 'center' }]}>
                        <View style={styles.diagIconBox}>
                            <Icon name="stethoscope" size={sizes.scale(20)} color={colors.sCoral || colors.sCoral} />
                        </View>
                        <Text style={styles.diagText}>
                            {[res.diagnosis_icd10, res.diagnosis_name].filter(Boolean).join(', ')}
                        </Text>
                    </View>
                </View>
            )}

            {/* Recommendations */}
            {recommendations.length > 0 && (
                <View style={styles.resultBlock}>
                    <Text style={styles.resultBlockTitle}>{t('doctor_history.recommendations', 'Recommendations')}</Text>
                    <View style={styles.resultCard}>
                        {recommendations.map((item, idx) => (
                            <View key={idx} style={styles.iconListRow}>
                                <View style={[styles.iconListBadge, { backgroundColor: colors.sPink + '22' }]}>
                                    <Icon name="file-text" size={sizes.scale(16)} color={colors.sPink || colors.sPink} />
                                </View>
                                <Text style={styles.iconListText}>{item}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            )}

            {/* Next steps */}
            {nextSteps.length > 0 && (
                <View style={styles.resultBlock}>
                    <Text style={styles.resultBlockTitle}>{t('doctor_history.next_steps', 'Next steps')}</Text>
                    <View style={styles.resultCard}>
                        {nextSteps.map((item, idx) => (
                            <View key={idx} style={styles.iconListRow}>
                                <View style={[styles.iconListBadge, { backgroundColor: colors.sCoral + '22' }]}>
                                    <Icon name="arrow-right-circle" size={sizes.scale(16)} color={colors.sCoral || colors.sCoral} />
                                </View>
                                <Text style={styles.iconListText}>{item}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            )}

            {/* Prescription */}
            {res.prescriptions ? (
                <View style={styles.resultBlock}>
                    <Text style={styles.resultBlockTitle}>{t('doctor_history.prescription', 'Prescription')}</Text>
                    <View style={styles.resultCard}>
                        <View style={styles.iconListRow}>
                            <View style={[styles.iconListBadge, { backgroundColor: colors.sBlue + '22' }]}>
                                <Icon name="pill" size={sizes.scale(16)} color={colors.sBlue || colors.sBlue} />
                            </View>
                            <Text style={styles.iconListText}>{res.prescriptions}</Text>
                        </View>
                    </View>
                </View>
            ) : null}
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
        paddingHorizontal: theme.sizes.spacing.m,
        paddingTop: theme.sizes.spacing.m,
        paddingBottom: theme.sizes.spacing.s,
        backgroundColor: theme.colors.bg,
        justifyContent: 'space-between',
    },
    backButton: {
        width: theme.sizes.scale(48),
        alignItems: 'flex-start',
    },
    headerTitle: {
        flex: 1,
        ...theme.sizes.typography.h3,
        color: theme.colors.n900,
        fontFamily: 'Manrope_700Bold',
        textAlign: 'center',
    },
    headerEditBtn: {
        width: theme.sizes.scale(48),
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: theme.sizes.scale(4),
    },
    headerEditText: {
        ...theme.sizes.typography.bodyMedium,
        color: theme.colors.p500,
        fontFamily: 'Manrope_600SemiBold',
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

    /* ── Buttons ── */
    saveBtn: {
        height: theme.sizes.scale(50),
        marginTop: theme.sizes.spacing.l,
    },
    saveBtnText: {
        fontFamily: 'Manrope_600SemiBold',
    },
    resultsContainer: {
        width: '100%',
    },
    resultBlocksWrapper: {
        gap: theme.sizes.spacing.l,
        marginBottom: theme.sizes.spacing.l,
    },
    resultBlock: {
        width: '100%',
    },
    resultBlockTitle: {
        ...theme.sizes.typography.h4,
        color: theme.colors.n900,
        fontFamily: 'Manrope_700Bold',
        marginBottom: theme.sizes.spacing.s,
    },
    resultCard: {
        backgroundColor: theme.colors.white,
        borderRadius: theme.sizes.borderRadius.large,
        padding: theme.sizes.spacing.m,
        shadowColor: /* TODO: color */ '#000',
        shadowOffset: { width: theme.sizes.scale(0), height: theme.sizes.scale(2) },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
    },
    resultText: {
        ...theme.sizes.typography.bodyMedium,
        color: theme.colors.n900,
        lineHeight: theme.sizes.scale(22),
    },
    bulletList: {
        gap: theme.sizes.spacing.s,
    },
    bulletRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    bulletDot: {
        width: theme.sizes.scale(6),
        height: theme.sizes.scale(6),
        borderRadius: theme.sizes.scale(3),
        backgroundColor: theme.colors.p500,
        marginTop: theme.sizes.scale(8),
        marginRight: theme.sizes.scale(8),
    },
    bulletText: {
        flex: 1,
        ...theme.sizes.typography.bodyMedium,
        color: theme.colors.n900,
        lineHeight: theme.sizes.scale(22),
    },
    diagIconBox: {
        width: theme.sizes.scale(40),
        height: theme.sizes.scale(40),
        borderRadius: theme.sizes.borderRadius.medium,
        backgroundColor: theme.colors.sCoral + '22',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: theme.sizes.spacing.m,
    },
    diagText: {
        flex: 1,
        ...theme.sizes.typography.bodyMedium,
        color: theme.colors.n900,
        fontFamily: 'Manrope_600SemiBold',
    },
    iconListRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.sizes.spacing.m,
    },
    iconListBadge: {
        width: theme.sizes.scale(32),
        height: theme.sizes.scale(32),
        borderRadius: theme.sizes.borderRadius.small,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: theme.sizes.spacing.m,
    },
    iconListText: {
        flex: 1,
        ...theme.sizes.typography.bodyMedium,
        color: theme.colors.n900,
    },
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
