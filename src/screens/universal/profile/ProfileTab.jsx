import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../theme/ThemeContext';
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
import { WorkplaceSelectScreen } from './components/WorkplaceSelectScreen';
import { Alert } from 'react-native';

import { useSession } from '../../../context/SessionContext';
import { useRouter } from 'expo-router';
import { ProfileNotifications } from './components/ProfileNotifications';
import { MedicalProfileEdit } from './components/MedicalProfileEdit';
import { SettingsNotificationsScreen } from './SettingsNotificationsScreen';
import { SettingsLanguageScreen } from './SettingsLanguageScreen';
import { SettingsVisibilityScreen } from './SettingsVisibilityScreen';
import { ProfileFaqScreen } from './ProfileFaqScreen';
import { ProfileLegalScreen } from './ProfileLegalScreen';

export function ProfileTab({ role = 'patient' }) {
  const { t } = useTranslation();
  const context = useComponentContext();
  const styles = useStyles(themeStyles);
  const { sizes, colors } = useTheme();
  const { doctorProfileController, settingsController } = context;

  const isDoctor = role === 'doctor';
  const isOwner = role === 'owner';
  const user = isDoctor ? doctorProfileController?.profile : context.user;
  const updateProfile = context.updateProfile;
  const { logout, registerProfile, getProfessions } = useSession();
  const router = useRouter();

  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [isDocSheetOpen, setIsDocSheetOpen] = useState(false);
  const [isAboutSheetOpen, setIsAboutSheetOpen] = useState(false);
  const [isWorkplaceSheetOpen, setIsWorkplaceSheetOpen] = useState(false);
  const [isAboutSaving, setIsAboutSaving] = useState(false);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [isNotificationSheetOpen, setIsNotificationSheetOpen] = useState(false);
  const [medicalProfileType, setMedicalProfileType] = useState(null); // 'conditions', 'allergies', 'medications'
  const [activeScreen, setActiveScreen] = useState('main'); // 'main' | 'notifications' | 'language' | 'visibility'

  const handleSetScreen = (screen, type) => {
    setActiveScreen(screen);
    if (typeof window !== 'undefined' && window.history) {
      const searchParams = new URLSearchParams(window.location.search);
      if (screen === 'main') {
        searchParams.delete('view');
        searchParams.delete('type');
      } else {
        searchParams.set('view', screen);
        if (type) {
          searchParams.set('type', type);
        } else if (screen !== 'privacy' && screen !== 'terms') {
          searchParams.delete('type');
        }
      }
      const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
      window.history.pushState(window.history.state, '', `${window.location.pathname}${queryString}`);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncFromUrl = () => {
      const searchParams = new URLSearchParams(window.location.search);
      const view = searchParams.get('view');
      const type = searchParams.get('type');
      if (view && ['notifications', 'language', 'visibility', 'faq', 'privacy', 'terms'].includes(view)) {
        setActiveScreen(view);
      } else {
        setActiveScreen('main');
      }
    };

    syncFromUrl();
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, []);

  const patientDashboard = role === 'patient' ? require('../../../context/PatientDashboardContext').usePatientDashboard() : null;
  const doctorDashboard = role === 'doctor' ? require('../../../context/DoctorDashboardContext').useDoctorDashboard() : null;
  const ownerDashboard = role === 'owner' ? require('../../../context/OwnerDashboardContext').useOwnerDashboard() : null;
  const currentTab = role === 'patient' ? patientDashboard?.tabIndex : (role === 'doctor' ? doctorDashboard?.tabIndex : ownerDashboard?.tabIndex);

  useEffect(() => {
    if (currentTab === 4 && typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const view = searchParams.get('view');
      if (view && ['notifications', 'language', 'visibility', 'faq', 'privacy', 'terms'].includes(view)) {
        setActiveScreen(view);
      } else {
        setActiveScreen('main');
      }
    }
  }, [currentTab]);

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
      Alert.alert(t('common.error', 'Error'), res?.error || t('profile.failed_to_save', 'Failed to save profile'));
    }
  };

  const handleSaveAbout = async (payload) => {
    setIsAboutSaving(true);
    const res = await registerProfile(payload);
    setIsAboutSaving(false);
    if (res?.success) {
      setIsAboutSheetOpen(false);
    } else {
      Alert.alert(t('common.error', 'Error'), res?.error || t('profile.failed_to_save', 'Failed to save profile'));
    }
  };

  if (activeScreen === 'notifications') {
    return <SettingsNotificationsScreen onBack={() => handleSetScreen('main')} />;
  }
  if (activeScreen === 'language') {
    return <SettingsLanguageScreen onBack={() => handleSetScreen('main')} />;
  }
  if (activeScreen === 'visibility') {
    return <SettingsVisibilityScreen onBack={() => handleSetScreen('main')} />;
  }
  if (activeScreen === 'faq') {
    return <ProfileFaqScreen onBack={() => handleSetScreen('main')} />;
  }
  if (activeScreen === 'privacy') {
    return <ProfileLegalScreen type="privacy" onBack={() => handleSetScreen('main')} />;
  }
  if (activeScreen === 'terms') {
    return <ProfileLegalScreen type="terms" onBack={() => handleSetScreen('main')} />;
  }

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
            } else if (isWorkplaceSheetOpen) {
              setIsWorkplaceSheetOpen(false);
            } else if (isAboutSheetOpen) {
              setIsAboutSheetOpen(false);
            } else if (isNotificationSheetOpen) {
              setIsNotificationSheetOpen(false);
            } else if (medicalProfileType) {
              setMedicalProfileType(null);
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
                  color = colors.warning || colors.warning;
                  break;
                case 'canceled':
                case 'rejected':
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
            <ProfileItem
              label={t('profile.workplace')}
              value={user.workplace || '--'}
              valueIcon={user.workplaceConfirmed ? "check" : null}
              valueIconColor={user.workplaceConfirmed ? colors.info : undefined}
              isLast
              onPress={() => setIsWorkplaceSheetOpen(true)}
            />
          </ProfileSection>
        )}

        {isOwner && context.ownerController?.organization && (
          <ProfileSection title={t('profile.organization_details', 'Organization Details')}>
            <ProfileItem label={t('profile.org_name', 'Name')} value={context.ownerController.organization.name} />
            <ProfileItem label={t('profile.org_address', 'Address')} value={context.ownerController.organization.address} />
            <ProfileItem label={t('profile.org_description', 'Description')} value={context.ownerController.organization.description || '--'} isLast />
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

        {!isDoctor && !isOwner && (
          <ProfileSection title={t('profile.medical_data')}>
            <ProfileItem
              label={t('profile.chronic_conditions')}
              value={user.medicalData?.chronicConditions || t('profile.tap_to_manage', 'Tap to manage')}
              onPress={() => setMedicalProfileType('conditions')}
            />
            <ProfileItem
              label={t('profile.allergies')}
              value={user.medicalData?.allergies || t('profile.tap_to_manage', 'Tap to manage')}
              onPress={() => setMedicalProfileType('allergies')}
            />
            <ProfileItem
              label={t('profile.medications')}
              value={user.medicalData?.medications || t('profile.tap_to_manage', 'Tap to manage')}
              onPress={() => setMedicalProfileType('medications')}
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

        {!isDoctor && !isOwner && (
          <ProfileSection title={t('profile.preferences')}>
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
        )}

        <ProfileSection title={t('profile.security_privacy')}>
          <ProfileItem
            label={t('profile.change_password')}
            onPress={() => router.push('/(app)/change-password')}
          />
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

        <ProfileSection title={t('profile.settings', 'Settings')}>
          <ProfileItem
            label={t('profile.notifications', 'Notifications')}
            value={settingsController?.settings?.notification_types?.all !== false ? t('common.on', 'On') : t('common.off', 'Off')}
            onPress={() => handleSetScreen('notifications')}
          />
          <ProfileItem
            label={t('profile.application_language', 'Application language')}
            value={settingsController?.settings?.app_languages?.name || 'English'}
            onPress={() => handleSetScreen('language')}
          />
          <ProfileItem
            label={t('profile.profile_visibility', 'Profile visibility')}
            value={
              (() => {
                const hiddenCount = Object.values(settingsController?.settings?.data_visibility || {}).filter(v => v === true).length;
                return hiddenCount > 0 ? t('profile.hidden_count', { count: hiddenCount, defaultValue: `${hiddenCount} hidden` }) : t('profile.all_visible', 'All visible');
              })()
            }
            isLast
            onPress={() => handleSetScreen('visibility')}
          />
        </ProfileSection>

        <ProfileSection title={t('profile.support')}>
          <ProfileItem label={t('profile.faq')} onPress={() => handleSetScreen('faq')} />
          <ProfileItem label={t('profile.privacy_policy')} onPress={() => handleSetScreen('privacy', 'privacy')} />
          <ProfileItem label={t('profile.terms_of_use')} isLast onPress={() => handleSetScreen('terms', 'terms')} />
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
          onClose={() => setIsNotificationSheetOpen(false)}
        />
      </BottomSheet>

      <BottomSheet
        visible={!!medicalProfileType}
        onClose={() => setMedicalProfileType(null)}
        initialHeight={sizes.height}
      >
        {medicalProfileType && (
          <MedicalProfileEdit
            user={user}
            type={medicalProfileType}
            onClose={() => setMedicalProfileType(null)}
          />
        )}
      </BottomSheet>
      <BottomSheet
        visible={isWorkplaceSheetOpen}
        onClose={() => setIsWorkplaceSheetOpen(false)}
        title=""
        showClose={false}
        fullHeight
      >
        <WorkplaceSelectScreen
          currentWorkplace={user.workplace}
          // onBack={() => setIsWorkplaceSheetOpen(false)}
          onClose={() => setIsWorkplaceSheetOpen(false)}
          onSave={() => {
            setIsWorkplaceSheetOpen(false);
            if (isDoctor && doctorProfileController?.reloadProfile) {
              doctorProfileController.reloadProfile();
            }
          }}
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
