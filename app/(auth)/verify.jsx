import React, { useState, useRef } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, TextInput, ScrollView, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '../../src/components/ui/Screen';
import { Button } from '../../src/components/ui/Button';
import LogoSvg from '../../assets/logo.svg';
import { useTheme } from '../../src/theme/ThemeContext';
import { useStyles } from '../../src/theme/useStyles';
import { Icon } from '../../src/components/ui/Icon';

export default function Verify() {
  const router = useRouter();
  const { role } = useLocalSearchParams();
  const { t } = useTranslation();
  const { sizes } = useTheme();
  const styles = useStyles(themeStyles);
  const pinRef = useRef(null);
  
  const [code, setCode] = useState('');

  const isDoctor = role === 'doctor';

  const handleConfirm = () => {
    // Navigate to respective flow
    if (isDoctor) {
      router.replace('/(auth)/doctor-upload');
    } else {
      router.replace('/(patient)/');
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
              <LogoSvg width={sizes.scale(100)} height={sizes.scale(75)} />
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
                onChangeText={(text) => setCode(text.replace(/[^0-9]/g, '').slice(0, 6))}
                keyboardType="number-pad"
                autoFocus
                maxLength={6}
                caretHidden
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
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

            <Text style={styles.resendText}>{t('auth.resend_code')}</Text>

            <View style={styles.spacer} />

            <Button 
              title={t('auth.confirm_btn')} 
              variant="primary" 
              onPress={handleConfirm}
              style={styles.button}
              disabled={code.length < 6}
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
  formContainer: {
    flex: 1,
    paddingTop: theme.sizes.scale(60),
  },
  title: {
    ...theme.sizes.typography.bodyLarge,
    color: theme.colors.n900,
    textAlign: 'center',
    marginBottom: theme.sizes.scale(40),
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
    justifyContent: 'space-between',
    zIndex: 0,
  },
  pinBox: {
    width: theme.sizes.scale(45),
    height: theme.sizes.scale(55),
    borderRadius: theme.sizes.borderRadius.small,
    borderWidth: 1,
    borderColor: theme.colors.n300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
  },
  pinBoxActive: {
    borderColor: theme.colors.p500,
    borderWidth: 2,
  },
  pinText: {
    ...theme.sizes.typography.h2,
    color: theme.colors.n900,
  },
  resendText: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n500,
    textAlign: 'center',
  },
  spacer: {
    flex: 1,
  },
  button: {
    marginBottom: theme.sizes.spacing.xl,
  }
});
