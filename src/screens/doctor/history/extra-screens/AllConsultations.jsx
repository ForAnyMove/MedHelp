import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useComponentContext } from '../../../../context/GlobalContext';
import { useDoctorDashboard } from '../../../../context/DoctorDashboardContext';
import { useStyles } from '../../../../theme/useStyles';
import { Icon } from '../../../../components/ui/Icon';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { formatIsoDate } from '../../../../utils/dateUtils';
import { useTheme } from '../../../../theme/ThemeContext';

const FILTERS = ['All', 'Completed', 'Upcoming', 'Canceled'];

export function AllConsultations({ activeSegment = true }) {
    const { t } = useTranslation();
    const { historyController } = useComponentContext();
    const { doctorPastConsultations } = historyController;
    const { navigateToHistoryDetail, navigateBack } = useDoctorDashboard();
    const router = useRouter();
    const styles = useStyles(themeStyles);
    const { colors, sizes } = useTheme();

    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');

    const dataToUse = doctorPastConsultations;

    const filteredData = useMemo(() => {
        if (!dataToUse) return [];
        let data = [...dataToUse];

        if (activeSegment === false) {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            data = data.filter(c => new Date(c.date) >= weekAgo);
        }

        if (activeFilter === 'Completed') {
            data = data.filter(c => c.status === 'completed');
        } else if (activeFilter === 'Upcoming') {
            data = data.filter(c => c.status === 'scheduled');
        } else if (activeFilter === 'Canceled') {
            data = data.filter(c => c.status === 'canceled');
        }

        if (searchQuery.trim() !== '') {
            data = data.filter(c =>
                (c.patientName || '').toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Sort descending by date
        data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return data;
    }, [dataToUse, activeFilter, searchQuery]);

    // Group by formatted date
    const groupedData = useMemo(() => {
        const groups = {};
        filteredData.forEach(item => {
            const dateKey = formatIsoDate(item.date, 'medium', t); // e.g. "Jun 8" or "June 26"
            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(item);
        });
        return groups;
    }, [filteredData, t]);

    const handlePress = (id) => {
        navigateToHistoryDetail(id);
    };

    const getIconProps = (status) => {
        if (status === 'scheduled') return { name: 'calendar', color: colors.info, bg: colors.info + '22' };
        if (status === 'canceled') return { name: 'calendar-x', color: colors.danger, bg: colors.danger + '22' };
        return { name: 'stethoscope', color: colors.p500, bg: colors.p100 };
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={navigateBack} style={styles.backButton}>
                    <Icon name="arrow-back" size={sizes.scale(24)} color={colors.p500} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('doctor_history.all_consultations', 'All Consultations')}</Text>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{t('doctor_history.total_consultations', '{{count}} total', { count: filteredData.length })}</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <Icon name="search" size={sizes.scale(20)} color={colors.p500} style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder={t('doctor_history.search_patient', 'Search by patient')}
                        placeholderTextColor={colors.n400}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                {/* Filters */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContainer}>
                    {FILTERS.map(filter => {
                        const isActive = activeFilter === filter;
                        return (
                            <TouchableOpacity
                                key={filter}
                                style={[styles.filterChip, isActive && styles.filterChipActive]}
                                onPress={() => setActiveFilter(filter)}
                            >
                                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                                    {t(`doctor_history.filter_${filter.toLowerCase()}`, filter)}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* List grouped by date */}
                {Object.keys(groupedData).map(dateKey => (
                    <View key={dateKey} style={styles.groupContainer}>
                        <Text style={styles.dateHeader}>{dateKey}</Text>
                        {groupedData[dateKey].map(item => {
                            const iconProps = getIconProps(item.status);
                            return (
                                <TouchableOpacity
                                    key={item.id}
                                    style={styles.card}
                                    activeOpacity={0.8}
                                    onPress={() => handlePress(item.id)}
                                >
                                    <View style={styles.cardHeader}>
                                        <Text style={styles.dateTimeText}>
                                            {formatIsoDate(item.date, 'short', t)} • {formatIsoDate(item.date, 'time', t) || '10:00'}
                                        </Text>
                                    </View>

                                    <View style={styles.cardBody}>
                                        <View style={[styles.iconContainer, { backgroundColor: iconProps.bg }]}>
                                            <Icon name={iconProps.name} size={sizes.scale(20)} color={iconProps.color} />
                                        </View>

                                        <View style={styles.infoContainer}>
                                            <View style={styles.consultationRow}>
                                                <Text style={styles.consultationText}>
                                                    {item.status === 'scheduled' || item.status === 'canceled' ? item.patientName : t('doctor_history.consultation', 'Consultation')} •{' '}
                                                </Text>
                                                <View style={[styles.statusDot, { backgroundColor: iconProps.color }]} />
                                            </View>
                                            <Text style={styles.doctorText} numberOfLines={1}>
                                                {item.status === 'scheduled' || item.status === 'canceled' ? item.diagnosis || t('doctor_history.general', 'General') : `${item.patientName || t('doctor_history.patient', 'Patient')} • ${item.diagnosis || t('doctor_history.general', 'General')}`}
                                            </Text>
                                        </View>

                                        <Icon name="arrow-right" size={sizes.scale(20)} color={colors.p500} />
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

const themeStyles = (theme) => ({
    container: {
        flex: 1,
        backgroundColor: theme.colors.bg,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
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
    scrollContent: {
        paddingHorizontal: theme.sizes.spacing.m,
        paddingBottom: theme.sizes.spacing.xl,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.white,
        borderRadius: theme.sizes.borderRadius.large,
        paddingHorizontal: theme.sizes.spacing.m,
        height: theme.sizes.scale(56),
        marginBottom: theme.sizes.spacing.m,
        shadowColor: /* TODO: color */ '#1A9C8E',
        shadowOffset: { width: theme.sizes.scale(0), height: theme.sizes.scale(4) },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 2,
    },
    searchIcon: {
        marginRight: theme.sizes.spacing.s,
    },
    searchInput: {
        flex: 1,
        ...theme.sizes.typography.bodyMedium,
        color: theme.colors.n900,
        fontFamily: 'Manrope_500Medium',
    },
    filtersContainer: {
        flexDirection: 'row',
        marginBottom: theme.sizes.spacing.l,
        paddingRight: theme.sizes.spacing.m,
    },
    filterChip: {
        paddingHorizontal: theme.sizes.spacing.m,
        paddingVertical: theme.sizes.spacing.s,
        borderRadius: theme.sizes.borderRadius.large,
        borderWidth: 1,
        borderColor: theme.colors.p500,
        marginRight: theme.sizes.spacing.s,
        backgroundColor: 'transparent',
    },
    filterChipActive: {
        backgroundColor: theme.colors.p500,
    },
    filterChipText: {
        ...theme.sizes.typography.bodyMedium,
        color: theme.colors.p500,
        fontFamily: 'Manrope_600SemiBold',
    },
    filterChipTextActive: {
        color: theme.colors.white,
    },
    groupContainer: {
        marginBottom: theme.sizes.spacing.m,
    },
    dateHeader: {
        ...theme.sizes.typography.bodyMedium,
        color: theme.colors.n500,
        fontFamily: 'Manrope_600SemiBold',
        marginBottom: theme.sizes.spacing.s,
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
    }
});
