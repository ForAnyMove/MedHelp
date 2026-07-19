import React, { useEffect } from 'react';
import { ScrollView, View, Text, FlatList, TouchableOpacity, useWindowDimensions } from 'react-native';
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

export function DoctorsTab() {
  const { t, i18n } = useTranslation();
  const { doctorController, themeController: { colors, sizes } } = useComponentContext();
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
      filtered = filtered.filter(doc => 
        (doc.firstName || '').toLowerCase().includes(query) ||
        (doc.lastName || '').toLowerCase().includes(query) ||
        (doc.fullName || '').toLowerCase().includes(query) ||
        (doc.specialization || '').toLowerCase().includes(query) ||
        // Check translated profession name
        t(doc.specialization || '').toLowerCase().includes(query)
      );
    }

    // Always sort by rating from high to low
    return [...filtered].sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }, [regularDoctors, searchQuery, t]);

  const { tabIndex, updateUrlParams } = usePatientDashboard();

  // Handle URL sync
  useEffect(() => {
    if (typeof window !== 'undefined' && tabIndex === 1) {
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
    }
  }, [tabIndex, doctors.length]);

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
              snapToInterval={cardWidth + sizes.spacing.m}
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

        {filteredDoctors.map((doctor) => (
          <RegularDoctorCard
            key={doctor.id}
            doctor={doctor}
            onProfilePress={() => handleSelectDoctor(doctor)}
            onBookPress={() => handleSelectDoctor(doctor)}
          />
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
  scrollContent: {
    paddingHorizontal: theme.sizes.spacing.m,
    paddingTop: theme.sizes.spacing.m,
    paddingBottom: theme.sizes.spacing.xl,
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
  }
});
