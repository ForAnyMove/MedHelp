import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeContext';
import { useStyles } from '../../theme/useStyles';
import { Icon } from '../ui/Icon';

const STATUS_COLORS = {
  scheduled: { bg: '#FFF0F0', icon: '#FF7E7E' },
  pending: { bg: '#FFF9F0', icon: '#FFC87E' },
  confirmed: { bg: '#F0F9FF', icon: '#7EBFFF' },
};

export function ConsultationCard({ consultation, onPress }) {
  const { colors, sizes } = useTheme();
  const styles = useStyles(themeStyles);
  const { patient, time } = consultation;
  
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
      <View style={[styles.iconBox, { backgroundColor: theme.bg }]}>
        <Icon name="Clock" size={24} color={theme.icon} />
      </View>
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
    width: theme.sizes.scale(120),
    marginRight: theme.sizes.spacing.m,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  iconBox: {
    width: theme.sizes.scale(40),
    height: theme.sizes.scale(40),
    borderRadius: theme.sizes.borderRadius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.sizes.spacing.s,
  },
  time: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n900,
    fontFamily: 'Manrope_700Bold',
    marginBottom: 2,
  },
  name: {
    ...theme.sizes.typography.caption,
    color: theme.colors.n400,
    fontFamily: 'Manrope_500Medium',
  }
});
