import React from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useComponentContext } from '../../../../context/GlobalContext';
import { useStyles } from '../../../../theme/useStyles';
import { Icon } from '../../../../components/ui/Icon';
import { Button } from '../../../../components/ui/Button';
import { DoctorAvatar } from '../../../../components/doctor/DoctorAvatar';
import { SlotPicker } from '../../../../components/doctor/SlotPicker';

export function DoctorProfile() {
  const { t } = useTranslation();
  const { doctorController, themeController: { colors, sizes } } = useComponentContext();
  const { 
    selectedDoctor, 
    availableSlots, 
    selectedSlot, 
    selectSlot, 
    navigateToSummary, 
    goBack 
  } = doctorController;
  
  const styles = useStyles(themeStyles);

  if (!selectedDoctor) return null;

  return (
    <View style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.backButton}>
             <Icon name="ArrowLeft" size={24} color={colors.p500} />
          </TouchableOpacity>
          <Text style={styles.title}>{t('doctors.profile_title')}</Text>
        </View>

        <View style={styles.profileCard}>
           <View style={styles.profileTop}>
             <DoctorAvatar 
               url={selectedDoctor.avatarUrl} 
               firstName={selectedDoctor.firstName} 
               lastName={selectedDoctor.lastName} 
               size={sizes.scale(100)}
             />
             <View style={styles.profileMainInfo}>
                <Text style={styles.doctorName}>{t('doctors.dr_prefix')}{selectedDoctor.firstName} {selectedDoctor.lastName}</Text>
               <Text style={styles.doctorSpec}>{t(selectedDoctor.specialization)}</Text>
             </View>
           </View>

           <View style={styles.statsRow}>
             <View style={styles.statItem}>
               <Text style={styles.statLabel}>{t('doctors.rating')}</Text>
               <View style={styles.statValueRow}>
                 <Icon name="Star" size={14} color={colors.sYell} />
                 <Text style={styles.statValue}>{selectedDoctor.rating} ({selectedDoctor.reviewsCount})</Text>
               </View>
             </View>
             <View style={styles.statDivider} />
             <View style={styles.statItem}>
               <Text style={styles.statLabel}>{t('doctors.experience')}</Text>
               <Text style={styles.statValue}>{selectedDoctor.experience} {t('doctors.years')}</Text>
             </View>
             <View style={styles.statDivider} />
             <View style={styles.statItem}>
               <Text style={styles.statLabel}>{t('doctors.price')}</Text>
               <Text style={styles.statValue}>${selectedDoctor.price}{t('doctors.per_hour')}</Text>
             </View>
           </View>

           <Text style={styles.description}>
             {selectedDoctor.description}
           </Text>
        </View>

        <View style={styles.bookingSection}>
          <Text style={styles.bookingTitle}>{t('doctors.book_consultation')}</Text>
          <Text style={styles.bookingSubtitle}>{t('doctors.available_dates_hint') || t('doctors.choose_datetime')}</Text>
          
          <SlotPicker 
            availableSlots={availableSlots}
            selectedSlot={selectedSlot}
            onSelectSlot={selectSlot}
          />

          <Button 
            title={t('doctors.book_btn')} 
            variant="primary" 
            disabled={!selectedSlot.date || !selectedSlot.time}
            onPress={navigateToSummary}
            style={styles.bookButton}
          />
          
          <Text style={styles.disclaimer}>{t('doctors.free_cancellation')}</Text>
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
  profileCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.l,
    marginBottom: theme.sizes.spacing.l,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.sizes.spacing.l,
  },
  profileMainInfo: {
    marginLeft: theme.sizes.spacing.m,
    flex: 1,
  },
  doctorName: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n900,
  },
  doctorSpec: {
    ...theme.sizes.typography.bodySmall,
    color: theme.colors.n700,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.sizes.spacing.l,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    ...theme.sizes.typography.caption,
    color: theme.colors.n500,
    marginBottom: theme.sizes.spacing.xs,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statValue: {
    ...theme.sizes.typography.bodySmall,
    fontFamily: 'Manrope_600SemiBold',
    color: theme.colors.n900,
    marginLeft: theme.sizes.spacing.xs,
  },
  statDivider: {
    width: 1,
    height: '60%',
    backgroundColor: theme.colors.n300,
    alignSelf: 'center',
  },
  description: {
    ...theme.sizes.typography.bodySmall,
    color: theme.colors.n700,
    lineHeight: theme.sizes.scale(22),
  },
  bookingSection: {
    marginBottom: theme.sizes.spacing.xl,
  },
  bookingTitle: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n900,
  },
  bookingSubtitle: {
    ...theme.sizes.typography.caption,
    color: theme.colors.n500,
    marginBottom: theme.sizes.spacing.m,
  },
  bookButton: {
    marginTop: theme.sizes.spacing.m,
    height: theme.sizes.scale(56),
  },
  disclaimer: {
    ...theme.sizes.typography.caption,
    color: theme.colors.n500,
    textAlign: 'center',
    marginTop: theme.sizes.spacing.m,
  }
});
