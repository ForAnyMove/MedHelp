import React, { useEffect } from 'react';
import { ScrollView, View, Text, FlatList, TouchableOpacity, useWindowDimensions, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useComponentContext } from '../../../context/GlobalContext';
import { useStyles } from '../../../theme/useStyles';
import { Screen } from '../../../components/ui/Screen';
import { Icon } from '../../../components/ui/Icon';
import { VIPDoctorCard } from '../../../components/doctor/VIPDoctorCard';
import { RegularDoctorCard } from '../../../components/doctor/RegularDoctorCard';
import { DoctorProfile } from './extra-screens/DoctorProfile';
import { BookingSummary } from './extra-screens/BookingSummary';
import { SearchComponent } from '../../../components/ui/SearchComponent';
import { useSession } from '../../../context/SessionContext';
import { usePatientDashboard } from '../../../context/PatientDashboardContext';
import { useResponsive } from '../../../theme/useResponsive';

export function DoctorsTab() {
  const { t, i18n } = useTranslation();
  const { doctorController, themeController: { colors, sizes } } = useComponentContext();
  const responsive = useResponsive();
  const isLandscapeLayout = !responsive?.isPortraitShell && (responsive?.isDesktop || responsive?.isDesktopWide || responsive?.isUltrawide || responsive?.isTabletLandscape);
  const { getProfessions } = useSession();
  const {
    doctors,
    recommendedDoctors,
    regularDoctors,
    currentDoctorView,
    setCurrentDoctorView,
    fetchDoctors,
    selectDoctor,
    selectedDoctor,
    selectedSlot
  } = doctorController;

  const { width } = useWindowDimensions();
  const styles = useStyles(themeStyles);

  const cardWidth = width - sizes.spacing.m * 2;

  const [searchQuery, setSearchQuery] = React.useState('');
  const [professions, setProfessions] = React.useState([]);

  useEffect(() => {
    if (doctors.length === 0) {
      fetchDoctors();
    }
    getProfessions(i18n.language).then(setProfessions).catch(console.error);
  }, [i18n.language]);

  const filteredDoctors = React.useMemo(() => {
    let filtered = regularDoctors;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doc => {
        const matchesBasic = 
          (doc.firstName || '').toLowerCase().includes(query) ||
          (doc.lastName || '').toLowerCase().includes(query) ||
          (doc.fullName || '').toLowerCase().includes(query) ||
          (doc.specialization || '').toLowerCase().includes(query) ||
          t(doc.specialization || '').toLowerCase().includes(query);

        if (matchesBasic) return true;

        const profCode = (doc.specialization || '').replace('professions.', '');
        if (profCode.toLowerCase().includes(query)) return true;

        const matchingProf = professions.find(p => p.code === profCode);
        if (matchingProf && matchingProf.name.toLowerCase().includes(query)) {
          return true;
        }

        return false;
      });
    }

    // Always sort by rating from high to load
    return [...filtered].sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }, [regularDoctors, searchQuery, t, professions]);

  const { tabIndex, updateUrlParams, doctorFilter, setDoctorFilter } = usePatientDashboard();

  const [popstateTick, setPopstateTick] = React.useState(0);
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.addEventListener) return;
    const handlePop = () => setPopstateTick(t => t + 1);
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  // Handle URL & Context filter sync
  useEffect(() => {
    if (tabIndex === 1) {
      let activeFilter = doctorFilter;
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
        const searchParams = new URLSearchParams(window.location.search);
        const view = searchParams.get('view');
        const id = searchParams.get('id');
        
        if (view === 'profile' || view === 'summary') {
          if (doctors.length > 0 && id) {
            const doc = doctors.find(d => d.id === id);
            if (doc && (!selectedDoctor || selectedDoctor.id !== id)) {
              selectDoctor(doc);
            }
            
            if (view === 'summary') {
              if (!selectedSlot?.date) {
                // Redirect back to profile if slot is missing (e.g. page refreshed)
                setCurrentDoctorView('profile');
                if (updateUrlParams) updateUrlParams('doctors', 'profile', id);
              } else {
                setCurrentDoctorView('summary');
              }
            } else if (!selectedDoctor) {
              setCurrentDoctorView('profile');
            }
          }
        } else {
          setCurrentDoctorView('list');
        }

        if (!activeFilter) {
          const rawFilter = searchParams.get('filter');
          if (rawFilter && rawFilter !== 'all') {
            activeFilter = rawFilter;
          }
        }
      }

      if (activeFilter && typeof activeFilter === 'string' && activeFilter !== 'all') {
        const found = professions.find(p => p.code === activeFilter);
        if (found) {
          setSearchQuery(found.name);
        } else {
          const translatedFilter = t(`specializations.${activeFilter}`, t(`professions.${activeFilter}`, activeFilter));
          if (translatedFilter && typeof translatedFilter === 'string' && !translatedFilter.startsWith('[object')) {
            setSearchQuery(translatedFilter);
          }
        }
      } else {
        setSearchQuery(prev => (prev === 'all' || prev === '[object Object]' ? '' : prev));
      }
    }
  }, [tabIndex, doctorFilter, doctors.length, professions, popstateTick]);

  // Wrap selectDoctor to push URL
  const handleSelectDoctor = (doctor) => {
    selectDoctor(doctor);
    if (updateUrlParams) {
      updateUrlParams('doctors', 'profile', doctor.id);
    }
  };

  if (currentDoctorView === 'profile') {
    return <DoctorProfile />;
  }

  if (currentDoctorView === 'summary') {
    return <BookingSummary />;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {recommendedDoctors.length > 0 && (
          <>
            <View style={styles.header}>
              <Text style={styles.title}>{t('doctors.recommended_title')}</Text>
            </View>

            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={recommendedDoctors}
              renderItem={({ item }) => (
                <VIPDoctorCard
                  doctor={item}
                  onPress={() => handleSelectDoctor(item)}
                />
              )}
              keyExtractor={(item) => item.id}
              contentContainerStyle={[styles.vipList, { paddingRight: sizes.spacing.l }]}
              snapToInterval={isLandscapeLayout ? sizes.scale(380) : cardWidth + sizes.spacing.m}
              decelerationRate="fast"
              snapToAlignment="start"
            />
          </>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.subtitle}>{t('doctors.all_doctors')}</Text>
        </View>

        <SearchComponent
          mode="doctors"
          placeholder={t('doctors.search_placeholder', 'Search doctors...')}
          value={searchQuery}
          onChangeText={setSearchQuery}
          professions={professions}
        />

        {filteredDoctors.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="search" size={sizes.scale(44)} color={colors.n300} />
            <Text style={styles.emptyTitle}>{t('doctors.no_doctors_found', 'Врачи не найдены')}</Text>
            <Text style={styles.emptyDesc}>{t('doctors.try_another_search', 'Попробуйте изменить поисковый запрос')}</Text>
          </View>
        ) : isLandscapeLayout ? (
          <View style={styles.desktopDoctorGrid}>
            {filteredDoctors.map((doctor) => (
              <View key={doctor.id} style={styles.desktopDoctorCol}>
                <RegularDoctorCard
                  doctor={doctor}
                  onProfilePress={() => handleSelectDoctor(doctor)}
                  onBookPress={() => handleSelectDoctor(doctor)}
                  containerStyle={styles.desktopDoctorCardContainer}
                />
              </View>
            ))}
          </View>
        ) : (
          filteredDoctors.map((doctor) => (
            <RegularDoctorCard
              key={doctor.id}
              doctor={doctor}
              onProfilePress={() => handleSelectDoctor(doctor)}
              onBookPress={() => handleSelectDoctor(doctor)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const themeStyles = (theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  scrollContent: {
    paddingHorizontal: theme.responsive?.contentPadding || theme.sizes.spacing.m,
    paddingTop: theme.sizes.spacing.m,
    paddingBottom: theme.sizes.spacing.xl,
    width: '100%',
    maxWidth: theme.responsive?.isTabletLandscape || theme.responsive?.isDesktop || theme.responsive?.isDesktopLarge
      ? 1280
      : theme.responsive?.isTabletPortrait
        ? 760
        : undefined,
    alignSelf: 'center',
    marginHorizontal: 'auto',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.sizes.spacing.m,
  },
  backButton: {
    marginRight: theme.sizes.spacing.m,
  },
  title: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n700,
  },
  vipList: {
    paddingBottom: theme.sizes.spacing.m,
  },
  sectionHeader: {
    marginBottom: theme.sizes.spacing.s,
  },
  subtitle: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n700,
  },
  desktopDoctorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.sizes.spacing.m,
    marginTop: theme.sizes.spacing.xs,
    width: '100%',
  },
  desktopDoctorCol: {
    flexGrow: 0,
    width: '49%',
    minWidth: theme.sizes.scale(320),
    maxWidth: theme.sizes.scale(620),
  },
  desktopDoctorCardContainer: {
    height: '100%',
    marginBottom: 0,
    justifyContent: 'space-between',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.sizes.spacing.xl * 2,
    gap: theme.sizes.spacing.s,
  },
  emptyTitle: {
    ...theme.sizes.typography.h4,
    color: theme.colors.n700,
    marginTop: theme.sizes.spacing.s,
  },
  emptyDesc: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n500,
    textAlign: 'center',
    maxWidth: theme.sizes.scale(360),
  },
});
