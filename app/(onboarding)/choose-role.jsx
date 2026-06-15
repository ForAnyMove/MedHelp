import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '../../src/components/ui/Screen';
import { Button } from '../../src/components/ui/Button';
import { useTheme } from '../../src/theme/ThemeContext';
import { useStyles } from '../../src/theme/useStyles';
import { Icon } from '../../src/components/ui/Icon';
import { Images } from '../../src/assets';
import { useSession } from '../../src/context/SessionContext';

export default function ChooseRole() {
  const router = useRouter();
  const { t } = useTranslation();
  const { sizes } = useTheme();
  const styles = useStyles(themeStyles);
  const { setRole, logout, session } = useSession();

  const [selectedRole, setSelectedRole] = useState(session?.role || null); // 'patient' or 'doctor'
  const [loading, setLoading] = useState(false);

  const handleBack = async () => {
    await logout();
    router.replace('/(auth)/welcome');
  };

  const handleContinue = async () => {
    if (!selectedRole) return;
    setLoading(true);
    const result = await setRole(selectedRole);
    setLoading(false);
    if (result.success) {
      router.push('/(onboarding)/onboarding');
    }
  };

  return (
    <Screen style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Icon name="arrow-back" size={sizes.scale(24)} color={styles.iconColor.color} />
          </TouchableOpacity>
        </View>

        <View style={styles.logoContainer}>
          <Image source={Images.logo} style={styles.logoImage} resizeMode="contain" />
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{t('auth.choose_role_title')}</Text>
          <Text style={styles.subtitle}>{t('auth.choose_role_subtitle')}</Text>

          <TouchableOpacity
            style={[styles.card, selectedRole === 'patient' && styles.cardActive]}
            activeOpacity={0.8}
            onPress={() => setSelectedRole('patient')}
          >
            <View style={styles.cardImageContainer}>
              <Image source={Images.patientCard} style={styles.cardImage} resizeMode="contain" />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>{t('auth.patient_card_title')}</Text>
              <Text style={styles.cardDesc}>{t('auth.patient_card_desc')}</Text>
            </View>
            <View style={styles.radioContainer}>
              <Icon
                name={selectedRole === 'patient' ? "radio-selected" : "radio-empty"}
                size={sizes.scale(24)}
              />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.card, selectedRole === 'doctor' && styles.cardActive]}
            activeOpacity={0.8}
            onPress={() => setSelectedRole('doctor')}
          >
            <View style={styles.cardImageContainer}>
              <Image source={Images.doctorCard} style={styles.cardImage} resizeMode="contain" />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>{t('auth.doctor_card_title')}</Text>
              <Text style={styles.cardDesc}>{t('auth.doctor_card_desc')}</Text>
            </View>
            <View style={styles.radioContainer}>
              <Icon
                name={selectedRole === 'doctor' ? "radio-selected" : "radio-empty"}
                size={sizes.scale(24)}
              />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={t('auth.continue_btn')}
          variant="primary"
          onPress={handleContinue}
          disabled={!selectedRole || loading}
          loading={loading}
          style={styles.button}
        />
      </View>
    </Screen>
  );
}

const themeStyles = (theme) => ({
  container: {
    paddingHorizontal: theme.sizes.spacing.m,
    paddingTop: theme.sizes.spacing.s,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: theme.sizes.spacing.l,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginTop: theme.sizes.spacing.m,
    minHeight: theme.sizes.scale(24),
  },
  backButton: {
    position: 'absolute',
    left: 0,
    zIndex: 10,
    padding: theme.sizes.spacing.xs,
  },
  iconColor: {
    color: theme.colors.p500,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: theme.sizes.scale(92),
  },
  logoImage: {
    width: theme.sizes.scale(100),
    height: theme.sizes.scale(76),
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n900,
    marginBottom: theme.sizes.spacing.s,
    textAlign: 'center',
  },
  subtitle: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n700,
    textAlign: 'center',
    marginBottom: theme.sizes.scale(40),
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.m,
    width: '100%',
    borderWidth: 1,
    borderColor: theme.colors.n200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardActive: {
    borderColor: theme.colors.p500,
    backgroundColor: theme.colors.p100,
  },
  cardImageContainer: {
    width: theme.sizes.scale(80),
    height: theme.sizes.scale(80),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.sizes.spacing.m,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    ...theme.sizes.typography.h4,
    color: theme.colors.n900,
    marginBottom: theme.sizes.spacing.xs,
  },
  cardDesc: {
    ...theme.sizes.typography.caption,
    color: theme.colors.n700,
  },
  radioContainer: {
    marginLeft: theme.sizes.spacing.s,
  },
  radioActive: {
    color: theme.colors.p500,
  },
  radioInactive: {
    color: theme.colors.n400,
  },
  footer: {
    paddingBottom: theme.sizes.scale(40),
  },
  button: {
    width: '100%',
  }
});
