import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeContext';
import { useStyles } from '../../theme/useStyles';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { DoctorAvatar } from './DoctorAvatar';

export function RegularDoctorCard({ doctor, onProfilePress, onBookPress, variant = 'full', containerStyle, customSubtitle }) {
  const { t } = useTranslation();
  const { colors, sizes } = useTheme();
  const styles = useStyles(themeStyles);

  const isCompact = variant === 'compact';

  return (
    <TouchableOpacity
      style={[styles.container, isCompact && styles.compactContainer, containerStyle]}
      onPress={onProfilePress}
      activeOpacity={0.9}
    >
      <View style={styles.header}>
        <DoctorAvatar
          url={doctor.avatarUrl}
          firstName={doctor.firstName}
          lastName={doctor.lastName}
          size={isCompact ? sizes.scale(75) : sizes.scale(75)}
        />
        <View style={styles.info}>
          <Text style={styles.name}>{t('doctors.dr_prefix')}{doctor.firstName} {doctor.lastName}</Text>
          <Text style={styles.specialization}>{t(doctor.specialization)}</Text>
          {customSubtitle ? (
            <Text style={styles.customSubtitle}>{customSubtitle}</Text>
          ) : (
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Icon name="star" size={sizes.scale(18)} color={colors.sYell} />
                <Text style={styles.statText}>{doctor.rating} ({doctor.reviewsCount}) • {doctor.experience} {t('doctors.years')}</Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {!isCompact && (
        <>
          <Text style={styles.adviceHeader}>{t('doctors.can_advise')}</Text>
          <View style={styles.availabilityPanel}>
            <View style={styles.availabilityItem}>
              <Icon name="calendar" size={sizes.scale(24)} color={colors.p500} />
              <Text style={styles.availabilityText}>{t('doctors.today')}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.availabilityItem}>
              <Icon name="time" size={sizes.scale(24)} color={colors.p500} />
              <Text style={styles.availabilityText}>15:00</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.availabilityItem}>
              <Icon name="format" size={sizes.scale(24)} color={colors.p500} />
              <Text style={styles.availabilityText}>{t('doctors.online')}</Text>
            </View>
          </View>

          <View style={styles.actions}>
            <Button
              title={t('doctors.view_profile')}
              variant="outlined"
              onPress={onProfilePress}
              style={styles.actionButton}
              textStyle={[styles.actionButtonText, { color: colors.p500 }]}
            />
            <View style={{ width: sizes.spacing.m }} />
            <Button
              title={t('doctors.book_btn')}
              variant="primary"
              onPress={onBookPress}
              style={styles.actionButton}
              textStyle={styles.actionButtonText}
            />
          </View>
        </>
      )}
    </TouchableOpacity>
  );
}

const themeStyles = (theme) => ({
  container: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.m,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  compactContainer: {
    padding: theme.sizes.spacing.m,
    marginTop: theme.sizes.spacing.m,
    marginBottom: 0,
    elevation: 0,
    shadowOpacity: 0,
    borderWidth: 1,
    borderColor: theme.colors.n200,
    marginBottom: theme.sizes.spacing.m,
  },
  header: {
    flexDirection: 'row',
  },
  info: {
    marginLeft: theme.sizes.spacing.m,
    justifyContent: 'center',
  },
  name: {
    ...theme.sizes.typography.h4,
    color: theme.colors.n700,
  },
  specialization: {
    ...theme.sizes.typography.bodyLarge,
    fontSize: theme.sizes.scale(15),
    color: theme.colors.n500,
    marginBottom: theme.sizes.spacing.xs,
  },
  customSubtitle: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n500,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    ...theme.sizes.typography.bodySmall,
    color: theme.colors.n700,
    marginLeft: theme.sizes.spacing.xs,
  },
  adviceHeader: {
    ...theme.sizes.typography.bodySmall,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: theme.sizes.scale(16),
    color: theme.colors.n700,
    marginVertical: theme.sizes.spacing.s,
    marginLeft: theme.sizes.spacing.xs,
  },
  availabilityPanel: {
    flexDirection: 'row',
    backgroundColor: theme.colors.n200,
    borderRadius: theme.sizes.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.n300,
    paddingHorizontal: theme.sizes.spacing.xs,
    marginBottom: theme.sizes.spacing.m,
    alignItems: 'center',
  },
  availabilityItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.sizes.spacing.s,
  },
  availabilityText: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n700,
    marginLeft: theme.sizes.spacing.xs,
  },
  divider: {
    width: 1,
    height: '90%',
    backgroundColor: theme.colors.n300,
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    flex: 1,
  },
  actionButtonText: {
    ...theme.sizes.typography.h4,
    color: theme.colors.white,
  }
});
