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

  const { width } = useWindowDimensions();
  const styles = useStyles(themeStyles);

  const cardWidth = width - sizes.spacing.m * 2;

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
          contentContainerStyle={[styles.vipList, { paddingRight: sizes.spacing.l }]}
          snapToInterval={cardWidth + sizes.spacing.m}
          decelerationRate="fast"
          snapToAlignment="start"
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
