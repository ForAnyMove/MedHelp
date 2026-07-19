import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, ScrollView, Platform, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '../../../components/ui/Screen';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Icon } from '../../../components/ui/Icon';
import { useTheme } from '../../../theme/ThemeContext';
import { useStyles } from '../../../theme/useStyles';
import { useComponentContext } from '../../../context/GlobalContext';

const calculateStrength = (password) => {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score; // 0 = empty, 1 = weak, 2 = fair, 3 = good, 4 = strong
};

const STRENGTH_LABELS = ['Weak', 'Weak', 'Fair', 'Good', 'Strong'];

export function ChangePasswordScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { sizes, colors } = useTheme();
  const styles = useStyles(themeStyles);
  const context = useComponentContext();

  const user = context.user;
  const hasPassword = user?.hasPassword;

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const strengthScore = calculateStrength(newPassword);
  const strengthLabel = STRENGTH_LABELS[strengthScore] || 'Weak';
  
  let strengthColor = colors.n300;
  if (newPassword.length > 0) {
    if (strengthScore <= 1) strengthColor = colors.danger;
    else if (strengthScore === 2) strengthColor = colors.warning; // Fair
    else if (strengthScore === 3) strengthColor = /* TODO: color */ '#2D9CDB'; // Good (Blue/Teal)
    else if (strengthScore === 4) strengthColor = colors.p500; // Strong (Green)
  }

  const doPasswordsMatch = newPassword.length > 0 && confirmPassword.length > 0 && newPassword === confirmPassword;
  const showMatchError = confirmPassword.length > 0 && !doPasswordsMatch;

  const isValid = (!hasPassword || currentPassword.length > 0) && strengthScore === 4 && doPasswordsMatch;

  const handleSubmit = async () => {
    if (!isValid) return;
    setLoading(true);
    
    try {
      const { createApiClient } = require('../../../api/apiClient');
      const api = createApiClient(context.session);
      
      const payload = { new_password: newPassword };
      if (hasPassword) {
        payload.current_password = currentPassword;
      }
      
      await api.post('/auth/change-password', payload);
      
      // Update local context if needed
      if (!hasPassword && context.updateProfile) {
         context.updateProfile({ hasPassword: true });
      }
      
      Alert.alert(t('common.success', 'Success'), t('profile.password_updated', 'Password updated successfully'), [
        { text: 'OK', onPress: handleBack }
      ]);
    } catch (err) {
      Alert.alert(t('common.error', 'Error'), err.message || t('errors.general', 'Something went wrong'));
    } finally {
      setLoading(false);
    }
  };

  const renderEyeIcon = (show, setShow) => (
    <TouchableOpacity onPress={() => setShow(!show)}>
      <Icon name={show ? 'visible' : 'invisible'} size={sizes.scale(20)} color={colors.n500} />
    </TouchableOpacity>
  );

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  return (
    <Screen style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.backButton}>
              <Icon
                name="arrow-back"
                size={sizes.scale(24)}
                color={colors.p500}
                onPress={handleBack}
              />
            </View>
            <Text style={styles.headerTitle}>{t('profile.change_password', 'Change password')}</Text>
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Icon name="shield-checkmark-outline" size={sizes.scale(24)} color={colors.p500} />
            <Text style={styles.infoText}>
              {t('profile.password_requirements', 'Use at least 8 characters with a mix of letters, numbers and symbols for a strong password.')}
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {hasPassword && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('profile.current_password', 'Current password')}</Text>
                <Input
                  placeholder={t('profile.current_password_placeholder', 'Enter current password')}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry={!showCurrent}
                  rounded
                  rightElement={renderEyeIcon(showCurrent, setShowCurrent)}
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('profile.new_password', 'New password')}</Text>
              <Input
                placeholder={t('profile.new_password_placeholder', 'Min 8 characters')}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNew}
                rounded
                rightElement={renderEyeIcon(showNew, setShowNew)}
              />
              {newPassword.length > 0 && (
                <View style={styles.strengthContainer}>
                  <View style={[styles.strengthBar, { backgroundColor: strengthColor, width: `${(strengthScore / 4) * 100}%` }]} />
                  <Text style={[styles.strengthText, { color: strengthColor }]}>{strengthLabel}</Text>
                </View>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('profile.confirm_new_password', 'Confirm new password')}</Text>
              <Input
                placeholder={t('profile.confirm_new_password_placeholder', 'Repeat new password')}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirm}
                rounded
                rightElement={renderEyeIcon(showConfirm, setShowConfirm)}
              />
              
              {doPasswordsMatch && (
                <View style={styles.matchContainer}>
                  <Text style={styles.matchText}>{t('profile.passwords_match', 'Passwords match')}</Text>
                  <Icon name="checkmark" size={sizes.scale(16)} color={colors.p500} />
                </View>
              )}
              {showMatchError && (
                <View style={styles.matchContainer}>
                  <Text style={styles.errorText}>{t('profile.passwords_do_not_match', 'Passwords do not match')}</Text>
                  <Icon name="close" size={sizes.scale(16)} color={colors.danger} />
                </View>
              )}
            </View>
          </View>

          {/* Footer Area */}
          <View style={styles.footerContainer}>
            <Button
              title={t('profile.update_password', 'Update password')}
              variant="outlined"
              onPress={handleSubmit}
              style={[styles.submitBtn, isValid ? styles.submitBtnValid : null]}
              textStyle={isValid ? styles.submitBtnTextValid : null}
              disabled={!isValid || loading}
              loading={loading}
              icon={<Icon name="lock-closed-outline" size={sizes.scale(20)} color={isValid ? colors.white : colors.p500} />}
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
    backgroundColor: theme.colors.bg,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.sizes.scale(40),
    marginBottom: theme.sizes.scale(24),
    position: 'relative',
    height: theme.sizes.scale(50),
  },
  backButton: {
    padding: theme.sizes.spacing.xs,
    marginRight: theme.sizes.spacing.s,
  },
  headerTitle: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n900,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: /* TODO: color */ '#E6F9F5', // Light green background matching screenshot
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.xl,
    alignItems: 'center',
  },
  infoText: {
    ...theme.sizes.typography.bodySmall,
    color: theme.colors.p500,
    marginLeft: theme.sizes.spacing.s,
    flex: 1,
    lineHeight: theme.sizes.scale(20),
  },
  formContainer: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: theme.sizes.spacing.l,
  },
  label: {
    ...theme.sizes.typography.caption,
    color: theme.colors.n500,
    marginBottom: theme.sizes.spacing.xs,
  },
  strengthContainer: {
    marginTop: theme.sizes.spacing.xs,
  },
  strengthBar: {
    height: theme.sizes.scale(4),
    borderRadius: theme.sizes.scale(2),
    backgroundColor: theme.colors.n300,
    marginBottom: theme.sizes.scale(4),
  },
  strengthText: {
    ...theme.sizes.typography.caption,
  },
  matchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.sizes.spacing.xs,
  },
  matchText: {
    ...theme.sizes.typography.caption,
    color: theme.colors.p500,
    marginRight: theme.sizes.scale(4),
  },
  errorText: {
    ...theme.sizes.typography.caption,
    color: theme.colors.danger,
    marginRight: theme.sizes.scale(4),
  },
  footerContainer: {
    paddingBottom: theme.sizes.scale(40),
    paddingTop: theme.sizes.scale(20),
  },
  submitBtn: {
    borderColor: theme.colors.p500,
    borderRadius: theme.sizes.scale(30),
  },
  submitBtnValid: {
    backgroundColor: theme.colors.p500,
  },
  submitBtnTextValid: {
    color: theme.colors.white,
  },
});
