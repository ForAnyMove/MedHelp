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
            <Icon name="time" size={sizes.scale(24)} color={colors.p500} />
            <Text style={styles.badgeText}>{time}</Text>
          </View>
          <View style={styles.badge}>
            <Icon name="format" size={sizes.scale(24)} color={colors.p500} />
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
    color: theme.colors.n700,
    marginBottom: theme.sizes.spacing.s,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.m,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.sizes.spacing.s,
  },
  avatarContainer: {
    borderRadius: theme.sizes.borderRadius.full,
    borderWidth: 2,
    borderColor: theme.colors.pinkBorder,
  },
  avatar: {
    width: theme.sizes.scale(78),
    height: theme.sizes.scale(78),
    borderRadius: theme.sizes.borderRadius.full,
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
    ...theme.sizes.typography.bodyMedium,
    fontSize: theme.sizes.scale(15),
    color: theme.colors.n500,
    marginTop: theme.sizes.spacing.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.m,
    borderTopWidth: 1,
    borderTopColor: theme.colors.n200,
    paddingTop: theme.sizes.spacing.m,
  },
  badge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.p100,
    borderRadius: theme.sizes.borderRadius.full,
    paddingVertical: theme.sizes.scale(12),
    borderWidth: 2,
    borderColor: theme.colors.p500,
  },
  badgeText: {
    ...theme.sizes.typography.bodyLarge,
    color: theme.colors.p500,
    marginLeft: theme.sizes.spacing.s,
    fontFamily: 'Manrope_600SemiBold',
  },
  button: {
    height: theme.sizes.scale(48),
    marginBottom: theme.sizes.spacing.s,
  }
});
