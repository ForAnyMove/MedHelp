import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useStyles } from '../../../../theme/useStyles';
import { Icon } from '../../../../components/ui/Icon';

export function ProfileHeader({ user }) {
  const { t } = useTranslation();
  const styles = useStyles(themeStyles);

  return (
    <View style={styles.container}>
      {/* Background abstract shapes (simplified as rounded views) */}
      <View style={styles.shape1} />
      <View style={styles.shape2} />

      <View style={styles.topBar}>
        <Text style={styles.title}>{t('profile.title')}</Text>
        <TouchableOpacity style={styles.notificationBtn}>
          <Icon name="Bell" size={24} color="#FFFFFF" />
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
            <Icon name="Edit2" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <Text style={styles.email}>{user.email}</Text>
      </View>
    </View>
  );
}

const themeStyles = (theme) => ({
  container: {
    height: 300,
    backgroundColor: '#54DACC', // Main teal
    paddingTop: 50,
    paddingHorizontal: theme.sizes.spacing.l,
    overflow: 'hidden',
  },
  shape1: {
    position: 'absolute',
    top: -50,
    left: -50,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  shape2: {
    position: 'absolute',
    bottom: -80,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    ...theme.sizes.typography.h3,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  notificationBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileSection: {
    alignItems: 'center',
  },
  avatarContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    padding: 2,
    marginBottom: 12,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 43,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  name: {
    ...theme.sizes.typography.h3,
    color: '#FFFFFF',
    fontWeight: '800',
    marginRight: 8,
  },
  editBtn: {
    padding: 4,
  },
  email: {
    ...theme.sizes.typography.body,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
});
