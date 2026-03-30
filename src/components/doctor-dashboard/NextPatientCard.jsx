import React from 'react';
import { View, Text, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeContext';
import { useStyles } from '../../theme/useStyles';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';

export function NextPatientCard({ consultation, onOpenConsultation }) {
  const { colors, sizes } = useTheme();
  const { t } = useTranslation();
  const styles = useStyles(themeStyles);

  if (!consultation) return null;

  const { patient, time, type } = consultation;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{t('doctor_dashboard.next_patient')}</Text>
      
      <View style={styles.card}>
        <View style={styles.profileRow}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: patient.avatarUrl }} style={styles.avatar} />
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.name}>{patient.firstName} {patient.lastName}, {patient.age} y</Text>
            <Text style={styles.subtitle}>{t('doctor_dashboard.new_symptoms')}</Text>
          </View>
        </View>

        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Icon name="Clock" size={16} color={colors.p500} />
            <Text style={styles.badgeText}>{time}</Text>
          </View>
          <View style={styles.badge}>
            <Icon name="MessageSquare" size={16} color={colors.p500} />
            <Text style={styles.badgeText}>{type}</Text>
          </View>
        </View>

        <Button 
          title={t('doctor_dashboard.open_consultation')} 
          variant="primary" 
          onPress={onOpenConsultation}
          style={styles.button}
        />
      </View>
    </View>
  );
}

const themeStyles = (theme) => ({
  container: {
    marginBottom: theme.sizes.spacing.l,
  },
  sectionTitle: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n900,
    marginBottom: theme.sizes.spacing.m,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.l,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.sizes.spacing.l,
  },
  avatarContainer: {
    padding: 3,
    borderRadius: theme.sizes.borderRadius.full,
    borderWidth: 2,
    borderColor: '#FF4D97', // Pink indicator as seen on screenshot
  },
  avatar: {
    width: theme.sizes.scale(60),
    height: theme.sizes.scale(60),
    borderRadius: theme.sizes.borderRadius.full,
  },
  infoCol: {
    marginLeft: theme.sizes.spacing.m,
    flex: 1,
  },
  name: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n900,
    fontFamily: 'Manrope_700Bold',
  },
  subtitle: {
    ...theme.sizes.typography.caption,
    color: theme.colors.n400,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.l,
  },
  badge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E0F9F6',
    borderRadius: theme.sizes.borderRadius.full,
    paddingVertical: theme.sizes.spacing.s,
    borderWidth: 1,
    borderColor: theme.colors.p200,
  },
  badgeText: {
    ...theme.sizes.typography.bodySmall,
    color: theme.colors.p600,
    marginLeft: theme.sizes.spacing.xs,
    fontFamily: 'Manrope_600SemiBold',
  },
  button: {
    height: theme.sizes.scale(48),
  }
});
