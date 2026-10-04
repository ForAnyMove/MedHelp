import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, StyleSheet, Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { Icon } from './Icon';
import { useTheme } from '../../theme/ThemeContext';
import { useSession } from '../../context/SessionContext';

export function AvatarPicker({ currentAvatarUrl, pendingAvatarUrl, avatarModerationStatus, onUploadSuccess, style }) {
  const { t } = useTranslation();
  const { sizes, colors } = useTheme();
  const { uploadAvatar } = useSession();
  const [loading, setLoading] = useState(false);
  const [localAvatarUrl, setLocalAvatarUrl] = useState(null);

  const displayUrl = localAvatarUrl || pendingAvatarUrl || currentAvatarUrl;
  const isPending = avatarModerationStatus === 'pending' || localAvatarUrl;

  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert(t('common.error'), t('auth.permission_required', 'Permission to access camera roll is required!'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setLoading(true);
        const res = await uploadAvatar(file);
        setLoading(false);

        if (res.success) {
          setLocalAvatarUrl(res.url);
          if (onUploadSuccess) onUploadSuccess(res.url);
        } else {
          Alert.alert(t('common.error'), res.error || t('profile.upload_failed', 'Upload failed'));
        }
      }
    } catch (error) {
      setLoading(false);
      console.error(error);
      Alert.alert(t('common.error'), t('profile.upload_failed', 'Upload failed'));
    }
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity 
        style={[
          styles.avatarContainer,
          { width: sizes.scale(100), height: sizes.scale(100), backgroundColor: colors.n100, borderColor: colors.n300 }
        ]} 
        onPress={handlePickImage}
        disabled={loading}
      >
        {displayUrl ? (
          <Image source={{ uri: displayUrl }} style={styles.image} />
        ) : (
          <Icon name="person" size={sizes.scale(40)} color={colors.n400} />
        )}

        <View style={[styles.editBadge, { backgroundColor: colors.p500, borderColor: colors.white }]}>
          {loading ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Icon name="pencil" size={sizes.scale(14)} color={colors.white} />
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    borderRadius: 100,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  pendingBadge: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  pendingText: {
    fontWeight: '600',
  }
});
