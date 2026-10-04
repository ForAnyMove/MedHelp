import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useStyles } from '../../../../theme/useStyles';
import { Icon } from '../../../../components/ui/Icon';
import { useTheme } from '../../../../theme/ThemeContext';
import { Avatar } from '../../../../components/common/Avatar';
import { useComponentContext } from '../../../../context/GlobalContext';

export function ProfileHeader({ user, isSheetOpen, onEditPress, onNotificationPress, onCloseSheetPress }) {
  const { t } = useTranslation();
  const { sizes, colors } = useTheme();
  const { notificationController } = useComponentContext();
  const styles = useStyles(themeStyles);
  const [isPendingModalVisible, setIsPendingModalVisible] = useState(false);

  return (
    <View style={styles.container}>
      {/* Background abstract shapes (simplified as rounded views) */}
      <View style={styles.shape1} />
      <View style={styles.shape2} />

      <View style={styles.topBar}>
        <Text style={styles.title}>{t('profile.title')}</Text>
        {isSheetOpen ? (
          <TouchableOpacity style={styles.notificationBtn} onPress={onCloseSheetPress}>
            <Icon name="close" size={sizes.scale(24)} color={colors.white} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.notificationBtn} onPress={onNotificationPress}>
            <Icon name="notifications" size={sizes.scale(24)} color={colors.white} />
            {(notificationController?.notifications || []).filter(n => !n.is_read).length > 0 && (
              <View style={styles.notifDot} />
            )}
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.profileSection}>
        <View style={{ position: 'relative' }}>
          <View style={styles.avatarContainer}>
            <Avatar
              source={(user?.pendingAvatarUrl || user?.avatarUrl) ? { uri: (user?.pendingAvatarUrl || user?.avatarUrl) } : null}
              firstName={user?.firstName}
              lastName={user?.lastName}
              size={sizes.scale(90)}
            />
          </View>
          {(user?.avatarModerationStatus === 'pending' || user?.avatarModerationStatus === 'rejected') && (
            <TouchableOpacity 
              style={[styles.pendingWarningIcon, { zIndex: 10 }]}
              hitSlop={{top: 15, bottom: 15, left: 15, right: 15}}
              onPress={() => setIsPendingModalVisible(true)}
            >
              <Icon 
                name="AlertCircle" 
                size={sizes.scale(20)} 
                color={user?.avatarModerationStatus === 'rejected' ? colors.danger : colors.warning} 
              />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.nameRow}>
          <Text style={styles.name}>
            {user?.firstName || user?.lastName
              ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
              : t('profile.no_name')}
          </Text>
          <TouchableOpacity style={styles.editBtn} onPress={onEditPress}>
            <Icon name="edit" size={sizes.scale(24)} color={colors.white} />
          </TouchableOpacity>
        </View>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <Modal 
        visible={isPendingModalVisible} 
        transparent 
        animationType="fade"
        onRequestClose={() => setIsPendingModalVisible(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsPendingModalVisible(false)}>
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={[styles.modalIconContainer, user?.avatarModerationStatus === 'rejected' && { backgroundColor: colors.danger + '20' }]}>
              <Icon 
                name="AlertCircle" 
                size={sizes.scale(40)} 
                color={user?.avatarModerationStatus === 'rejected' ? colors.danger : colors.warning} 
              />
            </View>
            <Text style={styles.modalTitle}>
              {user?.avatarModerationStatus === 'rejected' ? t('profile.avatar_rejected_title', 'Avatar Rejected') : t('profile.avatar_pending_title', 'Avatar on Moderation')}
            </Text>
            <Text style={styles.modalMessage}>
              {user?.avatarModerationStatus === 'rejected'
                ? (user?.avatarModerationComment || t('profile.avatar_rejected_message', 'Your avatar was rejected. Please upload a different image that complies with the guidelines.'))
                : t('profile.avatar_pending_message', 'Your new avatar is currently under moderation. It will be visible to other users once approved.')}
            </Text>
            <TouchableOpacity style={styles.modalBtn} onPress={() => setIsPendingModalVisible(false)}>
              <Text style={styles.modalBtnText}>{t('common.ok', 'OK')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
    backgroundColor: /* TODO: color */ 'rgba(255, 255, 255, 0.2)',
  },
  shape2: {
    position: 'absolute',
    bottom: theme.sizes.scale(-80),
    right: theme.sizes.scale(-60),
    width: theme.sizes.scale(200),
    height: theme.sizes.scale(200),
    borderRadius: theme.sizes.scale(100),
    backgroundColor: /* TODO: color */ 'rgba(255, 255, 255, 0.2)',
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
    marginBottom: theme.sizes.scale(0),
  },
  notifDot: {
    position: 'absolute',
    top: theme.sizes.scale(0),
    right: theme.sizes.scale(0),
    width: theme.sizes.scale(8),
    height: theme.sizes.scale(8),
    borderRadius: theme.sizes.scale(4),
    backgroundColor: theme.colors.danger || '#F05252',
    borderWidth: 1.5,
    borderColor: theme.colors.p400,
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
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingWarningIcon: {
    position: 'absolute',
    bottom: theme.sizes.spacing.xs,
    right: 0,
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.full,
    padding: theme.sizes.scale(2),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.sizes.spacing.l,
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.l,
    alignItems: 'center',
    width: '100%',
    maxWidth: theme.sizes.scale(320),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
  modalIconContainer: {
    width: theme.sizes.scale(60),
    height: theme.sizes.scale(60),
    borderRadius: theme.sizes.scale(30),
    backgroundColor: theme.colors.warning + '20', // transparent warning color
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.sizes.spacing.m,
  },
  modalTitle: {
    ...theme.sizes.typography.h4,
    color: theme.colors.n900,
    marginBottom: theme.sizes.spacing.s,
    textAlign: 'center',
  },
  modalMessage: {
    ...theme.sizes.typography.body,
    color: theme.colors.n600,
    textAlign: 'center',
    marginBottom: theme.sizes.spacing.l,
    lineHeight: theme.sizes.scale(22),
  },
  modalBtn: {
    backgroundColor: theme.colors.p500,
    paddingVertical: theme.sizes.spacing.s,
    paddingHorizontal: theme.sizes.spacing.xl,
    borderRadius: theme.sizes.borderRadius.medium,
    width: '100%',
    alignItems: 'center',
  },
  modalBtnText: {
    ...theme.sizes.typography.h5,
    color: theme.colors.white,
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
