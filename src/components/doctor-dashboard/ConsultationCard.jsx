import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeContext';
import { useStyles } from '../../theme/useStyles';
import { Icon } from '../ui/Icon';

export function ConsultationCard({ consultation, onPress }) {
  const { colors, sizes } = useTheme();
  const styles = useStyles(themeStyles);
  const { patient, time } = consultation;

  const STATUS_COLORS = {
    scheduled: { bg: '#FFF0F0', icon: colors.sCoral },
    pending: { bg: '#FFF9F0', icon: colors.sYell },
    confirmed: { bg: '#F0F9FF', icon: colors.sBlue },
  };

  // For demo, assign colors based on patient name or id
  const statusKey = consultation.id === 'c1' ? 'scheduled' :
    consultation.id === 'c2' ? 'pending' : 'confirmed';
  const theme = STATUS_COLORS[statusKey] || STATUS_COLORS.confirmed;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => onPress(consultation)}
    >
      <Icon name="time" size={sizes.scale(24)} color={theme.icon} wrapperStyle={[styles.iconBox]} wrapped />
      <Text style={styles.time}>{time}</Text>
      <Text style={styles.name} numberOfLines={1}>{patient.firstName} {patient.lastName}</Text>
    </TouchableOpacity>
  );
}

const themeStyles = (theme) => ({
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.m,
    width: theme.sizes.scale(100),
    marginRight: theme.sizes.spacing.m,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    height: theme.sizes.scale(120),
    marginVertical: theme.sizes.scale(4),
  },
  iconBox: {
    width: theme.sizes.scale(32),
    height: theme.sizes.scale(32),
    marginBottom: theme.sizes.spacing.xs,
  },
  time: {
    ...theme.sizes.typography.bodyLarge,
    color: theme.colors.n700,
    fontFamily: 'Manrope_600SemiBold',
    marginBottom: theme.sizes.spacing.xs,
  },
  name: {
    ...theme.sizes.typography.bodySmall,
    color: theme.colors.n500,
  }
});
