import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useComponentContext } from '../../../context/GlobalContext';
import { useStyles } from '../../../theme/useStyles';
import { ProfileHeader } from './components/ProfileHeader';
import { ProfileInfoCard } from './components/ProfileInfoCard';
import { ProfileSection } from './components/ProfileSection';
import { ProfileItem } from './components/ProfileItem';

import { useSession } from '../../../context/SessionContext';
import { useRouter } from 'expo-router';

/**
 * Lazily loads the doctor profile only when role === 'doctor'.
 * This ensures myDoctorProfileManager is never bundled/executed for patients.
 */
function useDoctorProfile(isDoctor) {
  const [doctorProfile, setDoctorProfile] = useState(null);

  useEffect(() => {
    if (!isDoctor) return;
    let cancelled = false;
    import('../../../managers/myDoctorProfileManager').then(({ myDoctorProfileManager }) => {
      if (!cancelled) {
        setDoctorProfile(myDoctorProfileManager.getDashboardData().profile);
      }
    });
    return () => { cancelled = true; };
  }, [isDoctor]);

  return doctorProfile;
}

export function ProfileTab({ role = 'patient' }) {
  const { t } = useTranslation();
  const context = useComponentContext();
  const styles = useStyles(themeStyles);

  const isDoctor = role === 'doctor';
  const doctorProfile = useDoctorProfile(isDoctor);
  const user = isDoctor ? doctorProfile : context.user;
  const updateProfile = context.updateProfile;
  const { logout } = useSession();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/welcome');
  };

  if (!user) return null;


  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <ProfileHeader user={user} />
        
        <ProfileInfoCard user={user} />

        {isDoctor && (
          <ProfileSection title={t('profile.professional_details')}>
            <ProfileItem label={t('profile.experience')} value={user.experience} />
            <ProfileItem label={t('profile.education')} value={user.education} />
            <ProfileItem label={t('profile.license')} value={user.license} />
            <ProfileItem label={t('profile.workplace')} value={user.workplace} isLast />
          </ProfileSection>
        )}

        {isDoctor && (
          <ProfileSection title={t('profile.about_me')}>
            <View style={styles.aboutContainer}>
               <Text style={styles.aboutDesc}>{t('profile.about_placeholder')}</Text>
               <Text style={styles.aboutText}>{user.aboutMe}</Text>
               <Text style={styles.aboutCount}>{user.aboutMe?.length || 0}/100</Text>
            </View>
          </ProfileSection>
        )}

        {!isDoctor && (
          <ProfileSection title={t('profile.medical_data')}>
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
    </View>
  );
}

const themeStyles = (theme) => ({
  container: {
    flex: 1,
    backgroundColor: '#F3F9F9',
  },
  scrollContent: {
    paddingBottom: 100, // Bottom Tab height
  },
  footerSpacer: {
    height: 40,
  },
  aboutContainer: {
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    padding: theme.sizes.spacing.m,
  },
  aboutDesc: {
    ...theme.sizes.typography.caption,
    color: theme.colors.n400,
    marginBottom: theme.sizes.spacing.s,
  },
  aboutText: {
    ...theme.sizes.typography.body,
    color: theme.colors.n900,
  },
  aboutCount: {
    ...theme.sizes.typography.caption,
    color: theme.colors.n400,
    textAlign: 'right',
    marginTop: theme.sizes.spacing.xs,
  }
});
