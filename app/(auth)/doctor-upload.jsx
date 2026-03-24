import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '../../src/components/ui/Screen';
import { Button } from '../../src/components/ui/Button';
import { useTheme } from '../../src/theme/ThemeContext';
import { useStyles } from '../../src/theme/useStyles';
import { Icon } from '../../src/components/ui/Icon';
import LogoSvg from '../../assets/logo.svg';

export default function DoctorUpload() {
  const router = useRouter();
  const { t } = useTranslation();
  const { sizes, colors } = useTheme();
  const styles = useStyles(themeStyles);

  const handleUpload = () => {
    router.replace('/(auth)/doctor-pending');
  };

  return (
    <Screen style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <LogoSvg width={sizes.scale(64)} height={sizes.scale(48)} />
        </View>
        <Text style={styles.skipText} onPress={() => router.replace('/(doctor)/')}>{t('auth.skip')}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{t('auth.doctor_upload_title')}</Text>
        
        <View style={styles.cardsRow}>
          <TouchableOpacity style={styles.uploadCard} activeOpacity={0.7}>
            <View style={styles.iconWrapper}>
              <Icon name="Plus" size={sizes.scale(24)} color={colors.p500} />
            </View>
            <Text style={styles.cardText}>{t('auth.doctor_upload_subtitle')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.uploadCard} activeOpacity={0.7}>
             <View style={styles.iconWrapper}>
              <Icon name="Plus" size={sizes.scale(24)} color={colors.p500} />
            </View>
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
    height: theme.sizes.scale(50),
    marginBottom: theme.sizes.spacing.xl,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoColor: {
    color: theme.colors.p500,
  },
  logoText: {
    ...theme.sizes.typography.h4,
    color: theme.colors.n900,
    marginLeft: theme.sizes.spacing.xs,
  },
  skipText: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n900,
  },
  content: {
    flex: 1,
  },
  title: {
    ...theme.sizes.typography.h2,
    color: theme.colors.n900,
    marginBottom: theme.sizes.spacing.xl,
    textAlign: 'center',
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.sizes.spacing.m,
  },
  uploadCard: {
    flex: 1,
    height: theme.sizes.scale(140),
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.colors.p300,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.sizes.spacing.m,
  },
  iconWrapper: {
    width: theme.sizes.scale(40),
    height: theme.sizes.scale(40),
    borderRadius: theme.sizes.scale(8),
    backgroundColor: theme.colors.p100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.sizes.spacing.m,
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
