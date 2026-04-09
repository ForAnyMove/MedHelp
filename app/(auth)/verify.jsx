import React, { useState, useRef, useEffect } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, TextInput, ScrollView, Pressable, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '../../src/components/ui/Screen';
import { Button } from '../../src/components/ui/Button';
import { useTheme } from '../../src/theme/ThemeContext';
import { useStyles } from '../../src/theme/useStyles';
import { Icon } from '../../src/components/ui/Icon';
import { useSession } from '../../src/context/SessionContext';
import { Images } from '../../src/assets';

export default function Verify() {
  const router = useRouter();
  const { role, contact } = useLocalSearchParams();
  const { t } = useTranslation();
  const { sizes } = useTheme();
  const styles = useStyles(themeStyles);
  const pinRef = useRef(null);
  const { verifyOtp, session, isLoading } = useSession();

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(30);

  // Timer logic for resending code
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleResend = () => {
    if (timer === 0) {
      setTimer(30);
      setCode('');
      // In a real app: call API to resend code here
      console.log('OTP Resent');
    }
  };

  const isDoctor = role === 'doctor';

  const handleConfirm = async (overrideCode) => {
    const codeToVerify = overrideCode || code;
    if (codeToVerify.length < 6) return;

    setLoading(true);
    setError('');
    const result = await verifyOtp(contact || 'user@example.com', codeToVerify, role || 'patient');
    setLoading(false);
    if (result.success) {
      // Session is now set via verifyOtp → login.
      // NavigationManager will redirect based on session.onboarded.
    } else {
      setError(result.error || 'Invalid code');
    }
  };

  return (
    <Screen style={styles.container}>
      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Header */}
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
              <Image
                source={Images.logo}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <Text style={styles.title}>{t('auth.verify_title')}</Text>

            <Pressable onPress={() => pinRef.current?.focus()} style={styles.pinWrapper}>
              <TextInput
                ref={pinRef}
                style={styles.hiddenInput}
                value={code}
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^0-9]/g, '').slice(0, 6);
                  setCode(cleaned);
                  if (cleaned.length === 6) {
                    handleConfirm(cleaned);
                  }
                }}
                keyboardType="number-pad"
                autoFocus
                maxLength={6}
                caretHidden
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
                editable={!loading}
              />

              <View style={styles.pinContainer} pointerEvents="none">
                {[0, 1, 2, 3, 4, 5].map((index) => {
                  const isActive = code.length === index;
                  const digit = code[index] || '';
                  return (
                    <View key={index} style={[styles.pinBox, isActive && styles.pinBoxActive]}>
                      <Text style={styles.pinText}>{digit}</Text>
                    </View>
                  );
                })}
              </View>
            </Pressable>

            <Pressable onPress={handleResend} style={styles.resendWrapper}>
              <Text style={[styles.resendText, timer === 0 && styles.resendActive]}>
                {timer > 0 ? t('auth.resend_code') + ` (${timer}s)` : t('auth.resend_code')}
              </Text>
            </Pressable>

            <View style={styles.spacer} />

            <Button
              title={t('auth.confirm_btn')}
              variant="primary"
              onPress={() => handleConfirm()}
              style={styles.button}
              disabled={code.length < 6 || loading}
              loading={loading}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const themeStyles = (theme) => ({
  container: {
    paddingHorizontal: theme.sizes.spacing.m,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.sizes.scale(60), // Space for status bar
    marginBottom: theme.sizes.scale(60),
    height: theme.sizes.scale(100),
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: -theme.sizes.scale(40), // Position slightly above the header if needed
    zIndex: 10,
    padding: theme.sizes.spacing.xs,
  },
  iconColor: {
    color: theme.colors.p500,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoImage: {
    width: theme.sizes.scale(100),
    height: theme.sizes.scale(76),
  },
  logoColor: {
    color: theme.colors.p500,
  },
  logoText: {
    ...theme.sizes.typography.h4,
    color: theme.colors.n900,
    marginLeft: theme.sizes.spacing.xs,
  },
  formContainer: {
    flex: 1,
    paddingTop: theme.sizes.scale(40),
    alignItems: 'center',
  },
  title: {
    ...theme.sizes.typography.bodyLarge,
    color: theme.colors.n700,
    textAlign: 'center',
    marginBottom: theme.sizes.scale(30),
    paddingHorizontal: theme.sizes.spacing.xl,
  },
  pinWrapper: {
    position: 'relative',
    marginBottom: theme.sizes.spacing.xl,
  },
  hiddenInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
    color: 'transparent',
    backgroundColor: 'transparent',
    zIndex: 1,
    fontSize: 1,
  },
  pinContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.sizes.scale(10),
    zIndex: 0,
  },
  pinBox: {
    width: theme.sizes.scale(42),
    height: theme.sizes.scale(60),
    borderRadius: theme.sizes.scale(20),
    borderWidth: 1,
    borderColor: theme.colors.n200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
  },
  pinBoxActive: {
    borderColor: theme.colors.p500,
    borderWidth: 2,
  },
  pinText: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n900,
  },
  resendWrapper: {
    marginTop: theme.sizes.spacing.xl,
  },
  resendText: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n500,
    textAlign: 'center',
  },
  resendActive: {
    color: theme.colors.p500,
    textDecorationLine: 'underline',
  },
  spacer: {
    flex: 1,
  },
  button: {
    marginBottom: theme.sizes.spacing.xl,
    width: '100%',
  }
});
