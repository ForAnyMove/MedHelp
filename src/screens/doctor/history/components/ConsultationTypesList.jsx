import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useStyles } from '../../../../theme/useStyles';
import { Icon } from '../../../../components/ui/Icon';
import { useDoctorDashboard } from '../../../../context/DoctorDashboardContext';
import { formatIsoDate } from '../../../../utils/dateUtils';
import { useTheme } from '../../../../theme/ThemeContext';

function formatTime(isoDate) {
    if (!isoDate) return '';
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return '';
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function ConsultationTypesList({ title, list = [], type = 'completed' }) {
    const { t } = useTranslation();
    const styles = useStyles(themeStyles);
    const { navigateToHistoryDetail } = useDoctorDashboard();
    const { colors, sizes } = useTheme();

    const topItems = useMemo(() => {
        if (!list || list.length === 0) return [];
        const sorted = [...list].sort((a, b) => {
            const now = new Date().getTime();
            const diffA = Math.abs(now - new Date(a.date).getTime());
            const diffB = Math.abs(now - new Date(b.date).getTime());
            return diffA - diffB;
        });
        return sorted.slice(0, 2);
    }, [list]);

    const getIconProps = () => {
        switch (type) {
            case 'upcoming':
                return { name: 'calendar', color: colors.info, bg: colors.info + '22' };
            case 'canceled':
                return { name: 'calendar-x', color: colors.danger, bg: colors.danger + '22' };
            case 'completed':
                return { name: 'stethoscope', color: colors.p500, bg: colors.p100 };
            default:
                return { name: 'important', color: colors.warning, bg: colors.warning + '22' };
        }
    };

    const iconProps = getIconProps();

    const handlePress = (id) => {
        navigateToHistoryDetail(id);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{t('history.total_count', { count: list.length })}</Text>
                </View>
            </View>

            {topItems.length > 0 ? (
                topItems.map((item) => (
                    <TouchableOpacity
                        key={item.id}
                        style={styles.card}
                        activeOpacity={0.8}
                        onPress={() => handlePress(item.id)}
                    >
                        <View style={styles.cardHeader}>
                            <Text style={styles.dateTimeText}>
                                {formatIsoDate(item.date, 'short', t)} • {formatTime(item.date)}
                            </Text>
                        </View>

                        <View style={styles.cardBody}>
                            <View style={[styles.iconContainer, { backgroundColor: iconProps.bg }]}>
                                <Icon name={iconProps.name} size={sizes.scale(20)} color={iconProps.color} />
                            </View>

                            <View style={styles.infoContainer}>
                                <View style={styles.consultationRow}>
                                    <Text style={styles.consultationText}>{t('doctor_history.consultation_title')} • </Text>
                                    <View style={[styles.statusDot, { backgroundColor: iconProps.color }]} />
                                </View>
                                <Text style={styles.doctorText} numberOfLines={1}>
                                    {item.patientName || t('doctor_history.patient', 'Patient')} • {item.diagnosis || t('doctor_history.general', 'General')}
                                </Text>
                            </View>

                            <Icon name="chevron-right" size={sizes.scale(20)} color={colors.p500} />
                        </View>
                    </TouchableOpacity>
                ))
            ) : (
                <Text style={styles.noDataText}>{t('no_data', 'No data available')}</Text>
            )}
        </View>
    );
}

const themeStyles = (theme) => ({
    container: {
        marginBottom: theme.sizes.spacing.xl,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.sizes.spacing.m,
    },
    title: {
        ...theme.sizes.typography.h3,
        color: theme.colors.n900,
        fontFamily: 'Manrope_700Bold',
        marginRight: theme.sizes.spacing.s,
    },
    badge: {
        backgroundColor: /* TODO: color */ '#E0F9F6',
        paddingHorizontal: theme.sizes.spacing.s,
        paddingVertical: theme.sizes.scale(4),
        borderRadius: theme.sizes.borderRadius.large,
    },
    badgeText: {
        ...theme.sizes.typography.caption,
        color: /* TODO: color */ '#1A9C8E',
        fontFamily: 'Manrope_600SemiBold',
    },
    card: {
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
    cardHeader: {
        marginBottom: theme.sizes.spacing.s,
    },
    dateTimeText: {
        ...theme.sizes.typography.bodyMedium,
        color: theme.colors.n900,
        fontFamily: 'Manrope_600SemiBold',
    },
    cardBody: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: theme.sizes.scale(48),
        height: theme.sizes.scale(48),
        borderRadius: theme.sizes.borderRadius.medium,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.sizes.spacing.m,
    },
    infoContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    consultationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.sizes.scale(2),
    },
    consultationText: {
        ...theme.sizes.typography.bodyMedium,
        color: theme.colors.n900,
        fontFamily: 'Manrope_600SemiBold',
    },
    statusDot: {
        width: theme.sizes.scale(8),
        height: theme.sizes.scale(8),
        borderRadius: theme.sizes.scale(4),
    },
    doctorText: {
        ...theme.sizes.typography.caption,
        color: theme.colors.n500,
    },
    noDataText: {
        ...theme.sizes.typography.bodyMedium,
        color: theme.colors.n500,
    }
});