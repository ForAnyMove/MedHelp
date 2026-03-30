import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../theme/ThemeContext';
import { useStyles } from '../../../../theme/useStyles';
import { Icon } from '../../../../components/ui/Icon';
import { DoctorAvatar } from '../../../../components/doctor/DoctorAvatar';

export function StatusCard({ doctor, statusText, onPress, icon = 'Clock', iconColor }) {
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
        <View style={[styles.iconBox, { backgroundColor: (iconColor || colors.sCoral) + '15' }]}>
          <Icon name={icon} size={24} color={iconColor || colors.sCoral} />
        </View>
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
    borderRadius: 24,
    padding: theme.sizes.spacing.m,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: theme.sizes.spacing.l,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  info: {
    marginLeft: theme.sizes.spacing.s,
    flex: 1,
  },
  name: {
    ...theme.sizes.typography.h4,
    color: theme.colors.n900,
    fontSize: theme.sizes.scale(16),
    textDecorationLine: 'underline',
  },
  divider: {
    width: 1,
    height: '100%',
    backgroundColor: theme.colors.n200,
    marginHorizontal: theme.sizes.spacing.m,
  },
  right: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: theme.sizes.scale(44),
    height: theme.sizes.scale(44),
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.sizes.spacing.s,
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    ...theme.sizes.typography.caption,
    color: theme.colors.n500,
  },
  statusValue: {
    ...theme.sizes.typography.body,
    fontWeight: '700',
    color: theme.colors.n900,
  }
});
