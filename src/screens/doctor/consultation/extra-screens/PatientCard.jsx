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

          <View style={styles.statsRow}>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>{t('doctor_consultation.shared_with_you')}</Text>
              <View style={styles.bulletRow}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText} numberOfLines={1}>{t('doctor_consultation.analyses')}</Text>
              </View>
              <View style={styles.bulletRow}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText} numberOfLines={1}>{t('doctor_consultation.ai_summary')}</Text>
              </View>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>{t('doctor_consultation.key_points')}</Text>
              {patient.keyPoints?.map((point, idx) => (
                <View key={idx} style={styles.bulletRow}>
                  <View style={[styles.bullet]} />
                  <Text style={[styles.bulletText, { textDecorationLine: 'underline', }]} numberOfLines={1}>{point}</Text>
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
    paddingBottom: theme.sizes.spacing.xl,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.l,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 1,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.sizes.scale(18),
  },
  avatar: {
    width: theme.sizes.scale(78),
    height: theme.sizes.scale(78),
    borderRadius: theme.sizes.borderRadius.full,
    borderWidth: 2,
    borderColor: theme.colors.pinkBorder,
  },
  infoCol: {
    marginLeft: theme.sizes.spacing.l,
    flex: 1,
  },
  name: {
    ...theme.sizes.typography.h4,
    color: theme.colors.n700,
  },
  subtitle: {
    ...theme.sizes.typography.bodyLarge,
    fontSize: theme.sizes.scale(15),
    color: theme.colors.n500,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.n200,
    marginBottom: theme.sizes.spacing.s,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: theme.sizes.spacing.m,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: theme.colors.n200,
    borderBottomColor: theme.colors.n200,
    paddingVertical: theme.sizes.spacing.xs,
  },
  statCol: {
    flex: 1,
  },
  statDivider: {
    width: 1,
    backgroundColor: theme.colors.n200,
    marginHorizontal: theme.sizes.spacing.l,
  },
  statLabel: {
    ...theme.sizes.typography.bodyLarge,
    color: theme.colors.n700,
    fontFamily: 'Manrope_600SemiBold',
    marginBottom: theme.sizes.spacing.s,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.sizes.spacing.xs,
  },
  bullet: {
    width: theme.sizes.scale(6),
    height: theme.sizes.scale(6),
    borderRadius: theme.sizes.borderRadius.full,
    backgroundColor: theme.colors.p500,
    marginRight: theme.sizes.spacing.s,
  },
  bulletText: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n700,
  },
  viewDetails: {
    alignItems: 'center',
    marginBottom: theme.sizes.spacing.m,
  },
  viewDetailsText: {
    ...theme.sizes.typography.h3,
    color: theme.colors.p400,
    textDecorationLine: 'underline',
  },
  startButton: {
    height: theme.sizes.scale(48),
    borderRadius: theme.sizes.borderRadius.full,
  }
});
