import React from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../theme/ThemeContext';
import { useStyles } from '../../../../theme/useStyles';
import { Button } from '../../../../components/ui/Button';
import { SubViewScreen } from '../../../../components/common/SubViewScreen';

export function PatientCard({ consultation, onBack, onViewDetails, onStartConsultation }) {
  const { t } = useTranslation();
  const styles = useStyles(themeStyles);
  
  if (!consultation) return null;
  const { patient } = consultation;

  return (
    <SubViewScreen title={t('doctor_consultation.patient_card')} onBack={onBack}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.profileRow}>
            <Image source={{ uri: patient.avatarUrl }} style={styles.avatar} />
            <View style={styles.infoCol}>
              <Text style={styles.name}>{patient.firstName} {patient.lastName}, {patient.age} y.o.</Text>
              <Text style={styles.subtitle}>{t('doctor_dashboard.new_symptoms')}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.statsRow}>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>{t('doctor_consultation.shared_with_you')}</Text>
              <View style={styles.bulletRow}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>{t('doctor_consultation.analyses')}</Text>
              </View>
              <View style={styles.bulletRow}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>{t('doctor_consultation.ai_summary')}</Text>
              </View>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>{t('doctor_consultation.key_points')}</Text>
              {patient.keyPoints?.map((point, idx) => (
                <View key={idx} style={styles.bulletRow}>
                  <View style={[styles.bullet, { backgroundColor: '#7EF1E4' }]} />
                  <Text style={styles.bulletText}>{point}</Text>
                </View>
              ))}
            </View>
          </View>

          <TouchableOpacity style={styles.viewDetails} onPress={onViewDetails}>
            <Text style={styles.viewDetailsText}>{t('doctor_consultation.view_details')}</Text>
          </TouchableOpacity>

          <Button 
            title={t('doctor_consultation.start_consultation')} 
            variant="primary" 
            onPress={onStartConsultation}
            style={styles.startButton}
          />
        </View>
      </ScrollView>
    </SubViewScreen>
  );
}

const themeStyles = (theme) => ({
  scrollContent: {
    paddingHorizontal: theme.sizes.spacing.l,
    paddingBottom: theme.sizes.spacing.xl,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.xl,
    padding: theme.sizes.spacing.l,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
    marginTop: theme.sizes.spacing.m,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.sizes.spacing.l,
  },
  avatar: {
    width: theme.sizes.scale(80),
    height: theme.sizes.scale(80),
    borderRadius: theme.sizes.borderRadius.full,
  },
  infoCol: {
    marginLeft: theme.sizes.spacing.l,
    flex: 1,
  },
  name: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n900,
  },
  subtitle: {
    ...theme.sizes.typography.caption,
    color: theme.colors.n400,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.n200,
    marginBottom: theme.sizes.spacing.l,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: theme.sizes.spacing.xl,
  },
  statCol: {
    flex: 1,
  },
  statDivider: {
    width: 1,
    backgroundColor: theme.colors.n200,
    marginHorizontal: theme.sizes.spacing.m,
  },
  statLabel: {
    ...theme.sizes.typography.caption,
    color: theme.colors.n900,
    fontFamily: 'Manrope_700Bold',
    marginBottom: theme.sizes.spacing.s,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.p400,
    marginRight: theme.sizes.spacing.s,
  },
  bulletText: {
    ...theme.sizes.typography.caption,
    color: theme.colors.n600,
    textDecorationLine: 'underline',
  },
  viewDetails: {
    alignItems: 'center',
    marginBottom: theme.sizes.spacing.xl,
  },
  viewDetailsText: {
    ...theme.sizes.typography.h3,
    color: theme.colors.p500,
    fontFamily: 'Manrope_700Bold',
    textDecorationLine: 'underline',
  },
  startButton: {
    height: theme.sizes.scale(56),
    borderRadius: theme.sizes.borderRadius.full,
  }
});
