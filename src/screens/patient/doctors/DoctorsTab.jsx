import React, { useEffect } from 'react';
import { ScrollView, View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useComponentContext } from '../../../context/GlobalContext';
import { useStyles } from '../../../theme/useStyles';
import { Screen } from '../../../components/ui/Screen';
import { Icon } from '../../../components/ui/Icon';
import { VIPDoctorCard } from '../../../components/doctor/VIPDoctorCard';
import { RegularDoctorCard } from '../../../components/doctor/RegularDoctorCard';
import { DoctorProfile } from './extra-screens/DoctorProfile';
import { BookingSummary } from './extra-screens/BookingSummary';

export function DoctorsTab() {
  const { t } = useTranslation();
  const { doctorController, themeController: { colors, sizes } } = useComponentContext();
  const { 
    doctors, 
    recommendedDoctors, 
    regularDoctors, 
    currentDoctorView, 
    fetchDoctors, 
    selectDoctor 
  } = doctorController;
  
  const styles = useStyles(themeStyles);

  useEffect(() => {
    if (doctors.length === 0) {
      fetchDoctors();
    }
  }, []);

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
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton}>
             <Icon name="ArrowLeft" size={24} color={colors.p500} />
          </TouchableOpacity>
          <Text style={styles.title}>{t('doctors.recommended_title')}</Text>
        </View>

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={recommendedDoctors}
          renderItem={({ item }) => (
            <VIPDoctorCard 
              doctor={item} 
              onPress={() => selectDoctor(item)} 
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.vipList}
        />

        <View style={styles.sectionHeader}>
           <Text style={styles.subtitle}>{t('doctors.all_doctors')}</Text>
        </View>

        {regularDoctors.map((doctor) => (
          <RegularDoctorCard 
            key={doctor.id}
            doctor={doctor}
            onProfilePress={() => selectDoctor(doctor)}
            onBookPress={() => selectDoctor(doctor)}
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
    paddingHorizontal: theme.sizes.spacing.l,
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
    ...theme.sizes.typography.h2,
    color: theme.colors.n900,
  },
  vipList: {
    paddingBottom: theme.sizes.spacing.l,
  },
  sectionHeader: {
    marginVertical: theme.sizes.spacing.m,
  },
  subtitle: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n900,
  }
});
