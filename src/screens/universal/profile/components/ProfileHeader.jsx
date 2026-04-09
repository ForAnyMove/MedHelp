import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useStyles } from '../../../../theme/useStyles';
import { Icon } from '../../../../components/ui/Icon';
import { useTheme } from '../../../../theme/ThemeContext';

export function ProfileHeader({ user }) {
  const { t } = useTranslation();
  const { sizes, colors } = useTheme();
  const styles = useStyles(themeStyles);

  return (
    <View style={styles.container}>
      {/* Background abstract shapes (simplified as rounded views) */}
      <View style={styles.shape1} />
      <View style={styles.shape2} />

      <View style={styles.topBar}>
        <Text style={styles.title}>{t('profile.title')}</Text>
        <TouchableOpacity style={styles.notificationBtn}>
          <Icon name="notifications" size={sizes.scale(24)} color={colors.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: user.avatarUrl }}
            style={styles.avatar}
          />
        </View>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{`${user.firstName} ${user.lastName}`}</Text>
          <TouchableOpacity style={styles.editBtn}>
            <Icon name="edit" size={sizes.scale(24)} color={colors.white} />
          </TouchableOpacity>
        </View>
        <Text style={styles.email}>{user.email}</Text>
      </View>
    </View>
  );
}

const themeStyles = (theme) => ({
  container: {
    height: theme.sizes.scale(300),
    backgroundColor: theme.colors.p400, // Main teal
    paddingTop: theme.sizes.scale(72),
    paddingHorizontal: theme.sizes.spacing.m,
    overflow: 'hidden',
  },
  shape1: {
    position: 'absolute',
    top: theme.sizes.scale(-50),
    left: theme.sizes.scale(-50),
    width: theme.sizes.scale(250),
    height: theme.sizes.scale(250),
    borderRadius: theme.sizes.scale(125),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  shape2: {
    position: 'absolute',
    bottom: theme.sizes.scale(-80),
    right: theme.sizes.scale(-60),
    width: theme.sizes.scale(200),
    height: theme.sizes.scale(200),
    borderRadius: theme.sizes.scale(100),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.sizes.spacing.s,
  },
  title: {
    ...theme.sizes.typography.h3,
    color: theme.colors.white,
  },
  notificationBtn: {
    width: theme.sizes.scale(24),
    height: theme.sizes.scale(24),
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileSection: {
    alignItems: 'center',
  },
  avatarContainer: {
    width: theme.sizes.scale(90),
    height: theme.sizes.scale(90),
    borderRadius: theme.sizes.scale(45),
    borderWidth: 2,
    borderColor: theme.colors.p200,
    marginBottom: theme.sizes.spacing.xs,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: theme.sizes.borderRadius.full,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    ...theme.sizes.typography.h3,
    color: theme.colors.white,
    marginRight: theme.sizes.spacing.s,
  },
  editBtn: {},
  email: {
    ...theme.sizes.typography.caption,
    color: theme.colors.white,
    fontSize: theme.sizes.scale(16),
    lineHeight: theme.sizes.scale(20),
    opacity: 0.8,
  },
});
