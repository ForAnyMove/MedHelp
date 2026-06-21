import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useComponentContext } from '../../../context/GlobalContext';
import { useStyles } from '../../../theme/useStyles';
import { ProfileHeader } from './components/ProfileHeader';
import { ProfileInfoCard } from './components/ProfileInfoCard';
import { ProfileSection } from './components/ProfileSection';
import { ProfileItem } from './components/ProfileItem';
import { BottomSheet } from '../../../components/ui/BottomSheet';
import { ProfileEditForm } from './components/ProfileEditForm';
import { DocUploadSheet } from './components/DocUploadSheet';
import { ProfileAboutForm } from './components/ProfileAboutForm';
import { Alert } from 'react-native';

import { useSession } from '../../../context/SessionContext';
import { useRouter } from 'expo-router';
import { ProfileNotifications } from './components/ProfileNotifications';

export function ProfileTab({ role = 'patient' }) {
  const { t } = useTranslation();
  const context = useComponentContext();
  const styles = useStyles(themeStyles);
  const { doctorProfileController } = context;

  const isDoctor = role === 'doctor';
  const user = isDoctor ? doctorProfileController?.profile : context.user;
  const updateProfile = context.updateProfile;
  const { logout, registerProfile, getProfessions } = useSession();
  const router = useRouter();

  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [isDocSheetOpen, setIsDocSheetOpen] = useState(false);
  const [isAboutSheetOpen, setIsAboutSheetOpen] = useState(false);
  const [isAboutSaving, setIsAboutSaving] = useState(false);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [isNotificationSheetOpen, setIsNotificationSheetOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/welcome');
  };

  if (!user) return null;

  const handleRequestClose = () => {
    if (isFormDirty) {
      Alert.alert(
        t('profile.unsaved_title'),
        t('profile.unsaved_desc'),
        [
          { text: t('profile.cancel_btn'), style: 'cancel' },
          {
            text: t('profile.discard'),
            style: 'destructive',
            onPress: () => {
              setIsFormDirty(false);
              setIsEditSheetOpen(false);
            }
          }
        ]
      );
    } else {
      setIsEditSheetOpen(false);
    }
  };

  const handleSaveProfile = async (payload) => {
    const res = await registerProfile(payload);
    if (res?.success) {
      setIsFormDirty(false);
      setIsEditSheetOpen(false);
    } else {
      Alert.alert('Error', res?.error || 'Failed to save profile');
    }
  };

  const handleSaveAbout = async (payload) => {
    setIsAboutSaving(true);
    const res = await registerProfile(payload);
    setIsAboutSaving(false);
    if (res?.success) {
      setIsAboutSheetOpen(false);
    } else {
      Alert.alert('Error', res?.error || 'Failed to save profile');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <ProfileHeader
          user={user}
          isSheetOpen={isEditSheetOpen || isDocSheetOpen || isAboutSheetOpen || isNotificationSheetOpen}
          onEditPress={() => setIsEditSheetOpen(true)}
          onNotificationPress={() => setIsNotificationSheetOpen(true)}
          onCloseSheetPress={() => {
            if (isEditSheetOpen) {
              handleRequestClose();
            } else if (isDocSheetOpen) {
              setIsDocSheetOpen(false);
            } else if (isAboutSheetOpen) {
              setIsAboutSheetOpen(false);
            } else if (isNotificationSheetOpen) {
              setIsNotificationSheetOpen(false);
            }
          }}
        />

        <ProfileInfoCard user={user} />

        {isDoctor && (
          <ProfileSection title={t('profile.professional_details')}>
            {user.professionNames && user.professionNames.length > 0 && (
              <ProfileItem label={t('auth.specialization_title')} value={user.professionNames.join(', ')} />
            )}
            <ProfileItem
              label={t('profile.experience')}
              value={user.experience ? t('profile.experience_years', { count: user.experience, defaultValue: `${user.experience} years` }) : '--'}
              onPress={() => setIsDocSheetOpen(true)}
            />
            <ProfileItem
              label={t('profile.education')}
              value={user.education || '--'}
              onPress={() => setIsDocSheetOpen(true)}
            />
            {(() => {
              const status = user.docVerificationStatus;
              const colors = context.themeController.colors;
              let val, icon, color;

              switch (status) {
                case 'verified':
                  val = t('profile.license_verified', 'Verified');
                  icon = 'shield-lock';
                  color = colors.p500;
                  break;
                case 'pending':
                  val = t('profile.license_pending', 'Under review');
                  icon = 'time';
                  color = colors.warning || '#FFB547';
                  break;
                case 'canceled':
                  val = t('profile.license_canceled', 'Please re-upload documents');
                  icon = 'important';
                  color = colors.danger;
                  break;
                case 'skipped':
                case 'none':
                default:
                  val = t('profile.license_not_uploaded', 'Documents not uploaded');
                  icon = 'important';
                  color = colors.danger;
                  break;
              }

              return (
                <ProfileItem
                  label={t('profile.license')}
                  value={val}
                  type="status"
                  statusIcon={icon}
                  statusColor={color}
                />
              );
            })()}
            <ProfileItem label={t('profile.workplace')} value={user.workplace || '--'} isLast />
          </ProfileSection>
        )}

        {isDoctor && (
          <ProfileSection
            title={t('profile.about_me')}
            onEdit={() => setIsAboutSheetOpen(true)}
          >
            <View style={styles.aboutContainer}>
              <View style={styles.aboutContent}>
                <Text style={styles.aboutDesc}>{t('profile.about_placeholder')}</Text>
                <Text style={styles.aboutText}>{user.about}</Text>
              </View>
              <Text style={styles.aboutCount}>{user.about?.length || 0}/200</Text>
            </View>
          </ProfileSection>
        )}

        {!isDoctor && (
          <ProfileSection title={t('profile.medical_data')}>
            <ProfileItem
              label={t('profile.height_weight')}
              value={user.height || user.weight ? `${user.height || '--'} ${t('dashboard.cm')} / ${user.weight || '--'} ${t('dashboard.kg')}` : '--'}
            />
            <ProfileItem
              label={t('profile.blood_type')}
              value={user.bloodType || '--'}
            />
            <ProfileItem
              label={t('profile.chronic_conditions')}
              value={user.medicalData?.chronicConditions}
            />
            <ProfileItem
              label={t('profile.allergies')}
              value={user.medicalData?.allergies}
            />
            <ProfileItem
              label={t('profile.medications')}
              value={user.medicalData?.medications}
            />
            <ProfileItem
              label={t('profile.pregnancy')}
              type="toggle"
              isToggled={user.medicalData?.pregnancy}
              onToggle={(val) => !isDoctor && updateProfile({ medicalData: { ...user.medicalData, pregnancy: val } })}
              isLast
            />
          </ProfileSection>
        )}

        <ProfileSection title={t('profile.preferences')}>
          <ProfileItem
            label={t('profile.language')}
            value={user.preferences?.language}
          />
          <ProfileItem
            label={t('profile.consultation_format')}
            value={user.preferences?.consultationFormat}
            isLast={isDoctor}
          />
          {isDoctor ? (
            <ProfileItem
              label={t('profile.accepting_new_patients')}
              value={user.preferences?.acceptingNewPatients ? t('common.yes') : t('common.no')}
              isLast
            />
          ) : (
            <ProfileItem
              label={t('profile.preferred_gender')}
              value={user.preferences?.preferredGender}
              isLast
            />
          )}
        </ProfileSection>

        <ProfileSection title={t('profile.security_privacy')}>
          <ProfileItem label={t('profile.change_password')} />
          <ProfileItem
            label={t('profile.face_id')}
            type="toggle"
            isToggled={user.privacy?.faceId}
            onToggle={(val) => updateProfile({ privacy: { ...user.privacy, faceId: val } })}
          />
          <ProfileItem
            label={t('profile.logout')}
            isDanger
            isLast
            onPress={handleLogout}
          />
        </ProfileSection>

        <ProfileSection title={t('profile.support')}>
          <ProfileItem label={t('profile.faq')} />
          <ProfileItem label={t('profile.privacy_policy')} />
          <ProfileItem label={t('profile.terms_of_use')} isLast />
        </ProfileSection>

        <View style={styles.footerSpacer} />
      </ScrollView>

      <BottomSheet
        visible={isEditSheetOpen}
        onClose={handleRequestClose}
      >
        <ProfileEditForm
          user={user}
          role={role}
          getProfessions={getProfessions}
          onSave={handleSaveProfile}
          setDirty={setIsFormDirty}
        />
      </BottomSheet>

      <BottomSheet
        visible={isDocSheetOpen}
        onClose={() => setIsDocSheetOpen(false)}
      >
        <DocUploadSheet
          onClose={(saved) => {
            setIsDocSheetOpen(false);
            if (saved && doctorProfileController?.reloadProfile) {
              doctorProfileController.reloadProfile();
            }
          }}
        />
      </BottomSheet>

      <BottomSheet
        visible={isAboutSheetOpen}
        onClose={() => setIsAboutSheetOpen(false)}
      >
        <ProfileAboutForm
          user={user}
          onSave={handleSaveAbout}
          loading={isAboutSaving}
        />
      </BottomSheet>

      <BottomSheet
        visible={isNotificationSheetOpen}
        onClose={() => setIsNotificationSheetOpen(false)}
      >
        <ProfileNotifications
          user={user}
          onSave={handleSaveAbout}
        />
      </BottomSheet>
    </View>
  );
}

const themeStyles = (theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  scrollContent: {
    paddingBottom: theme.sizes.scale(30), // Bottom Tab height
  },
  footerSpacer: {
    height: theme.sizes.scale(40),
  },
  aboutContainer: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    paddingTop: theme.sizes.spacing.m,
    paddingBottom: theme.sizes.spacing.s,
  },
  aboutContent: {
    borderWidth: 1,
    borderColor: theme.colors.n300,
    borderRadius: theme.sizes.borderRadius.large,
    paddingVertical: theme.sizes.spacing.s,
    paddingHorizontal: theme.sizes.spacing.m,
  },
  aboutDesc: {
    ...theme.sizes.typography.bodySmall,
    color: theme.colors.n500,
    marginBottom: theme.sizes.spacing.s,
  },
  aboutText: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n900,
  },
  aboutCount: {
    ...theme.sizes.typography.caption,
    color: theme.colors.n500,
    textAlign: 'right',
    marginTop: theme.sizes.spacing.xs,
    marginRight: theme.sizes.spacing.m,
  }
});
