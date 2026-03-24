import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '../../src/components/ui/Screen';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import LogoSvg from '../../assets/logo.svg';
import { useTheme } from '../../src/theme/ThemeContext';
import { useStyles } from '../../src/theme/useStyles';
import { Icon } from '../../src/components/ui/Icon';

export default function Login() {
  const router = useRouter();
  const { role } = useLocalSearchParams();
  const { t } = useTranslation();
  const { sizes } = useTheme();
  const styles = useStyles(themeStyles);
  
  const [contact, setContact] = useState('');

  const isDoctor = role === 'doctor';

  const handleContinue = () => {
    // Navigate to Verification screen
    router.push(`/(auth)/verify?role=${isDoctor ? 'doctor' : 'patient'}`);
  };

  return (
    <Screen style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Back Button & Logo */}
          <View style={styles.header}>
            <View style={styles.backButton}>
              <Icon 
                name="ArrowLeft" 
                size={sizes.scale(24)} 
                color={styles.iconColor.color} 
                onPress={() => router.back()}
              />
            </View>
            <View style={styles.logoContainer}>
              <LogoSvg width={sizes.scale(100)} height={sizes.scale(75)} />
            </View>
          </View>

          {/* Form Area */}
          <View style={styles.formContainer}>
            <Text style={styles.title}>
              {isDoctor ? t('auth.login_doctor_title') : t('auth.welcome_subtitle')}
            </Text>
            
            <View style={styles.inputWrapper}>
              <Input 
                placeholder={t('auth.login_placeholder')} 
                value={contact}
                onChangeText={setContact}
              />
            </View>
            
            <Text style={styles.termsText}>
              {t('auth.terms_text')} <Text style={styles.link}>{t('auth.privacy_policy')}</Text> & <Text style={styles.link}>{t('auth.terms_of_use')}</Text>
            </Text>

            <Button 
              title={t('auth.continue_btn')} 
              variant="primary" 
              onPress={handleContinue}
              style={styles.button}
              disabled={contact.length < 5}
            />
            <Button 
              title={t('auth.login_google_btn')} 
              variant="outlined" 
              icon="Mail" 
              onPress={() => console.log('Google login')}
              style={styles.button}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const themeStyles = (theme) => ({
  container: {
    paddingHorizontal: theme.sizes.spacing.l,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.sizes.scale(20),
    position: 'relative',
    height: theme.sizes.scale(50),
  },
  backButton: {
    position: 'absolute',
    left: 0,
    zIndex: 10,
    padding: theme.sizes.spacing.xs,
  },
  iconColor: {
    color: theme.colors.n900,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoColor: {
    color: theme.colors.p500,
  },
  logoText: {
    ...theme.sizes.typography.h4,
    color: theme.colors.n900,
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    ...theme.sizes.typography.h2,
    color: theme.colors.n900,
    textAlign: 'center',
    marginBottom: theme.sizes.scale(40),
  },
  inputWrapper: {
    marginBottom: theme.sizes.spacing.xl,
  },
  termsText: {
    ...theme.sizes.typography.caption,
    color: theme.colors.n500,
    textAlign: 'center',
    marginBottom: theme.sizes.spacing.l,
    paddingHorizontal: theme.sizes.spacing.l,
  },
  link: {
    color: theme.colors.p500,
    textDecorationLine: 'underline',
  },
  button: {
    marginBottom: theme.sizes.spacing.m,
  }
});
