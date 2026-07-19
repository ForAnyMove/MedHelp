import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../../theme/ThemeContext';
import { useStyles } from '../../../../theme/useStyles';
import { Icon } from '../../../../components/ui/Icon';

export function PatientConsultationMiniCard({ consultation, onPress }) {
  const { colors, sizes } = useTheme();
  const styles = useStyles(themeStyles);
  
  const doctor = consultation.doctor || {};
  const isConnectable = consultation.status === 'occupied';

  const dateObj = new Date(consultation.slot?.date ?? consultation.date);
  const time = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => onPress(consultation)}
    >
      {isConnectable && <View style={styles.redDot} />}
      <Icon name="time" size={sizes.scale(24)} color={colors.sBlue} wrapperStyle={styles.iconBox} wrapped />
      <Text style={styles.time}>{time}</Text>
      <Text style={styles.name} numberOfLines={1}>
        {doctor.firstName} {doctor.lastName}
      </Text>
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
    shadowColor: /* TODO: color */ '#000',
    shadowOffset: { width: theme.sizes.scale(0), height: theme.sizes.scale(2) },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    height: theme.sizes.scale(120),
    marginVertical: theme.sizes.scale(4),
    position: 'relative',
  },
  redDot: {
    position: 'absolute',
    top: theme.sizes.spacing.s,
    right: theme.sizes.spacing.s,
    width: theme.sizes.scale(12),
    height: theme.sizes.scale(12),
    borderRadius: theme.sizes.scale(6),
    backgroundColor: theme.colors.sCoral,
    zIndex: 1,
  },
  iconBox: {
    width: theme.sizes.scale(32),
    height: theme.sizes.scale(32),
    marginBottom: theme.sizes.spacing.xs,
    backgroundColor: /* TODO: color */ '#F0F9FF',
    borderRadius: theme.sizes.borderRadius.full,
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
