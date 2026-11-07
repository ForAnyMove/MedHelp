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
    scheduled: { bg: /* TODO: color */ '#FFF0F0', icon: colors.sCoral },
    pending: { bg: /* TODO: color */ '#FFF9F0', icon: colors.sYell },
    confirmed: { bg: /* TODO: color */ '#F0F9FF', icon: colors.sBlue },
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
      <View style={styles.topRow}>
        <Icon name="time" size={sizes.scale(24)} color={theme.icon} wrapperStyle={[styles.iconBox]} wrapped />
        {consultation.price !== undefined && consultation.price !== null && (
          <View style={styles.priceBadge}>
            <Text style={styles.priceText}>
              {consultation.price > 0 ? `$${consultation.price}` : 'Беспл.'}
            </Text>
          </View>
        )}
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
    minWidth: !theme.responsive?.isPortraitShell && (theme.responsive?.isDesktop || theme.responsive?.isDesktopLarge) ? 210 : theme.sizes.scale(130),
    marginRight: !theme.responsive?.isPortraitShell && (theme.responsive?.isDesktop || theme.responsive?.isDesktopLarge) ? 0 : theme.sizes.spacing.m,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
    minHeight: theme.sizes.scale(115),
    marginVertical: theme.sizes.scale(4),
    borderWidth: 1,
    borderColor: theme.colors.n100,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: theme.sizes.spacing.xs,
  },
  priceBadge: {
    backgroundColor: theme.colors.opacityP100,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  priceText: {
    fontSize: theme.sizes.scale(11),
    fontWeight: '700',
    color: theme.colors.p600,
  },
  iconBox: {
    width: theme.sizes.scale(32),
    height: theme.sizes.scale(32),
  },
  time: {
    ...theme.sizes.typography.bodyLarge,
    color: theme.colors.n800,
    fontFamily: 'Manrope_600SemiBold',
    fontWeight: '700',
    marginBottom: 4,
  },
  name: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n600,
    fontWeight: '500',
  }
});
