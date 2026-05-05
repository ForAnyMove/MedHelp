import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, ScrollView, Platform, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '../../src/components/ui/Screen';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { useTheme } from '../../src/theme/ThemeContext';
import { useStyles } from '../../src/theme/useStyles';
import { Icon } from '../../src/components/ui/Icon';
import { Images } from '../../src/assets';
import { useSession } from '../../src/context/SessionContext';

import { SearchableDropdown } from '../../src/components/ui/SearchableDropdown';

export default function Registration() {
  const { t, i18n } = useTranslation();
  const { sizes } = useTheme();
  const styles = useStyles(themeStyles);
  const { registerProfile, logout, session, getProfessions } = useSession();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [professionCode, setProfessionCode] = useState('');
  
  const [professions, setProfessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [validationErrors, setValidationErrors] = useState({ firstName: '', lastName: '', professionCode: '' });

  const isDoctor = session?.role === 'doctor';

  React.useEffect(() => {
    if (isDoctor) {
      getProfessions(i18n.language).then(setProfessions);
    }
  }, [isDoctor, i18n.language]);

  const validate = () => {
    let valid = true;
    let errors = { firstName: '', lastName: '', professionCode: '' };

    if (!firstName.trim()) {
      errors.firstName = t('auth.required_field') || 'Required';
      valid = false;
    }
    if (!lastName.trim()) {
      errors.lastName = t('auth.required_field') || 'Required';
      valid = false;
    }
    if (isDoctor && !professionCode) {
      errors.professionCode = t('auth.required_field') || 'Required';
      valid = false;
    }

    setValidationErrors(errors);
    return valid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const result = await registerProfile(firstName.trim(), lastName.trim(), isDoctor ? professionCode : null);
      if (!result.success) {
        setErrorMsg(result.error || 'Failed to complete registration');
      }
    } catch (e) {
      setErrorMsg('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = async () => {
    await logout();
  };

  return (
    <Screen style={styles.container}>
      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.backButton}>
              <Icon
                name="ArrowLeft"
                size={sizes.scale(24)}
                color={styles.iconColor.color}
                onPress={handleBack}
              />
            </View>
            <View style={styles.logoContainer}>
              <Image source={Images.logo} style={styles.logo} resizeMode="contain" />
            </View>
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.title}>{t('auth.complete_registration_title')}</Text>
            <Text style={styles.subtitle}>{t('auth.complete_registration_desc')}</Text>
          </View>
          <View style={styles.formContainer}>
            <Input
              label={t('profile.first_name')}
              placeholder={t('profile.first_name_placeholder')}
              value={firstName}
              onChangeText={(text) => {
                setFirstName(text);
                if (validationErrors.firstName) setValidationErrors(prev => ({...prev, firstName: ''}));
              }}
              error={validationErrors.firstName}
              autoCapitalize="words"
            />
            <View style={{ height: sizes.spacing.m }} />
            <Input
              label={t('profile.last_name')}
              placeholder={t('profile.last_name_placeholder')}
              value={lastName}
              onChangeText={(text) => {
                setLastName(text);
                if (validationErrors.lastName) setValidationErrors(prev => ({...prev, lastName: ''}));
              }}
              error={validationErrors.lastName}
              autoCapitalize="words"
            />
            {isDoctor && (
              <>
                <View style={{ height: sizes.spacing.m }} />
                <SearchableDropdown
                    label={"Специализация"}
                    placeholder={"Выберите профессию"}
                    data={professions}
                    value={professionCode}
                    onSelect={(code) => {
                        setProfessionCode(code);
                        if (validationErrors.professionCode) setValidationErrors(prev => ({...prev, professionCode: ''}));
                    }}
                    error={validationErrors.professionCode}
                />
              </>
            )}
            {!!errorMsg && (
              <Text style={styles.errorText}>{errorMsg}</Text>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <View style={styles.footer}>
        <Button 
          title={t('common.continue')}
          variant="primary" 
          onPress={handleSubmit}
          loading={loading}
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: theme.sizes.spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.sizes.scale(30),
    position: 'relative',
    width: '100%',
    height: theme.sizes.scale(40),
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 10,
  },
  iconColor: {
    color: theme.colors.n900,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  logo: {
    width: theme.sizes.scale(100),
    height: theme.sizes.scale(40),
  },
  textWrap: {
    alignItems: 'flex-start',
    marginBottom: theme.sizes.scale(32),
  },
  title: {
    ...theme.sizes.typography.h2,
    color: theme.colors.n900,
    marginBottom: theme.sizes.spacing.s,
  },
  subtitle: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n700,
    maxWidth: '90%',
  },
  formContainer: {
    marginBottom: theme.sizes.scale(24),
  },
  errorText: {
    ...theme.sizes.typography.caption,
    color: theme.colors.d500,
    marginTop: theme.sizes.spacing.s,
    textAlign: 'center',
  },
  footer: {
    paddingBottom: theme.sizes.scale(40),
  }
});
