import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeContext';
import { useStyles } from '../../theme/useStyles';
import { Icon } from '../ui/Icon';

export function DoctorHeader({ profile }) {
  const { colors, sizes } = useTheme();
  const { t } = useTranslation();
  const styles = useStyles(themeStyles);

  return (
    <View style={styles.container}>
      <View style={styles.leftRow}>
        <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
        <Text style={styles.greeting}>
          {t('doctor_dashboard.hi_dr', { name: profile.firstName })}
        </Text>
      </View>
      <TouchableOpacity style={styles.notification}>
        <Icon name="notifications" size={sizes.scale(24)} color={colors.p500} />
      </TouchableOpacity>
    </View>
  );
}

const themeStyles = (theme) => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.s,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: theme.sizes.scale(29),
    height: theme.sizes.scale(29),
    borderRadius: theme.sizes.borderRadius.full,
    marginRight: theme.sizes.spacing.s,
  },
  greeting: {
    ...theme.sizes.typography.h4,
    color: theme.colors.n700,
  },
  notification: {
    // padding: theme.sizes.spacing.xs,
  }
});
