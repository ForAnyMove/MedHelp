import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeContext';
import { useStyles } from '../../theme/useStyles';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { DoctorAvatar } from './DoctorAvatar';

export function RegularDoctorCard({ doctor, onProfilePress, onBookPress, variant = 'full' }) {
  const { t } = useTranslation();
  const { colors, sizes } = useTheme();
  const styles = useStyles(themeStyles);
  
  const isCompact = variant === 'compact';

  return (
    <TouchableOpacity 
      style={[styles.container, isCompact && styles.compactContainer]} 
      onPress={onProfilePress}
      activeOpacity={0.9}
    >
      <View style={styles.header}>
        <DoctorAvatar 
          url={doctor.avatarUrl} 
          firstName={doctor.firstName} 
          lastName={doctor.lastName} 
          size={isCompact ? sizes.scale(60) : sizes.scale(80)}
        />
        <View style={styles.info}>
          <Text style={styles.name}>{t('doctors.dr_prefix')}{doctor.firstName} {doctor.lastName}</Text>
          <Text style={styles.specialization}>{t(doctor.specialization)}</Text>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Icon name="Star" size={12} color={colors.sYell} />
              <Text style={styles.statText}>{doctor.rating} ({doctor.reviewsCount}) вЂў {doctor.experience} {t('doctors.years')}</Text>
            </View>
          </View>
        </View>
      </View>

      {!isCompact && (
        <>
          <Text style={styles.adviceHeader}>{t('doctors.can_advise')}</Text>
          <View style={styles.availabilityPanel}>
            <View style={styles.availabilityItem}>
              <Icon name="Calendar" size={16} color={colors.p500} />
              <Text style={styles.availabilityText}>{t('doctors.today')}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.availabilityItem}>
              <Icon name="Clock" size={16} color={colors.p500} />
              <Text style={styles.availabilityText}>15:00</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.availabilityItem}>
              <Icon name="Video" size={16} color={colors.p500} />
              <Text style={styles.availabilityText}>{t('doctors.online')}</Text>
            </View>
          </View>

          <View style={styles.actions}>
            <Button 
              title={t('doctors.view_profile')} 
              variant="outlined" 
              onPress={onProfilePress}
              style={styles.actionButton}
            />
            <View style={{ width: sizes.spacing.m }} />
            <Button 
              title={t('doctors.book_btn')} 
              variant="primary" 
              onPress={onBookPress}
              style={styles.actionButton}
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
    borderRadius: 24, // Larger rounding as requested
    padding: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.m,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  compactContainer: {
    padding: theme.sizes.spacing.s,
    marginTop: theme.sizes.spacing.m,
    marginBottom: 0,
    elevation: 0,
    shadowOpacity: 0,
    borderWidth: 1,
    borderColor: theme.colors.n200,
    marginBottom: theme.sizes.spacing.l,
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
    color: theme.colors.n900,
  },
  specialization: {
    ...theme.sizes.typography.caption,
    color: theme.colors.n500,
    marginBottom: theme.sizes.spacing.xs,
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
    ...theme.sizes.typography.caption,
    color: theme.colors.n700,
    marginLeft: theme.sizes.spacing.xs,
  },
  adviceHeader: {
    ...theme.sizes.typography.bodySmall,
    fontFamily: 'Manrope_600SemiBold',
    color: theme.colors.n900,
    marginBottom: theme.sizes.spacing.s,
    marginLeft: theme.sizes.spacing.xs,
  },
  availabilityPanel: {
    flexDirection: 'row',
    backgroundColor: '#F0F8F7', // Very light teal/grey background
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0EFEE', // Very light border
    paddingVertical: theme.sizes.spacing.s,
    paddingHorizontal: theme.sizes.spacing.xs,
    marginBottom: theme.sizes.spacing.m,
    alignItems: 'center',
  },
  availabilityItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  availabilityText: {
    ...theme.sizes.typography.caption,
    color: theme.colors.n700,
    fontWeight: '600',
    marginLeft: theme.sizes.spacing.xs,
  },
  divider: {
    width: 1,
    height: '60%',
    backgroundColor: '#DDE8E7',
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    flex: 1,
  }
});
