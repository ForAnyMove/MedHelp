import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, TouchableOpacity, Modal, Platform, BackHandler } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../theme/ThemeContext';
import { useComponentContext } from '../../../context/GlobalContext';
import { useStyles } from '../../../theme/useStyles';
import { useResponsive } from '../../../theme/useResponsive';
import { Avatar } from '../../../components/common/Avatar';
import { ProfileHeader } from './components/ProfileHeader';
import { ProfileInfoCard } from './components/ProfileInfoCard';
import { ProfileSection } from './components/ProfileSection';
import { ProfileItem } from './components/ProfileItem';
import { BottomSheet } from '../../../components/ui/BottomSheet';
import { ProfileEditForm } from './components/ProfileEditForm';
import { DocUploadSheet } from './components/DocUploadSheet';
import { OrgEditForm } from './components/OrgEditForm';
import { ProfileAboutForm } from './components/ProfileAboutForm';
import { WorkplaceSelectScreen } from './components/WorkplaceSelectScreen';
import { Alert } from 'react-native';
import { Icon } from '../../../components/ui/Icon';
import { router } from 'expo-router';

import { useSession } from '../../../context/SessionContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ProfileNotifications } from './components/ProfileNotifications';
import { MedicalProfileEdit } from './components/MedicalProfileEdit';
import { SettingsNotificationsScreen } from './SettingsNotificationsScreen';
import { SettingsLanguageScreen } from './SettingsLanguageScreen';
import { SettingsVisibilityScreen } from './SettingsVisibilityScreen';
import { ProfileFaqScreen } from './ProfileFaqScreen';
import { ProfileLegalScreen } from './ProfileLegalScreen';
import { ChangePasswordScreen } from './ChangePasswordScreen';

export function ProfileTab({ role = 'patient' }) {
  const { t, i18n } = useTranslation();
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
  const searchParams = useLocalSearchParams();
  const { view: routeView, type: routeType } = searchParams;

  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [isDocSheetOpen, setIsDocSheetOpen] = useState(false);
  const [isOrgEditSheetOpen, setIsOrgEditSheetOpen] = useState(false);
  const [isAboutSheetOpen, setIsAboutSheetOpen] = useState(false);
  const [isWorkplaceSheetOpen, setIsWorkplaceSheetOpen] = useState(false);
  const [isAboutSaving, setIsAboutSaving] = useState(false);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [isNotificationSheetOpen, setIsNotificationSheetOpen] = useState(false);
  const [medicalProfileType, setMedicalProfileType] = useState(null); // 'conditions', 'allergies', 'medications'

  const VALID_VIEWS = [
    'notifications', 'language', 'visibility', 'faq', 'privacy', 'terms',
    'medical', 'professional', 'organization', 'preferences', 'security'
  ];

  const getInitialScreen = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
      if (window.location.pathname.startsWith('/profile')) {
        const v = new URLSearchParams(window.location.search).get('view');
        if (v && VALID_VIEWS.includes(v)) return v;
      }
    }
    if (routeView && VALID_VIEWS.includes(routeView)) return routeView;
    return 'main';
  };
  const [localScreen, setLocalScreen] = useState(getInitialScreen);

  const getWebRouteParam = (key) => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.location) return null;
    try {
      if (!window.location.pathname.startsWith('/profile') && window.location.pathname !== '/') return null;
      const sp = new URLSearchParams(window.location.search);
      return sp.get(key);
    } catch (e) {
      return null;
    }
  };

  const [, setPopstateTick] = useState(0);
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.addEventListener) return;
    const handlePop = () => {
      setPopstateTick((t) => t + 1);
      if (typeof window !== 'undefined' && window.location) {
        const search = new URLSearchParams(window.location.search);
        const v = search.get('view');
        setLocalScreen(v && VALID_VIEWS.includes(v) ? v : 'main');
        const t = search.get('type');
        if (t) setMedicalProfileType(t);
      }
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (localScreen !== 'main') {
        setLocalScreen('main');
        return true;
      }
      if (medicalProfileType) {
        setMedicalProfileType(null);
        return true;
      }
      if (isEditSheetOpen || isDocSheetOpen || isOrgEditSheetOpen || isAboutSheetOpen || isWorkplaceSheetOpen || isNotificationSheetOpen) {
        setIsEditSheetOpen(false);
        setIsDocSheetOpen(false);
        setIsOrgEditSheetOpen(false);
        setIsAboutSheetOpen(false);
        setIsWorkplaceSheetOpen(false);
        setIsNotificationSheetOpen(false);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [localScreen, medicalProfileType, isEditSheetOpen, isDocSheetOpen, isOrgEditSheetOpen, isAboutSheetOpen, isWorkplaceSheetOpen, isNotificationSheetOpen]);

  const isWeb = Platform.OS === 'web' && typeof window !== 'undefined' && window.location;
  const isWebProfileBase = isWeb && (window.location.pathname.startsWith('/profile') || window.location.pathname === '/') && (!window.location.search || window.location.search === '?' || window.location.search === '?tab=profile');

  const effectiveScreen = isWebProfileBase ? 'main' : localScreen;

  const urlType = getWebRouteParam('type');
  const effectiveMedicalType = routeType || urlType || medicalProfileType;

  const [isAboutPendingModalVisible, setIsAboutPendingModalVisible] = useState(false);

  // New preference and security modal states
  const [isConsultationFormatModalOpen, setIsConsultationFormatModalOpen] = useState(false);
  const [isDoctorGenderModalOpen, setIsDoctorGenderModalOpen] = useState(false);
  const [isAcceptingPatientsConfirmVisible, setIsAcceptingPatientsConfirmVisible] = useState(false);
  const [isChangePasswordModalVisible, setIsChangePasswordModalVisible] = useState(false);

  const handleSetScreen = (screen, type) => {
    if (effectiveScreen === screen && (!type || effectiveMedicalType === type)) return;
    setLocalScreen(screen);
    if (type) setMedicalProfileType(type);
    if (Platform.OS === 'web') {
      const typeParam = type ? `&type=${type}` : '';
      const newUrl = screen === 'main' ? '/profile' : `/profile?view=${screen}${typeParam}`;
      if (typeof window !== 'undefined' && window.history) {
        const currentState = (window.history.state && typeof window.history.state === 'object') ? { ...window.history.state } : {};
        const nextState = { ...currentState, customView: screen };
        if (screen === 'main' && typeof window.history.replaceState === 'function') {
          window.history.replaceState(nextState, '', newUrl);
        } else if (typeof window.history.pushState === 'function') {
          window.history.pushState(nextState, '', newUrl);
        }
        try {
          window.dispatchEvent(new Event('medhelp:urlchange'));
        } catch (e) {}
      }
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/welcome');
  };

  const handleDeleteAccount = () => {
    const performDelete = async () => {
      try {
        const { createApiClient } = require('../../../api/apiClient');
        const api = createApiClient(session, refreshSessionToken);
        await api.del('/auth/account');
      } catch (err) {
        console.warn('[handleDeleteAccount] Delete api warning:', err);
      } finally {
        await logout();
        router.replace('/(auth)/welcome');
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        t('profile.delete_account_confirm_message', 'Вы уверены, что хотите навсегда удалить свой аккаунт? Ваши персональные данные будут безвозвратно стёрты.')
      );
      if (confirmed) performDelete();
    } else {
      Alert.alert(
        t('profile.delete_account_confirm_title', 'Удаление аккаунта'),
        t('profile.delete_account_confirm_message', 'Вы уверены, что хотите навсегда удалить свой аккаунт? Ваши персональные данные будут безвозвратно стёрты.'),
        [
          { text: t('common.cancel', 'Отмена'), style: 'cancel' },
          {
            text: t('profile.delete_account_action', 'Удалить навсегда'),
            style: 'destructive',
            onPress: performDelete,
          },
        ]
      );
    }
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

  const handleOrgRequestClose = () => {
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
              setIsOrgEditSheetOpen(false);
            }
          }
        ]
      );
    } else {
      setIsOrgEditSheetOpen(false);
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

  const handleSaveOrg = async (payload) => {
    const res = await context.ownerController?.updateOrganization(payload);
    if (res?.success) {
      setIsFormDirty(false);
      setIsOrgEditSheetOpen(false);
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

  const responsive = useResponsive();
  const isLandscapeLayout = Boolean(
    responsive?.isLandscape &&
    (responsive?.isTabletLandscape || responsive?.isDesktop || responsive?.isDesktopWide || responsive?.isUltrawide)
  );
  const isBentoGrid = Boolean(isLandscapeLayout && responsive?.width >= 1280);

  const activeLangCode = (i18n.language ? i18n.language.split('-')[0] : 'ru');
  const currentLanguageName =
    settingsController?.languages?.find((l) => l.code === activeLangCode)?.name ||
    (activeLangCode === 'ru' ? 'Русский' : 'English');

  // In portrait / mobile shell, sub-screens navigate full-page:
  if (!isLandscapeLayout) {
    if (effectiveScreen === 'notifications') {
      return <SettingsNotificationsScreen onBack={() => handleSetScreen('main')} />;
    }
    if (effectiveScreen === 'language') {
      return <SettingsLanguageScreen onBack={() => handleSetScreen('main')} />;
    }
    if (effectiveScreen === 'visibility') {
      return <SettingsVisibilityScreen onBack={() => handleSetScreen('main')} />;
    }
    if (effectiveScreen === 'faq') {
      return <ProfileFaqScreen onBack={() => handleSetScreen('main')} />;
    }
    if (effectiveScreen === 'privacy') {
      return <ProfileLegalScreen type="privacy" onBack={() => handleSetScreen('main')} />;
    }
    if (effectiveScreen === 'terms') {
      return <ProfileLegalScreen type="terms" onBack={() => handleSetScreen('main')} />;
    }
  }

  // --- Section Renderers (Reused cleanly in both Mobile and Desktop Landscape) ---
  const renderProfessionalSection = () => (
    <ProfileSection title={t('profile.professional_details')}>
      {(user.professionCodes?.length > 0 || user.professionNames?.length > 0) && (
        <ProfileItem
          label={t('auth.specialization_title')}
          value={user.professionCodes?.length > 0
            ? user.professionCodes.map(c => t(`specializations.${c}`)).join(', ')
            : user.professionNames.map(n => n.startsWith('specializations.') ? t(n) : n).join(', ')}
        />
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
            onPress={() => setIsDocSheetOpen(true)}
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
  );

  const renderOrganizationSection = () => (
    <ProfileSection title={t('profile.organization_details', 'Organization Details')}>
      <ProfileItem
        label={t('profile.org_name', 'Name')}
        value={context.ownerController?.organization?.name}
        onPress={() => setIsOrgEditSheetOpen(true)}
      />
      <ProfileItem
        label={t('profile.org_address', 'Address')}
        value={context.ownerController?.organization?.address}
        onPress={() => setIsOrgEditSheetOpen(true)}
      />
      {(() => {
        const status = context.ownerController?.organization?.doc_verification_status || context.ownerController?.organization?.docVerificationStatus;
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
            val = t('profile.license_canceled', 'Rejected');
            icon = 'important';
            color = colors.danger;
            break;
          case 'skipped':
          case 'none':
          default:
            val = t('profile.license_not_uploaded', 'Not uploaded');
            icon = 'important';
            color = colors.danger;
            break;
        }
        return (
          <ProfileItem
            label={t('profile.verification', 'Verification')}
            value={val}
            type="status"
            statusIcon={icon}
            statusColor={color}
            onPress={() => setIsDocSheetOpen(true)}
          />
        );
      })()}
      <ProfileItem
        label={t('profile.org_description', 'Description')}
        value={context.ownerController?.organization?.description || '--'}
        isLast
        onPress={() => setIsOrgEditSheetOpen(true)}
      />
    </ProfileSection>
  );

  const renderAboutSection = () => (
    <ProfileSection
      title={t('profile.about_me')}
      onEdit={() => setIsAboutSheetOpen(true)}
    >
      <View style={styles.aboutContainer}>
        <View style={styles.aboutContent}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: sizes.spacing.xs }}>
            <Text style={styles.aboutDesc}>{t('profile.about_placeholder')}</Text>
            {(user.aboutModerationStatus === 'pending' || user.aboutModerationStatus === 'rejected') && (
              <TouchableOpacity
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                onPress={() => setIsAboutPendingModalVisible(true)}
              >
                <Icon
                  name="AlertCircle"
                  size={sizes.scale(20)}
                  color={user.aboutModerationStatus === 'rejected' ? colors.danger : colors.warning}
                />
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.aboutText}>{user.pendingAbout || user.about}</Text>
        </View>
        <Text style={styles.aboutCount}>{(user.pendingAbout || user.about)?.length || 0}/200</Text>
      </View>
    </ProfileSection>
  );

  const isDoctorPaused = isDoctor && (
    doctorProfileController?.profile?.acceptingNewPatients === false ||
    user?.acceptingNewPatients === false
  );

  const renderDoctorPausedBanner = (isMobile = false) => {
    if (!isDoctorPaused) return null;
    return (
      <View style={[styles.doctorPausedAlertCard, isMobile && styles.doctorPausedAlertCardMobile]}>
        <View style={styles.doctorPausedAlertIcon}>
          <Icon name="important" size={sizes.scale(22)} color={colors.warning} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.doctorPausedAlertTitle}>
            {t('profile.doctor_reception_paused_title', 'Приём пациентов приостановлен')}
          </Text>
          <Text style={styles.doctorPausedAlertText}>
            {t('profile.doctor_reception_paused_desc', 'Вы временно отключили приём новых пациентов. Пациенты не могут записаться к вам на консультацию, а ваш профиль перемещён в конец каталога врачей.')}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.doctorResumeBtn}
          onPress={() => doctorProfileController?.setAcceptingNewPatients(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.doctorResumeBtnText}>{t('profile.resume_reception', 'Возобновить')}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderMedicalSection = () => {
    const isMale = user?.gender === 'male';
    return (
      <ProfileSection title={t('profile.medical_data', 'Медицинские данные')}>
        <ProfileItem
          label={t('profile.chronic_conditions', 'Хронические заболевания')}
          value={user.medicalData?.chronicConditions || t('profile.tap_to_manage', 'Нажмите для управления')}
          onPress={() => setMedicalProfileType('conditions')}
        />
        <ProfileItem
          label={t('profile.allergies', 'Аллергии')}
          value={user.medicalData?.allergies || t('profile.tap_to_manage', 'Нажмите для управления')}
          onPress={() => setMedicalProfileType('allergies')}
        />
        <ProfileItem
          label={t('profile.medications', 'Медикаменты')}
          value={user.medicalData?.medications || t('profile.tap_to_manage', 'Нажмите для управления')}
          onPress={() => setMedicalProfileType('medications')}
          isLast={isMale}
        />
        {!isMale && (
          <ProfileItem
            label={t('profile.pregnancy', 'Беременность')}
            type="toggle"
            isToggled={!!user.medicalData?.pregnancy}
            onToggle={(val) => !isDoctor && context.userManager?.updateMedicalPreference({ pregnancy: val })}
            isLast
          />
        )}
      </ProfileSection>
    );
  };

  const renderPreferencesSection = () => {
    const rawFormat = user.preferences?.consultationFormat;
    let formatVal = rawFormat || t('consultation.format_online_video', 'Онлайн (видео)');
    if (rawFormat === 'Online (video)' || rawFormat === 'online') {
      formatVal = t('consultation.format_online_video', 'Онлайн (видео)');
    } else if (rawFormat === 'In-person' || rawFormat === 'offline' || rawFormat === 'Offline (in-clinic)') {
      formatVal = t('consultation.format_in_person', 'Очно в клинике');
    } else if (rawFormat === 'Any' || rawFormat === 'any') {
      formatVal = t('consultation.format_any', 'Любой');
    }

    const rawGender = user.preferences?.preferredGender;
    let genderVal = rawGender || t('profile.no_preference', 'Не имеет значения');
    if (rawGender === 'No preference' || rawGender === 'none') {
      genderVal = t('profile.no_preference', 'Не имеет значения');
    } else if (rawGender === 'Male' || rawGender === 'male') {
      genderVal = t('profile.genders.male', 'Мужской');
    } else if (rawGender === 'Female' || rawGender === 'female') {
      genderVal = t('profile.genders.female', 'Женский');
    }

    const doctorIsAccepting = doctorProfileController?.profile?.acceptingNewPatients ?? user.acceptingNewPatients ?? user.preferences?.acceptingNewPatients ?? true;

    return (
      <ProfileSection title={t('profile.preferences', 'Предпочтения')}>
        {!isDoctor && (
          <ProfileItem
            label={t('profile.consultation_format', 'Формат консультации')}
            value={formatVal}
            onPress={() => setIsConsultationFormatModalOpen(true)}
          />
        )}
        {isDoctor ? (
          <ProfileItem
            label={t('profile.accepting_new_patients', 'Принимает новых пациентов')}
            type="toggle"
            isToggled={doctorIsAccepting}
            onToggle={(val) => {
              if (!val) {
                setIsAcceptingPatientsConfirmVisible(true);
              } else {
                doctorProfileController?.setAcceptingNewPatients(true);
              }
            }}
            isLast
          />
        ) : (
          <ProfileItem
            label={t('profile.preferred_gender', 'Предпочтительный пол врача')}
            value={genderVal}
            onPress={() => setIsDoctorGenderModalOpen(true)}
            isLast
          />
        )}
      </ProfileSection>
    );
  };

  const renderSecuritySection = () => (
    <ProfileSection title={t('profile.security_privacy', 'Безопасность и приватность')}>
      <ProfileItem
        label={t('profile.change_password', 'Изменить пароль')}
        onPress={() => {
          if (isLandscapeLayout) {
            setIsChangePasswordModalVisible(true);
          } else {
            router.push('/(app)/change-password');
          }
        }}
      />
      <ProfileItem
        label={t('profile.face_id', 'Face ID')}
        type="toggle"
        isToggled={user.privacy?.faceId}
        onToggle={(val) => updateProfile({ privacy: { ...user.privacy, faceId: val } })}
      />
      <ProfileItem
        label={t('profile.logout', 'Выйти')}
        isDanger
        onPress={handleLogout}
      />
      <ProfileItem
        label={t('profile.delete_account', 'Удалить аккаунт')}
        isDanger
        isLast
        onPress={handleDeleteAccount}
      />
    </ProfileSection>
  );

  const renderQuickSettingsSection = () => (
    <ProfileSection title={t('profile.settings', 'Настройки')}>
      <ProfileItem
        label={t('profile.notifications', 'Уведомления')}
        value={settingsController?.settings?.notification_types?.all !== false ? t('common.on', 'Вкл') : t('common.off', 'Выкл')}
        onPress={() => handleSetScreen('notifications')}
      />
      <ProfileItem
        label={t('profile.application_language', 'Язык приложения')}
        value={currentLanguageName}
        onPress={() => handleSetScreen('language')}
      />
      <ProfileItem
        label={t('profile.profile_visibility', 'Видимость данных')}
        value={
          (() => {
            const hiddenCount = Object.values(settingsController?.settings?.data_visibility || {}).filter(v => v === true).length;
            return hiddenCount > 0 ? t('profile.hidden_count', { count: hiddenCount, defaultValue: `Скрыто: ${hiddenCount}` }) : t('profile.all_visible', 'Все видны');
          })()
        }
        isLast
        onPress={() => handleSetScreen('visibility')}
      />
    </ProfileSection>
  );

  const renderSupportSection = () => (
    <ProfileSection title={t('profile.support', 'Поддержка')}>
      <ProfileItem label={t('profile.faq', 'FAQ')} onPress={() => handleSetScreen('faq')} />
      <ProfileItem label={t('profile.privacy_policy', 'Политика конфиденциальности')} onPress={() => handleSetScreen('privacy', 'privacy')} />
      <ProfileItem label={t('profile.terms_of_use', 'Условия использования')} isLast onPress={() => handleSetScreen('terms', 'terms')} />
    </ProfileSection>
  );

  const renderCommonModals = () => (
    <>
      <BottomSheet visible={isEditSheetOpen} onClose={handleRequestClose}>
        <ProfileEditForm user={user} role={role} getProfessions={getProfessions} onSave={handleSaveProfile} setDirty={setIsFormDirty} />
      </BottomSheet>
      <BottomSheet visible={isDocSheetOpen} onClose={() => setIsDocSheetOpen(false)}>
        <DocUploadSheet onClose={(saved) => { setIsDocSheetOpen(false); if (saved && doctorProfileController?.reloadProfile) doctorProfileController.reloadProfile(); if (saved && isOwner && context.ownerController?.loadOrganization) context.ownerController.loadOrganization(); }} />
      </BottomSheet>
      <BottomSheet visible={isOrgEditSheetOpen} onClose={handleOrgRequestClose}>
        <OrgEditForm organization={context.ownerController?.organization} onSave={handleSaveOrg} setDirty={setIsFormDirty} />
      </BottomSheet>
      <BottomSheet visible={isAboutSheetOpen} onClose={() => setIsAboutSheetOpen(false)}>
        <ProfileAboutForm user={user} onSave={handleSaveAbout} loading={isAboutSaving} />
      </BottomSheet>
      <Modal visible={isAboutPendingModalVisible} transparent animationType="fade" onRequestClose={() => setIsAboutPendingModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.modalIconContainer, user.aboutModerationStatus === 'rejected' && { backgroundColor: colors.danger + '20' }]}>
              <Icon name={user.aboutModerationStatus === 'rejected' ? "AlertCircle" : "time"} size={sizes.scale(32)} color={user.aboutModerationStatus === 'rejected' ? colors.danger : colors.warning} />
            </View>
            <Text style={styles.modalTitle}>{user.aboutModerationStatus === 'rejected' ? t('profile.rejected_moderation_title', 'Moderation Rejected') : t('profile.pending_moderation_title', 'Pending Moderation')}</Text>
            <Text style={styles.modalMessage}>{user.aboutModerationStatus === 'rejected' ? (user.aboutModerationComment || t('profile.about_rejected_desc', 'Your about me text was rejected. Please make changes and resubmit.')) : t('profile.about_pending_desc', 'Your about me text is currently under review by our moderators and is not yet visible to other users.')}</Text>
            <TouchableOpacity style={styles.modalBtn} onPress={() => setIsAboutPendingModalVisible(false)}>
              <Text style={styles.modalBtnText}>{t('common.got_it', 'Got it')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <BottomSheet visible={isNotificationSheetOpen} onClose={() => setIsNotificationSheetOpen(false)} initialHeight={sizes.height}>
        <ProfileNotifications user={user} onClose={() => setIsNotificationSheetOpen(false)} />
      </BottomSheet>
      <BottomSheet visible={!!medicalProfileType} onClose={() => setMedicalProfileType(null)} initialHeight={sizes.height}>
        {medicalProfileType && <MedicalProfileEdit user={user} type={medicalProfileType} onClose={() => setMedicalProfileType(null)} />}
      </BottomSheet>
      <BottomSheet visible={isWorkplaceSheetOpen} onClose={() => setIsWorkplaceSheetOpen(false)} title="" showClose={false} fullHeight>
        <WorkplaceSelectScreen currentWorkplace={user.workplace} onClose={() => setIsWorkplaceSheetOpen(false)} onSave={() => { setIsWorkplaceSheetOpen(false); if (isDoctor && doctorProfileController?.reloadProfile) doctorProfileController.reloadProfile(); }} />
      </BottomSheet>

      {/* Consultation Format Selector Modal */}
      <BottomSheet
        visible={isConsultationFormatModalOpen}
        onClose={() => setIsConsultationFormatModalOpen(false)}
        initialHeight={sizes.scale(320)}
      >
        <View style={styles.sheetSelectorContainer}>
          <Text style={styles.sheetSelectorTitle}>{t('profile.select_consultation_format', 'Формат консультации')}</Text>
          <Text style={styles.sheetSelectorSubtitle}>{t('profile.select_consultation_format_desc', 'Выберите предпочтительный способ получения медицинской консультации')}</Text>
          {[
            { key: 'Online (video)', label: t('consultation.format_online_video', 'Онлайн (видео)'), icon: 'video', desc: t('consultation.format_online_desc', 'Дистанционный приём через видеосвязь и чат') },
            { key: 'Offline (in-clinic)', label: t('consultation.format_in_person', 'Очно в клинике'), icon: 'hospital', desc: t('consultation.format_in_person_desc', 'Личный визит в медицинский кабинет клиники') },
            { key: 'Any', label: t('consultation.format_any', 'Любой'), icon: 'check-circle', desc: t('consultation.format_any_desc', 'Подходят как онлайн-консультации, так и очные приёмы') },
          ].map((opt) => {
            const isSelected = (user.preferences?.consultationFormat || 'Online (video)') === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                style={[styles.sheetOptionRow, isSelected && styles.sheetOptionRowSelected]}
                onPress={() => {
                  context.userManager?.updateMedicalPreference({ consultationFormat: opt.key });
                  setIsConsultationFormatModalOpen(false);
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.sheetOptionIconBox, isSelected && styles.sheetOptionIconBoxSelected]}>
                  <Icon name={opt.icon} size={sizes.scale(20)} color={isSelected ? colors.white : colors.p500} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sheetOptionTitle, isSelected && styles.sheetOptionTitleSelected]}>{opt.label}</Text>
                  <Text style={styles.sheetOptionDesc}>{opt.desc}</Text>
                </View>
                <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                  {isSelected && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </BottomSheet>

      {/* Preferred Doctor Gender Selector Modal */}
      <BottomSheet
        visible={isDoctorGenderModalOpen}
        onClose={() => setIsDoctorGenderModalOpen(false)}
        initialHeight={sizes.scale(320)}
      >
        <View style={styles.sheetSelectorContainer}>
          <Text style={styles.sheetSelectorTitle}>{t('profile.preferred_gender', 'Предпочтительный пол врача')}</Text>
          <Text style={styles.sheetSelectorSubtitle}>{t('profile.select_doctor_gender_desc', 'Укажите предпочтение по полу специалистов при поиске и рекомендациях')}</Text>
          {[
            { key: 'No preference', label: t('profile.no_preference', 'Не имеет значения'), icon: 'users', desc: t('profile.gender_any_desc', 'Отображать всех квалифицированных специалистов') },
            { key: 'Male', label: t('profile.genders.male', 'Мужской'), icon: 'user', desc: t('profile.gender_male_desc', 'Врачи мужского пола') },
            { key: 'Female', label: t('profile.genders.female', 'Женский'), icon: 'user', desc: t('profile.gender_female_desc', 'Врачи женского пола') },
          ].map((opt) => {
            const isSelected = (user.preferences?.preferredGender || 'No preference') === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                style={[styles.sheetOptionRow, isSelected && styles.sheetOptionRowSelected]}
                onPress={() => {
                  context.userManager?.updateMedicalPreference({ preferredGender: opt.key });
                  setIsDoctorGenderModalOpen(false);
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.sheetOptionIconBox, isSelected && styles.sheetOptionIconBoxSelected]}>
                  <Icon name={opt.icon} size={sizes.scale(20)} color={isSelected ? colors.white : colors.p500} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sheetOptionTitle, isSelected && styles.sheetOptionTitleSelected]}>{opt.label}</Text>
                  <Text style={styles.sheetOptionDesc}>{opt.desc}</Text>
                </View>
                <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                  {isSelected && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </BottomSheet>

      {/* Doctor Paused Reception Confirmation Modal */}
      <Modal
        visible={isAcceptingPatientsConfirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsAcceptingPatientsConfirmVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: sizes.scale(380) }]}>
            <View style={[styles.modalIconContainer, { backgroundColor: '#FEF3C7' }]}>
              <Icon name="important" size={sizes.scale(32)} color="#D97706" />
            </View>
            <Text style={styles.modalTitle}>
              {t('profile.pause_reception_title', 'Приостановить приём пациентов?')}
            </Text>
            <Text style={styles.modalMessage}>
              {t('profile.pause_reception_desc', 'Пока эта опция выключена, пациенты не смогут записаться к вам на консультацию. Ваш профиль будет отображаться в самом конце каталога врачей с пометкой о приостановке приёма.')}
            </Text>
            <View style={{ width: '100%', gap: sizes.spacing.s }}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#D97706' }]}
                onPress={() => {
                  doctorProfileController?.setAcceptingNewPatients(false);
                  setIsAcceptingPatientsConfirmVisible(false);
                }}
              >
                <Text style={styles.modalBtnText}>{t('profile.pause_reception_confirm', 'Приостановить приём')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#F1F5F9' }]}
                onPress={() => setIsAcceptingPatientsConfirmVisible(false)}
              >
                <Text style={[styles.modalBtnText, { color: colors.n700 }]}>{t('common.cancel', 'Отмена')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Desktop Landscape Change Password Modal */}
      <Modal
        visible={isChangePasswordModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsChangePasswordModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.desktopPasswordModalCard}>
            <View style={styles.desktopPasswordModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: sizes.spacing.s }}>
                <View style={styles.desktopPasswordIconBox}>
                  <Icon name="lock" size={sizes.scale(20)} color={colors.p500} />
                </View>
                <Text style={styles.desktopPasswordModalTitle}>{t('profile.change_password', 'Изменить пароль')}</Text>
              </View>
              <TouchableOpacity
                style={styles.desktopPasswordCloseBtn}
                onPress={() => setIsChangePasswordModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="close" size={sizes.scale(20)} color={colors.n500} />
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1, minHeight: sizes.scale(420) }}>
              <ChangePasswordScreen isModal onBack={() => setIsChangePasswordModalVisible(false)} />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );

  // --- Landscape Master-Detail Presentation ---
  if (isLandscapeLayout) {
    const unreadCount = (context.notificationController?.notifications || []).filter(n => !n.is_read).length;
    const userName = (user?.firstName || user?.lastName)
      ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
      : (user?.name || t('profile.no_name', 'Имя не указано'));

    const navItems = [
      { id: 'main', icon: 'user', label: t('profile.personal_info', 'Обзор и личные данные') },
      ...(!isDoctor && !isOwner ? [{ id: 'medical', icon: 'heart', label: t('profile.medical_data', 'Медицинские данные') }] : []),
      ...(isDoctor ? [{ id: 'professional', icon: 'briefcase', label: t('profile.professional_details', 'Профессиональные данные') }] : []),
      ...(isOwner ? [{ id: 'organization', icon: 'building', label: t('profile.organization_details', 'Организация') }] : []),
      { id: 'preferences', icon: 'sliders', label: t('profile.preferences', 'Предпочтения') },
      { id: 'security', icon: 'lock', label: t('profile.security_privacy', 'Безопасность и приватность') },
      {
        id: 'language',
        icon: 'globe',
        label: t('profile.application_language', 'Язык приложения'),
        badge: currentLanguageName
      },
      { id: 'notifications', icon: 'bell', label: t('profile.notifications', 'Уведомления') },
      { id: 'visibility', icon: 'eye', label: t('profile.profile_visibility', 'Видимость данных') },
      { id: 'faq', icon: 'help-circle', label: t('profile.faq', 'Помощь и FAQ') },
      { id: 'privacy', icon: 'shield', label: t('profile.privacy_policy', 'Политика конфиденциальности') },
      { id: 'terms', icon: 'file-text', label: t('profile.terms_of_use', 'Условия использования') },
      { id: 'logout', icon: 'log-out', label: t('profile.logout', 'Выйти из аккаунта'), isDanger: true },
    ];

    const renderDetailContent = () => {
      switch (effectiveScreen) {
        case 'language':
          return <SettingsLanguageScreen embedded={true} onBack={() => handleSetScreen('main')} />;
        case 'notifications':
          return <SettingsNotificationsScreen embedded={true} onBack={() => handleSetScreen('main')} />;
        case 'visibility':
          return <SettingsVisibilityScreen embedded={true} onBack={() => handleSetScreen('main')} />;
        case 'faq':
          return <ProfileFaqScreen embedded={true} onBack={() => handleSetScreen('main')} />;
        case 'privacy':
          return <ProfileLegalScreen embedded={true} type="privacy" onBack={() => handleSetScreen('main')} />;
        case 'terms':
          return <ProfileLegalScreen embedded={true} type="terms" onBack={() => handleSetScreen('main')} />;
        case 'medical':
          return (
            <>
              <View style={styles.desktopSectionHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.desktopSectionTitle}>{t('profile.medical_data', 'Медицинские данные')}</Text>
                  <Text style={styles.desktopSectionSubtitle}>{t('profile.medical_data_desc', 'Хронические заболевания, аллергии и принимаемые препараты для точной диагностики')}</Text>
                </View>
              </View>
              {renderMedicalSection()}
            </>
          );
        case 'professional':
          return (
            <>
              <View style={styles.desktopSectionHeader}>
                <View style={{ flex: 1, marginRight: sizes.spacing.m }}>
                  <Text style={styles.desktopSectionTitle}>{t('profile.professional_details', 'Профессиональные данные')}</Text>
                  <Text style={styles.desktopSectionSubtitle}>{t('profile.professional_details_desc', 'Квалификация, стаж, образование, лицензия и информация о себе')}</Text>
                </View>
                <TouchableOpacity style={styles.desktopEditBtn} onPress={() => setIsDocSheetOpen(true)}>
                  <Icon name="file-text" size={sizes.scale(16)} color={colors.p500} />
                  <Text style={styles.desktopEditBtnText}>{t('profile.manage_documents', 'Документы')}</Text>
                </TouchableOpacity>
              </View>
              {renderProfessionalSection()}
              {renderAboutSection()}
            </>
          );
        case 'organization':
          return (
            <>
              <View style={styles.desktopSectionHeader}>
                <View style={{ flex: 1, marginRight: sizes.spacing.m }}>
                  <Text style={styles.desktopSectionTitle}>{t('profile.organization_details', 'Организация')}</Text>
                  <Text style={styles.desktopSectionSubtitle}>{t('profile.organization_details_desc', 'Реквизиты клиники, адрес, описание и статус верификации')}</Text>
                </View>
                <TouchableOpacity style={styles.desktopEditBtn} onPress={() => setIsOrgEditSheetOpen(true)}>
                  <Icon name="pencil" size={sizes.scale(16)} color={colors.p500} />
                  <Text style={styles.desktopEditBtnText}>{t('profile.edit_organization', 'Изменить')}</Text>
                </TouchableOpacity>
              </View>
              {renderOrganizationSection()}
            </>
          );
        case 'preferences':
          return (
            <>
              <View style={styles.desktopSectionHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.desktopSectionTitle}>{t('profile.preferences', 'Предпочтения')}</Text>
                  <Text style={styles.desktopSectionSubtitle}>{t('profile.preferences_desc', 'Настройка формата приёма и параметров подбора специалистов')}</Text>
                </View>
              </View>
              {renderPreferencesSection()}
            </>
          );
        case 'security':
          return (
            <>
              <View style={styles.desktopSectionHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.desktopSectionTitle}>{t('profile.security_privacy', 'Безопасность и приватность')}</Text>
                  <Text style={styles.desktopSectionSubtitle}>{t('profile.security_privacy_desc', 'Управление паролем, биометрическим входом и активной сессией')}</Text>
                </View>
              </View>
              {renderSecuritySection()}
            </>
          );
        case 'main':
        default:
          return (
            <>
              <View style={styles.desktopSectionHeader}>
                <View style={{ flex: 1, marginRight: sizes.spacing.m }}>
                  <Text style={styles.desktopSectionTitle}>{t('profile.overview_title', 'Личный профиль')}</Text>
                  <Text style={styles.desktopSectionSubtitle}>{t('profile.overview_desc', 'Управление личной информацией, медицинской картой и настройками')}</Text>
                </View>
                <TouchableOpacity style={styles.desktopEditBtn} onPress={() => setIsEditSheetOpen(true)}>
                  <Icon name="pencil" size={sizes.scale(16)} color={colors.p500} />
                  <Text style={styles.desktopEditBtnText}>{t('profile.edit_profile', 'Редактировать')}</Text>
                </TouchableOpacity>
              </View>

              {renderDoctorPausedBanner()}

              <ProfileInfoCard user={user} style={styles.desktopInfoCard} />

              {isBentoGrid ? (
                <View style={styles.bentoGrid}>
                  <View style={styles.bentoColumn}>
                    {isDoctor && renderProfessionalSection()}
                    {isOwner && renderOrganizationSection()}
                    {!isDoctor && !isOwner && renderMedicalSection()}
                    {renderPreferencesSection()}
                    {renderSupportSection()}
                  </View>
                  <View style={styles.bentoColumn}>
                    {isDoctor && renderAboutSection()}
                    {renderQuickSettingsSection()}
                    {renderSecuritySection()}
                  </View>
                </View>
              ) : (
                <>
                  {isDoctor && renderProfessionalSection()}
                  {isOwner && renderOrganizationSection()}
                  {isDoctor && renderAboutSection()}
                  {!isDoctor && !isOwner && renderMedicalSection()}
                  {renderPreferencesSection()}
                  {renderSecuritySection()}
                  {renderQuickSettingsSection()}
                  {renderSupportSection()}
                </>
              )}
            </>
          );
      }
    };

    return (
      <View style={styles.container}>
        <View style={styles.landscapeContainer}>
          {/* Left Master Column */}
          <View style={styles.masterColumn}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.masterScrollContent}
            >
              {/* Identity Card */}
              <View style={styles.identityCard}>
                <View style={styles.identityBanner}>
                  <TouchableOpacity
                    style={styles.identityNotifBtn}
                    onPress={() => setIsNotificationSheetOpen(true)}
                  >
                    <Icon name="bell" size={sizes.scale(20)} color={colors.white} />
                    {unreadCount > 0 && <View style={styles.notifDot} />}
                  </TouchableOpacity>
                </View>

                <View style={styles.identityAvatarWrapper}>
                  <Avatar
                    source={(user?.pendingAvatarUrl || user?.avatarUrl) ? { uri: (user?.pendingAvatarUrl || user?.avatarUrl) } : null}
                    firstName={user?.firstName}
                    lastName={user?.lastName}
                    size={sizes.scale(80)}
                  />
                  <TouchableOpacity
                    style={styles.avatarEditBadge}
                    onPress={() => setIsEditSheetOpen(true)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Icon name="pencil" size={sizes.scale(14)} color={colors.white} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.identityName} numberOfLines={1}>{userName}</Text>
                <View style={styles.rolePill}>
                  <Text style={styles.rolePillText}>
                    {isDoctor ? t('role.doctor', 'Врач') : isOwner ? t('role.clinic', 'Клиника') : t('role.patient', 'Пациент')}
                  </Text>
                </View>
                <Text style={styles.identityEmail} numberOfLines={1}>{user?.email}</Text>

                <TouchableOpacity
                  style={styles.identityEditAction}
                  onPress={() => setIsEditSheetOpen(true)}
                >
                  <Icon name="pencil" size={sizes.scale(16)} color={colors.p500} />
                  <Text style={styles.identityEditText}>{t('profile.edit_profile', 'Редактировать профиль')}</Text>
                </TouchableOpacity>
              </View>

              {/* Navigation Menu */}
              <View style={styles.navMenuCard}>
                {navItems.map((item) => {
                  const isSelected = effectiveScreen === item.id;
                  const isDanger = item.isDanger;

                  return (
                    <TouchableOpacity
                      key={item.id}
                      testID={`profile-nav-${item.id}`}
                      id={`profile-nav-${item.id}`}
                      style={[
                        styles.navMenuItem,
                        isSelected && styles.navMenuItemActive,
                        isDanger && styles.navMenuItemDanger,
                      ]}
                      onPress={() => {
                        if (item.id === 'logout') {
                          handleLogout();
                        } else {
                          handleSetScreen(item.id);
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.navMenuIconWrapper}>
                        <Icon
                          name={item.icon}
                          size={sizes.scale(18)}
                          color={isDanger ? colors.danger : isSelected ? colors.p500 : colors.n600}
                        />
                      </View>
                      <Text style={[
                        styles.navMenuLabel,
                        isSelected && styles.navMenuLabelActive,
                        isDanger && styles.navMenuLabelDanger,
                      ]}>
                        {item.label}
                      </Text>
                      {item.badge ? (
                        <View style={styles.navMenuBadge}>
                          <Text style={styles.navMenuBadgeText}>{item.badge}</Text>
                        </View>
                      ) : isSelected ? (
                        <View style={styles.navMenuActiveIndicator} />
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          {/* Right Detail Column */}
          <View style={styles.detailColumn}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.detailScrollContent}
            >
              {effectiveScreen !== 'main' && (
                <TouchableOpacity
                  style={styles.detailBackToMain}
                  onPress={() => handleSetScreen('main')}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  accessibilityRole="button"
                  accessibilityLabel={t('common.back_to_overview', 'Все разделы профиля')}
                  testID="back-to-main-profile"
                >
                  <Icon name="arrow-back" size={sizes.scale(18)} color={colors.p500} />
                  <Text style={styles.detailBackToMainText}>{t('common.back_to_overview', 'Все разделы профиля')}</Text>
                </TouchableOpacity>
              )}
              {renderDetailContent()}
              <View style={styles.footerSpacer} />
            </ScrollView>
          </View>
        </View>

        {renderCommonModals()}
      </View>
    );
  }

  // --- Mobile Portrait Presentation ---
  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <ProfileHeader
          user={user}
          isSheetOpen={
            isEditSheetOpen ||
            isDocSheetOpen ||
            isOrgEditSheetOpen ||
            isWorkplaceSheetOpen ||
            isAboutSheetOpen ||
            isNotificationSheetOpen ||
            !!medicalProfileType
          }
          onEditPress={() => setIsEditSheetOpen(true)}
          onNotificationPress={() => setIsNotificationSheetOpen(true)}
          onCloseSheetPress={() => {
            if (isEditSheetOpen) {
              handleRequestClose();
            } else if (isDocSheetOpen) {
              setIsDocSheetOpen(false);
            } else if (isOrgEditSheetOpen) {
              handleOrgRequestClose();
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

        {renderDoctorPausedBanner(true)}

        {isDoctor && renderProfessionalSection()}
        {isOwner && renderOrganizationSection()}
        {isDoctor && renderAboutSection()}
        {!isDoctor && !isOwner && renderMedicalSection()}
        {renderPreferencesSection()}
        {renderSecuritySection()}
        {renderQuickSettingsSection()}
        {renderSupportSection()}

        <View style={styles.footerSpacer} />
      </ScrollView>

      {renderCommonModals()}
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
    width: '100%',
    maxWidth:
      theme.responsive?.isTabletPortrait ||
      theme.responsive?.isTabletLandscape ||
      theme.responsive?.isDesktop ||
      theme.responsive?.isDesktopLarge
        ? 720
        : undefined,
    alignSelf: 'center',
    paddingHorizontal: theme.responsive?.isTabletPortrait ? (theme.responsive?.contentPadding || 20) : 0,
  },
  footerSpacer: {
    height: theme.sizes.scale(40),
  },

  // --- Landscape Master-Detail Styles ---
  landscapeContainer: {
    flex: 1,
    flexDirection: 'row',
    maxWidth: 1360,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: theme.responsive?.contentPadding || 28,
    paddingTop: theme.sizes.scale(20),
    paddingBottom: theme.sizes.scale(24),
    gap: theme.sizes.scale(24),
  },
  masterColumn: {
    width: theme.responsive?.isTabletLandscape && theme.responsive?.width < 1100 ? 280 : 320,
    flexShrink: 0,
    height: '100%',
  },
  masterScrollContent: {
    paddingBottom: theme.sizes.scale(32),
  },
  bentoGrid: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.sizes.scale(20),
  },
  bentoColumn: {
    flex: 1,
    minWidth: 0,
  },
  identityCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    alignItems: 'center',
    paddingBottom: theme.sizes.spacing.m,
  },
  identityBanner: {
    height: theme.sizes.scale(64),
    width: '100%',
    backgroundColor: theme.colors.p500,
    alignItems: 'flex-end',
    paddingTop: theme.sizes.spacing.s,
    paddingRight: theme.sizes.spacing.m,
  },
  identityNotifBtn: {
    position: 'relative',
    padding: theme.sizes.spacing.xs,
  },
  notifDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.danger,
    borderWidth: 1.5,
    borderColor: theme.colors.white,
  },
  identityAvatarWrapper: {
    position: 'relative',
    marginTop: -theme.sizes.scale(40),
    marginBottom: theme.sizes.spacing.s,
    borderWidth: 3,
    borderColor: theme.colors.white,
    borderRadius: theme.sizes.scale(43),
    backgroundColor: theme.colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.p500,
    width: theme.sizes.scale(26),
    height: theme.sizes.scale(26),
    borderRadius: theme.sizes.scale(13),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  identityName: {
    ...theme.sizes.typography.h4,
    fontWeight: '700',
    color: theme.colors.n900,
    textAlign: 'center',
    paddingHorizontal: theme.sizes.spacing.m,
  },
  rolePill: {
    backgroundColor: theme.colors.p100 || '#E0F7F4',
    paddingHorizontal: theme.sizes.spacing.s,
    paddingVertical: 2,
    borderRadius: theme.sizes.borderRadius.full || 12,
    marginTop: theme.sizes.scale(4),
    marginBottom: theme.sizes.scale(4),
  },
  rolePillText: {
    ...theme.sizes.typography.caption,
    fontWeight: '700',
    color: theme.colors.p500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  identityEmail: {
    ...theme.sizes.typography.bodySmall,
    color: theme.colors.n500,
    marginBottom: theme.sizes.spacing.m,
    paddingHorizontal: theme.sizes.spacing.m,
  },
  identityEditAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.n200 || '#F1F5F9',
    paddingVertical: theme.sizes.spacing.xs,
    paddingHorizontal: theme.sizes.spacing.m,
    borderRadius: theme.sizes.borderRadius.medium,
    marginHorizontal: theme.sizes.spacing.m,
    width: '88%',
    gap: theme.sizes.spacing.xs,
  },
  identityEditText: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.p500,
    fontWeight: '600',
  },
  navMenuCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.xs,
    marginTop: theme.sizes.spacing.m,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  navMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.sizes.scale(10),
    paddingHorizontal: theme.sizes.spacing.m,
    borderRadius: theme.sizes.borderRadius.medium,
    marginBottom: 2,
  },
  navMenuItemActive: {
    backgroundColor: theme.colors.p100 || '#E6F9F5',
  },
  navMenuItemDanger: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    marginTop: theme.sizes.scale(6),
    paddingTop: theme.sizes.scale(10),
  },
  navMenuIconWrapper: {
    width: theme.sizes.scale(26),
    alignItems: 'center',
    marginRight: theme.sizes.spacing.s,
  },
  navMenuLabel: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n700,
    flex: 1,
    fontWeight: '500',
  },
  navMenuLabelActive: {
    color: theme.colors.p500,
    fontWeight: '700',
  },
  navMenuLabelDanger: {
    color: theme.colors.danger,
    fontWeight: '600',
  },
  navMenuBadge: {
    backgroundColor: theme.colors.n200 || '#F1F5F9',
    paddingHorizontal: theme.sizes.spacing.xs,
    paddingVertical: 2,
    borderRadius: 8,
  },
  navMenuBadgeText: {
    ...theme.sizes.typography.caption,
    color: theme.colors.n600,
    fontWeight: '600',
  },
  navMenuActiveIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.p500,
  },
  detailColumn: {
    flex: 1,
    minWidth: 0,
    height: '100%',
  },
  detailScrollContent: {
    paddingBottom: theme.sizes.scale(60),
  },
  detailBackToMain: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.sizes.spacing.m,
    alignSelf: 'flex-start',
    gap: theme.sizes.spacing.xs,
  },
  detailBackToMainText: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.p500,
    fontWeight: '600',
  },
  desktopSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.sizes.spacing.m,
    paddingHorizontal: theme.sizes.spacing.xs,
  },
  desktopSectionTitle: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n900,
    fontWeight: '700',
  },
  desktopSectionSubtitle: {
    ...theme.sizes.typography.bodySmall,
    color: theme.colors.n500,
    marginTop: 2,
  },
  desktopEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.p500,
    paddingVertical: theme.sizes.spacing.xs,
    paddingHorizontal: theme.sizes.spacing.m,
    borderRadius: theme.sizes.borderRadius.medium,
    gap: theme.sizes.spacing.xs,
  },
  desktopEditBtnText: {
    ...theme.sizes.typography.bodySmall,
    color: theme.colors.p500,
    fontWeight: '600',
  },
  desktopInfoCard: {
    marginTop: 0,
    marginHorizontal: 0,
    marginBottom: theme.sizes.spacing.m,
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
    padding: theme.sizes.spacing.xl,
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
  doctorPausedAlertCard: {
    backgroundColor: theme.colors.warning + '18',
    borderWidth: 1,
    borderColor: theme.colors.warning,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.m,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.sizes.spacing.m,
  },
  doctorPausedAlertCardMobile: {
    marginHorizontal: theme.sizes.spacing.m,
    marginTop: theme.sizes.spacing.m,
  },
  doctorPausedAlertIcon: {
    width: theme.sizes.scale(40),
    height: theme.sizes.scale(40),
    borderRadius: theme.sizes.scale(20),
    backgroundColor: theme.colors.warning + '25',
    justifyContent: 'center',
    alignItems: 'center',
  },
  doctorPausedAlertTitle: {
    ...theme.sizes.typography.h5,
    color: theme.colors.n900,
    fontWeight: '700',
    marginBottom: 2,
  },
  doctorPausedAlertText: {
    ...theme.sizes.typography.caption,
    color: theme.colors.n700,
    lineHeight: theme.sizes.scale(16),
  },
  doctorResumeBtn: {
    backgroundColor: theme.colors.warning,
    paddingHorizontal: theme.sizes.spacing.m,
    paddingVertical: theme.sizes.spacing.xs,
    borderRadius: theme.sizes.borderRadius.medium,
  },
  doctorResumeBtnText: {
    ...theme.sizes.typography.bodySmall,
    color: theme.colors.white,
    fontWeight: '700',
  },
  sheetSelectorContainer: {
    padding: theme.sizes.spacing.l,
  },
  sheetSelectorTitle: {
    ...theme.sizes.typography.h4,
    color: theme.colors.n900,
    fontWeight: '700',
    marginBottom: theme.sizes.spacing.xs,
  },
  sheetSelectorSubtitle: {
    ...theme.sizes.typography.bodySmall,
    color: theme.colors.n500,
    marginBottom: theme.sizes.spacing.m,
  },
  sheetOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.sizes.spacing.m,
    borderRadius: theme.sizes.borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.colors.n300,
    backgroundColor: theme.colors.white,
    marginBottom: theme.sizes.spacing.s,
    gap: theme.sizes.spacing.m,
  },
  sheetOptionRowSelected: {
    borderColor: theme.colors.p500,
    backgroundColor: theme.colors.p100 || '#E6F9F5',
  },
  sheetOptionIconBox: {
    width: theme.sizes.scale(38),
    height: theme.sizes.scale(38),
    borderRadius: theme.sizes.scale(19),
    backgroundColor: theme.colors.n200 || '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetOptionIconBoxSelected: {
    backgroundColor: theme.colors.p500,
  },
  sheetOptionTitle: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n900,
    fontWeight: '600',
  },
  sheetOptionTitleSelected: {
    color: theme.colors.p500,
    fontWeight: '700',
  },
  sheetOptionDesc: {
    ...theme.sizes.typography.caption,
    color: theme.colors.n500,
    marginTop: 2,
  },
  radioCircle: {
    width: theme.sizes.scale(20),
    height: theme.sizes.scale(20),
    borderRadius: theme.sizes.scale(10),
    borderWidth: 2,
    borderColor: theme.colors.n400,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    borderColor: theme.colors.p500,
  },
  radioInner: {
    width: theme.sizes.scale(10),
    height: theme.sizes.scale(10),
    borderRadius: theme.sizes.scale(5),
    backgroundColor: theme.colors.p500,
  },
  desktopPasswordModalCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    width: '100%',
    maxWidth: theme.sizes.scale(540),
    maxHeight: '90%',
    padding: theme.sizes.spacing.l,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  desktopPasswordModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: theme.sizes.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.n300,
    marginBottom: theme.sizes.spacing.m,
  },
  desktopPasswordIconBox: {
    width: theme.sizes.scale(36),
    height: theme.sizes.scale(36),
    borderRadius: theme.sizes.scale(18),
    backgroundColor: theme.colors.p100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  desktopPasswordModalTitle: {
    ...theme.sizes.typography.h4,
    color: theme.colors.n900,
    fontWeight: '700',
  },
  desktopPasswordCloseBtn: {
    width: theme.sizes.scale(32),
    height: theme.sizes.scale(32),
    borderRadius: theme.sizes.scale(16),
    backgroundColor: theme.colors.n200,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
