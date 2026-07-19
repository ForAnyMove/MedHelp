import React from 'react';
import { View, Text, TouchableOpacity, ImageBackground, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeContext';
import { useStyles } from '../../theme/useStyles';
import { Button } from '../ui/Button';
import { DoctorAvatar } from './DoctorAvatar';

export function VIPDoctorCard({ doctor, onPress }) {
  const { t } = useTranslation();
  const { colors, sizes } = useTheme();
  const { width } = useWindowDimensions();
  const styles = useStyles(themeStyles);

  const cardWidth = width - sizes.spacing.m * 2;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[styles.container, { width: cardWidth }]}
    >
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />
      <View style={styles.bgCircle3} />
      <View style={styles.cardContent}>
        <View style={styles.leftSection}>
          <DoctorAvatar
            url={doctor.avatarUrl}
            firstName={doctor.firstName}
            lastName={doctor.lastName}
            size={sizes.scale(120)}
          />
        </View>
        <View style={styles.rightSection}>
          <Text style={styles.name}>{t('doctors.dr_prefix')}{doctor.firstName} {doctor.lastName}</Text>
          <Text style={styles.specialization}>{t(doctor.specialization)}</Text>
          <Text style={styles.description} numberOfLines={3}>
            {doctor.description}
          </Text>
          <View style={styles.buttonContainer}>
            <Button
              title={t('doctors.book_btn')}
              variant="primary"
              onPress={onPress}
              style={styles.bookButton}
              textStyle={styles.bookButtonText}
              icon="arrow-forward"
              iconSide="right"
            />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const themeStyles = (theme) => ({
  container: {
    width: theme.sizes.scale(320),
    height: theme.sizes.scale(185),
    marginRight: theme.sizes.spacing.m,
    borderRadius: theme.sizes.scale(24),
    backgroundColor: theme.colors.p400, // Brighter turquoise for main card
    overflow: 'hidden',
    position: 'relative',
  },
  bgCircle1: {
    position: 'absolute',
    top: theme.sizes.scale(-50),
    right: theme.sizes.scale(-50),
    width: theme.sizes.scale(200),
    height: theme.sizes.scale(200),
    borderRadius: theme.sizes.scale(100),
    backgroundColor: /* TODO: color */ 'rgba(255, 255, 255, 0.15)',
  },
  bgCircle2: {
    position: 'absolute',
    bottom: theme.sizes.scale(-80),
    left: theme.sizes.scale(-20),
    width: theme.sizes.scale(150),
    height: theme.sizes.scale(150),
    borderRadius: theme.sizes.scale(75),
    backgroundColor: /* TODO: color */ 'rgba(255, 255, 255, 0.1)',
  },
  bgCircle3: {
    position: 'absolute',
    top: theme.sizes.scale(40),
    right: theme.sizes.scale(40),
    width: theme.sizes.scale(80),
    height: theme.sizes.scale(80),
    borderRadius: theme.sizes.scale(40),
    backgroundColor: /* TODO: color */ 'rgba(255, 255, 255, 0.05)',
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    padding: theme.sizes.spacing.s,
  },
  leftSection: {
    justifyContent: 'center',
    marginRight: theme.sizes.spacing.m,
  },
  rightSection: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    ...theme.sizes.typography.h4,
    color: theme.colors.white,
  },
  specialization: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.white,
    opacity: 0.9,
    letterSpacing: 0.2,
    marginBottom: theme.sizes.spacing.xs,
  },
  description: {
    ...theme.sizes.typography.bodySmall,
    color: theme.colors.white,
    opacity: 0.9,
    marginBottom: theme.sizes.spacing.m,
  },
  buttonContainer: {
    alignItems: 'flex-start',
  },
  bookButton: {
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.sizes.spacing.xl,
    height: theme.sizes.scale(48),
    borderRadius: theme.sizes.borderRadius.full,
    borderWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
  },
  bookButtonText: {
    ...theme.sizes.typography.h3,
    color: theme.colors.p500,
    fontWeight: '700',
  }
});

