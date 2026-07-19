import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useStyles } from '../../../src/theme/useStyles';
import { useTheme } from '../../../src/theme/ThemeContext';
import { Icon } from '../../../src/components/ui/Icon';
import { useComponentContext } from '../../../src/context/GlobalContext';

export default function AllPatientsScreen() {
  const styles = useStyles(themeStyles);
  const { colors, sizes } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { consultationController } = useComponentContext();
  const { allConsultations = [] } = consultationController || {};

  const [searchQuery, setSearchQuery] = useState('');

  // Process data
  const { patientsList, stats } = useMemo(() => {
    const patientsMap = new Map();
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    allConsultations.forEach(c => {
      const pId = c.patient_profile_id;
      if (!pId) return;
      if (!patientsMap.has(pId)) {
        patientsMap.set(pId, {
          id: pId,
          profile: c.patient,
          visits: 0,
          lastVisit: null,
          hasVisitThisMonth: false,
        });
      }

      const p = patientsMap.get(pId);
      p.visits++;

      const visitDate = new Date(c.created_at);
      if (!p.lastVisit || visitDate > p.lastVisit) {
        p.lastVisit = visitDate;
      }
      if (visitDate >= thisMonthStart) {
        p.hasVisitThisMonth = true;
      }
    });

    const list = Array.from(patientsMap.values()).sort((a, b) => b.lastVisit - a.lastVisit);

    return {
      patientsList: list,
      stats: {
        total: list.length,
        thisMonth: list.filter(p => p.hasVisitThisMonth).length,
        returning: list.filter(p => p.visits > 1).length,
      }
    };
  }, [allConsultations]);

  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return patientsList;
    const lowerQ = searchQuery.toLowerCase();
    return patientsList.filter(p => {
      const name = `${p.profile?.first_name || ''} ${p.profile?.last_name || ''}`.toLowerCase();
      return name.includes(lowerQ);
    });
  }, [patientsList, searchQuery]);

  const calculateAge = (dobString) => {
    if (!dobString) return '?';
    const dob = new Date(dobString);
    const diff = Date.now() - dob.getTime();
    const age = new Date(diff);
    return Math.abs(age.getUTCFullYear() - 1970);
  };

  const formatDate = (dateObj) => {
    if (!dateObj) return '';
    return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderPatientCard = (patient) => {
    const name = `${patient.profile?.first_name || ''} ${patient.profile?.last_name || ''}`.trim() || 'Unknown';
    const age = calculateAge(patient.profile?.date_of_birth);
    const gender = patient.profile?.gender === 'male' ? 'Male' : (patient.profile?.gender === 'female' ? 'Female' : 'Unknown');
    const avatar = patient.profile?.avatar_url;

    return (
      <TouchableOpacity
        key={patient.id}
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => router.push(`/(doctor)/patients/${patient.id}`)}
      >
        {avatar ? (
          <Image source={{ uri: avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>{name.charAt(0)}</Text>
          </View>
        )}

        <View style={styles.cardInfo}>
          <Text style={styles.patientName} numberOfLines={1}>{name}</Text>
          <Text style={styles.patientSubtext}>{age} y.o. · {gender}</Text>
          <Text style={styles.patientSubtext}>Last · {formatDate(patient.lastVisit)}</Text>
        </View>

        <View style={styles.cardRight}>
          <View style={styles.visitsBadge}>
            <Text style={styles.visitsText}>{patient.visits} visits</Text>
          </View>
          <Icon name="ChevronRight" size={20} color={colors.n300} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header Area */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Icon name="ArrowLeft" size={24} color={colors.n700} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>All Patients</Text>
          <Text style={styles.headerTotalText}>{stats.total} total</Text>
        </View>

        {/* Search Bar - Teal Background Area */}
        <View style={styles.searchBackground}>
          <View style={styles.searchBar}>
            <Icon name="Search" size={20} color={colors.n400} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name"
              placeholderTextColor={colors.n400}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.thisMonth}</Text>
            <Text style={styles.statLabel}>This month</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.returning}</Text>
            <Text style={styles.statLabel}>Returning</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Recent</Text>

        <View style={styles.listContainer}>
          {filteredPatients.length > 0 ? (
            filteredPatients.map(renderPatientCard)
          ) : (
            <Text style={styles.emptyText}>No patients found.</Text>
          )}
        </View>

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
    backgroundColor: theme.colors.white,
    paddingTop: theme.sizes.spacing.xxl + 10,
    borderBottomLeftRadius: theme.sizes.borderRadius.large,
    borderBottomRightRadius: theme.sizes.borderRadius.large,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.m,
  },
  backButton: {
    padding: theme.sizes.spacing.xs,
    marginRight: theme.sizes.spacing.s,
  },
  headerTitle: {
    flex: 1,
    fontFamily: 'Manrope_700Bold',
    fontSize: theme.sizes.scale(22),
    color: theme.colors.n900,
  },
  headerTotalText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: theme.sizes.scale(14),
    color: theme.colors.p500,
  },
  searchBackground: {
    backgroundColor: theme.colors.p300,
    padding: theme.sizes.spacing.m,
    marginHorizontal: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.l,
    borderRadius: theme.sizes.borderRadius.large,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.full,
    paddingHorizontal: theme.sizes.spacing.m,
    height: theme.sizes.scale(44),
  },
  searchInput: {
    flex: 1,
    marginLeft: theme.sizes.spacing.s,
    fontFamily: 'Manrope_500Medium',
    fontSize: theme.sizes.scale(15),
    color: theme.colors.n900,
  },
  scrollContent: {
    padding: theme.sizes.spacing.m,
    paddingBottom: theme.sizes.spacing.xxl,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.sizes.spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.medium,
    padding: theme.sizes.spacing.m,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: /* TODO: color */ '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontFamily: 'Manrope_700Bold',
    fontSize: theme.sizes.scale(20),
    color: theme.colors.n900,
  },
  statLabel: {
    fontFamily: 'Manrope_500Medium',
    fontSize: theme.sizes.scale(12),
    color: theme.colors.n400,
    marginTop: 2,
  },
  sectionTitle: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: theme.sizes.scale(18),
    color: theme.colors.n500,
    marginBottom: theme.sizes.spacing.m,
  },
  listContainer: {
    gap: theme.sizes.spacing.m,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.m,
    shadowColor: /* TODO: color */ '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  avatar: {
    width: theme.sizes.scale(56),
    height: theme.sizes.scale(56),
    borderRadius: theme.sizes.scale(28),
  },
  avatarPlaceholder: {
    backgroundColor: theme.colors.p200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: theme.sizes.scale(22),
    color: theme.colors.p500,
  },
  cardInfo: {
    flex: 1,
    marginLeft: theme.sizes.spacing.m,
  },
  patientName: {
    fontFamily: 'Manrope_700Bold',
    fontSize: theme.sizes.scale(16),
    color: theme.colors.n900,
    marginBottom: 4,
  },
  patientSubtext: {
    fontFamily: 'Manrope_500Medium',
    fontSize: theme.sizes.scale(13),
    color: theme.colors.n500,
    marginBottom: 2,
  },
  cardRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: theme.sizes.scale(50),
  },
  visitsBadge: {
    backgroundColor: theme.colors.p100,
    paddingHorizontal: theme.sizes.spacing.s,
    paddingVertical: 4,
    borderRadius: theme.sizes.borderRadius.full,
  },
  visitsText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: theme.sizes.scale(12),
    color: theme.colors.p500,
  },
  emptyText: {
    fontFamily: 'Manrope_500Medium',
    fontSize: theme.sizes.scale(14),
    color: theme.colors.n500,
    textAlign: 'center',
    marginTop: theme.sizes.spacing.xl,
  }
});
