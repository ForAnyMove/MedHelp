import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useComponentContext } from '../../../../context/GlobalContext';
import { usePatientDashboard } from '../../../../context/PatientDashboardContext';
import { useStyles } from '../../../../theme/useStyles';
import { formatIsoDate, computeConsultationTime } from '../../../../utils/dateUtils';
import { Icon } from '../../../../components/ui/Icon';
import { Button } from '../../../../components/ui/Button';
import { RegularDoctorCard } from '../../../../components/doctor/RegularDoctorCard';

export function ConsultationSummary({ booking, onClose }) {
  const { t } = useTranslation();
  const { doctorController, themeController: { colors, sizes } } = useComponentContext();
  const { setTabIndex } = usePatientDashboard();
  const styles = useStyles(themeStyles);

  if (!booking) {
    return null;
  }

  const doctor = booking.doctor;

  const timeString = computeConsultationTime(booking, t);

  const handleHistory = () => {
    onClose(); // Reset session status to idle
    setTabIndex(3); // History tab
  };

  const handleBookNext = () => {
    onClose();
    doctorController.selectDoctor(doctor);
    setTabIndex(1); // Doctors tab
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Icon name="arrow-back" size={sizes.scale(24)} color={colors.p500} />
        </TouchableOpacity>
      </View>

      <View style={styles.titleContainer}>
        <Text style={styles.title}>{t('consultation.summary_title')}</Text>
        <Text style={styles.subtitle}>{t('consultation.completed')} <Text style={styles.bold}>{t('consultation.duration_val', { duration: booking.duration })}</Text></Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.summaryCardWrapper}>
          <RegularDoctorCard
            doctor={doctor}
            variant="compact"
            onProfilePress={() => { }}
            containerStyle={styles.doctorCard}
            customSubtitle={`${t('dashboard.consultation_title')}: ${t('doctors.online').charAt(0).toUpperCase() + t('doctors.online').slice(1)}`}
          />

          <View style={styles.cardDivider} />

          <View style={styles.section}>
            <Text style={styles.description}>
              {booking.summary || timeString}
            </Text>
            {(booking.findings && booking.findings.length > 0) ? (
              <>
                <Text style={styles.infoText}>{t('consultation.you_have')}</Text>
                {booking.findings.map((finding, index) => (
                  <View key={index} style={styles.bulletRow}>
                    <View style={styles.bullet} />
                    <Text style={styles.bulletText}>{finding}</Text>
                  </View>
                ))}
              </>
            ) : (
              <>
                <Text style={styles.infoText}>{t('consultation.you_have')}</Text>
                <View style={styles.bulletRow}>
                  <View style={styles.bullet} />
                  <Text style={styles.bulletText}>{t('consultation.finding_ferritin')}</Text>
                </View>
                <View style={styles.bulletRow}>
                  <View style={styles.bullet} />
                  <Text style={styles.bulletText}>{t('consultation.finding_cholesterol')}</Text>
                </View>
                <View style={styles.bulletRow}>
                  <View style={styles.bullet} />
                  <Text style={styles.bulletText}>{t('consultation.finding_monitoring')}</Text>
                </View>
              </>
            )}
          </View>
        </View>

        <Text style={styles.sectionTitle}>{t('consultation.recommendations')}</Text>
        <View style={styles.card}>
          {(booking.recommendations || [
            { id: 1, text: t('symptoms.rec_4'), icon: 'anemia', color: colors.sPink },
            { id: 2, text: t('symptoms.rec_5'), icon: 'anemia', color: colors.p500 },
            { id: 3, text: t('symptoms.rec_6'), icon: 'anemia', color: colors.sCoral },
            { id: 4, text: t('symptoms.rec_7'), icon: 'anemia', color: colors.sYell },
          ]).map(item => (
            <View key={item.id} style={styles.recItem}>
              <Icon name={item.icon} size={sizes.scale(24)} color={item.color} wrapperStyle={styles.recIcon} wrapped />
              <Text style={styles.recText}>{item.text}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>{t('consultation.next_steps')}</Text>
        <View style={styles.card}>
          {(booking.nextSteps || [
            { id: 5, text: t('symptoms.rec_4'), icon: 'anemia', color: colors.sPink },
            { id: 6, text: t('symptoms.rec_5'), icon: 'anemia', color: colors.p500 },
          ]).map(item => (
            <View key={item.id} style={styles.recItem}>
              <Icon name={item.icon} size={sizes.scale(24)} color={item.color} wrapperStyle={styles.recIcon} wrapped />
              <Text style={styles.recText}>{item.text}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Button
            title={t('consultation.view_history')}
            variant="outlined"
            style={styles.footerBtn}
            onPress={handleHistory}
          />
          <Button
            title={t('consultation.book_next')}
            variant="primary"
            style={styles.footerBtn}
            onPress={handleBookNext}
          />
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.sizes.spacing.m,
    paddingTop: theme.sizes.spacing.m,
    paddingBottom: theme.sizes.spacing.s,
  },
  titleContainer: {
    paddingHorizontal: theme.sizes.spacing.m,
    paddingBottom: theme.sizes.spacing.s,
  },
  backButton: {
    marginRight: theme.sizes.spacing.m,
  },
  title: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n700,
  },
  subtitle: {
    ...theme.sizes.typography.bodyLarge,
    color: theme.colors.n500,
  },
  bold: {
    color: theme.colors.n900,
  },
  scrollContent: {
    paddingHorizontal: theme.sizes.spacing.m,
    paddingBottom: theme.sizes.spacing.xl,
  },
  summaryCardWrapper: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
    marginBottom: theme.sizes.spacing.l,
  },
  cardDivider: {
    height: 1,
    backgroundColor: theme.colors.n200,
    marginHorizontal: theme.sizes.spacing.m,
  },
  doctorCard: {
    marginVertical: 0,
    marginBottom: 0,
    marginTop: 0,
    borderWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
    backgroundColor: 'transparent',
    paddingBottom: theme.sizes.spacing.s,
  },
  section: {
    padding: theme.sizes.spacing.m,
    paddingTop: theme.sizes.spacing.m,
  },
  description: {
    ...theme.sizes.typography.bodyLarge,
    fontSize: theme.sizes.scale(15),
    color: theme.colors.n700,
    marginBottom: theme.sizes.spacing.xs,
  },
  infoText: {
    ...theme.sizes.typography.bodyLarge,
    color: theme.colors.n700,
    marginBottom: theme.sizes.spacing.xs,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.sizes.spacing.s,
    paddingLeft: theme.sizes.spacing.s,
  },
  bullet: {
    width: theme.sizes.scale(6),
    height: theme.sizes.scale(6),
    borderRadius: theme.sizes.scale(3),
    backgroundColor: theme.colors.p500,
    marginRight: theme.sizes.spacing.s,
  },
  bulletText: {
    ...theme.sizes.typography.bodyLarge,
    fontSize: theme.sizes.scale(15),
    color: theme.colors.n700,
    flex: 1,
  },
  sectionTitle: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n700,
    marginBottom: theme.sizes.spacing.s,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.m,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    gap: theme.sizes.spacing.s,
  },
  recItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recIcon: {
    width: theme.sizes.scale(32),
    height: theme.sizes.scale(32),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.sizes.spacing.m,
  },
  recText: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n700,
    flex: 1,
  },
  footer: {
    marginTop: theme.sizes.spacing.l,
    gap: theme.sizes.spacing.m,
  },
  footerBtn: {
    height: theme.sizes.scale(58),
    width: '100%',
  }
});
