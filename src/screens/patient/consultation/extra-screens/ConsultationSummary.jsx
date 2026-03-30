import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useComponentContext } from '../../../../context/GlobalContext';
import { usePatientDashboard } from '../../../../context/PatientDashboardContext';
import { useStyles } from '../../../../theme/useStyles';
import { formatIsoDate } from '../../../../utils/dateUtils';
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

  const localizedDate = formatIsoDate(booking.date, 'full', t);

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
          <Icon name="ArrowLeft" size={24} color={colors.p500} />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>{t('consultation.summary_title')}</Text>
          <Text style={styles.subtitle}>{t('consultation.completed')} <Text style={styles.bold}>{booking.duration || t('consultation.duration_val')}</Text></Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <RegularDoctorCard 
          doctor={doctor} 
          variant="compact" 
          onProfilePress={() => {}}
        />

        <View style={styles.section}>
          <Text style={styles.description}>
            {booking.summary || (t('dashboard.consultation_title') + ' ' + t('dashboard.consultation_time'))}
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

        <Text style={styles.sectionTitle}>{t('consultation.recommendations')}</Text>
        <View style={styles.card}>
          {(booking.recommendations || [
            { id: 1, text: t('symptoms.rec_4'), icon: 'check', color: '#FF7D7D' },
            { id: 2, text: t('symptoms.rec_5'), icon: 'check', color: '#54DACC' },
            { id: 3, text: t('symptoms.rec_6'), icon: 'check', color: '#FFD789' },
            { id: 4, text: t('symptoms.rec_7'), icon: 'check', color: '#FFD789' },
          ]).map(item => (
            <View key={item.id} style={styles.recItem}>
              <View style={[styles.recIcon, { backgroundColor: item.color + '15' }]}>
                <Icon name={item.icon} size={16} color={item.color} />
              </View>
              <Text style={styles.recText}>{item.text}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>{t('consultation.next_steps')}</Text>
        <View style={styles.card}>
           {(booking.nextSteps || [
            { id: 5, text: t('symptoms.rec_4'), icon: 'check', color: '#FF7D7D' },
            { id: 6, text: t('symptoms.rec_5'), icon: 'check', color: '#54DACC' },
          ]).map(item => (
            <View key={item.id} style={styles.recItem}>
              <View style={[styles.recIcon, { backgroundColor: item.color + '15' }]}>
                <Icon name={item.icon} size={16} color={item.color} />
              </View>
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
    paddingHorizontal: theme.sizes.spacing.l,
    paddingTop: theme.sizes.spacing.m,
    paddingBottom: theme.sizes.spacing.m,
    backgroundColor: theme.colors.white,
  },
  backButton: {
    marginRight: theme.sizes.spacing.m,
  },
  title: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n900,
  },
  subtitle: {
    ...theme.sizes.typography.caption,
    color: theme.colors.n500,
  },
  bold: {
    fontWeight: '700',
    color: theme.colors.n900,
  },
  scrollContent: {
    paddingHorizontal: theme.sizes.spacing.l,
    paddingTop: theme.sizes.spacing.m,
    paddingBottom: theme.sizes.spacing.xl,
  },
  section: {
    marginTop: theme.sizes.spacing.l,
  },
  description: {
    ...theme.sizes.typography.body,
    color: theme.colors.n800,
    marginBottom: theme.sizes.spacing.s,
  },
  infoText: {
    ...theme.sizes.typography.body,
    fontWeight: '600',
    color: theme.colors.n900,
    marginBottom: theme.sizes.spacing.s,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: theme.sizes.spacing.s,
    paddingLeft: theme.sizes.spacing.s,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.p500,
    marginTop: 8,
    marginRight: theme.sizes.spacing.s,
  },
  bulletText: {
    ...theme.sizes.typography.bodySmall,
    color: theme.colors.n700,
    flex: 1,
  },
  sectionTitle: {
    ...theme.sizes.typography.h4,
    color: theme.colors.n900,
    marginTop: theme.sizes.spacing.xl,
    marginBottom: theme.sizes.spacing.m,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: 24,
    padding: theme.sizes.spacing.m,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  recItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.sizes.spacing.m,
  },
  recIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.sizes.spacing.m,
  },
  recText: {
    ...theme.sizes.typography.bodySmall,
    color: theme.colors.n800,
    flex: 1,
  },
  footer: {
    marginTop: theme.sizes.spacing.xxl,
    gap: theme.sizes.spacing.m,
  },
  footerBtn: {
    width: '100%',
  }
});
