import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../theme/ThemeContext';
import { useStyles } from '../../../../theme/useStyles';
import { Icon } from '../../../../components/ui/Icon';
import { DoctorAvatar } from '../../../../components/doctor/DoctorAvatar';

export function StatusCard({ doctor, statusText, onPress, icon = 'time', iconColor }) {
  const { t } = useTranslation();
  const { colors, sizes } = useTheme();
  const styles = useStyles(themeStyles);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.left} onPress={onPress} activeOpacity={0.7}>
        <DoctorAvatar
          url={doctor.avatarUrl}
          firstName={doctor.firstName}
          lastName={doctor.lastName}
          size={sizes.scale(48)}
        />
        <View style={styles.info}>
          <Text style={styles.name}>{t('doctors.dr_prefix')}{doctor.firstName} {doctor.lastName}</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.divider} />

      <View style={styles.right}>
        <Icon name={icon} size={sizes.scale(24)} color={iconColor || colors.sCoral} wrapperStyle={[styles.iconBox]} wrapped />
        <View style={styles.statusInfo}>
          <Text style={styles.statusLabel}>{t('consultation.start_in')}</Text>
          <Text style={styles.statusValue}>{statusText}</Text>
        </View>
      </View>
    </View>
  );
}

const themeStyles = (theme) => ({
  container: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    paddingHorizontal: theme.sizes.spacing.m,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: theme.sizes.spacing.m,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  info: {
    marginLeft: theme.sizes.spacing.s,
    flex: 1,
    paddingVertical: theme.sizes.spacing.m,
  },
  name: {
    ...theme.sizes.typography.bodyLarge,
    color: theme.colors.n700,
    fontSize: theme.sizes.scale(16),
  },
  divider: {
    width: 1,
    height: '80%',
    backgroundColor: theme.colors.n200,
    marginHorizontal: theme.sizes.spacing.m,
  },
  right: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.sizes.spacing.m,
  },
  iconBox: {
    width: theme.sizes.scale(32),
    height: theme.sizes.scale(32),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.sizes.spacing.s,
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    ...theme.sizes.typography.caption,
    fontSize: theme.sizes.scale(11),
    color: theme.colors.n700,
  },
  statusValue: {
    ...theme.sizes.typography.bodyMedium,
    fontWeight: '500',
    color: theme.colors.n700,
  }
});
