import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '../../src/components/ui/Screen';
import { Button } from '../../src/components/ui/Button';
import { useTheme } from '../../src/theme/ThemeContext';
import { useStyles } from '../../src/theme/useStyles';
import { Icon } from '../../src/components/ui/Icon';
import { useSession } from '../../src/context/SessionContext';
import { Images } from '../../src/assets';

export default function DoctorUpload() {
  const router = useRouter();
  const { t } = useTranslation();
  const { sizes, colors } = useTheme();
  const styles = useStyles(themeStyles);
  const { session, updateSession } = useSession();

  const handleUpload = async () => {
    // Mark as onboarded and navigate to pending
    await updateSession({ onboarded: true });
    router.replace('/(auth)/doctor-pending');
  };


  const handleSkip = async () => {
    await updateSession({ onboarded: true });
    // NavigationManager will redirect to /home
  };

  return (
    <Screen style={styles.container}>
      {/* Top Header: Back arrow + Skip */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Icon name="ArrowLeft" size={sizes.scale(24)} color={colors.p500} />
        </TouchableOpacity>
        <Text style={styles.skipText} onPress={handleSkip}>{t('auth.skip')}</Text>
      </View>

      {/* Centered Logo */}
      <View style={styles.logoArea}>
        <Image 
          source={Images.logo} 
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>{t('auth.doctor_upload_title')}</Text>
        
        <View style={styles.cardsRow}>
          <TouchableOpacity style={styles.uploadCard} activeOpacity={0.7}>
            <Icon name="plus" size={sizes.scale(20)} color={colors.p500} wrapped wrapperStyle={{ marginBottom: sizes.spacing.s }} />
            <Text style={styles.cardText}>{t('auth.doctor_upload_subtitle')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.uploadCard} activeOpacity={0.7}>
            <Icon name="plus" size={sizes.scale(20)} color={colors.p500} wrapped wrapperStyle={{ marginBottom: sizes.spacing.s }} />
            <Text style={styles.cardText}>{t('auth.doctor_upload_license')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <Button 
          title={t('auth.upload_files_btn')} 
          variant="primary" 
          onPress={handleUpload}
        />
      </View>
    </Screen>
  );
}

const themeStyles = (theme) => ({
  container: {
    paddingHorizontal: theme.sizes.spacing.l,
    paddingTop: theme.sizes.spacing.s,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: theme.sizes.scale(44),
  },
  backButton: {
    width: theme.sizes.scale(40),
    height: theme.sizes.scale(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n900,
  },
  logoArea: {
    alignItems: 'center',
    marginTop: theme.sizes.spacing.s,
    marginBottom: theme.sizes.spacing.m,
  },
  logoImage: {
    width: theme.sizes.scale(100),
    height: theme.sizes.scale(76),
  },
  content: {
    flex: 1,
    paddingTop: theme.sizes.scale(120),
  },
  title: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n900,
    marginBottom: theme.sizes.spacing.xl,
    textAlign: 'center',
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.sizes.spacing.m,
    paddingHorizontal: theme.sizes.spacing.s,
  },
  uploadCard: {
    flex: 1,
    height: theme.sizes.scale(200),
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.scale(16),
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.sizes.spacing.m,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardText: {
    ...theme.sizes.typography.caption,
    color: theme.colors.n700,
    textAlign: 'center',
  },
  footer: {
    paddingBottom: theme.sizes.scale(40),
  }
});

