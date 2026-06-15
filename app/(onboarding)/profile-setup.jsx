import React, { useState, useEffect } from 'react';
import { View, Text, KeyboardAvoidingView, ScrollView, Platform, TouchableOpacity, TouchableWithoutFeedback, Keyboard, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '../../src/components/ui/Screen';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { useTheme } from '../../src/theme/ThemeContext';
import { useStyles } from '../../src/theme/useStyles';
import { Icon } from '../../src/components/ui/Icon';
import { useSession } from '../../src/context/SessionContext';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function ProfileSetup() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { sizes } = useTheme();
  const styles = useStyles(themeStyles);
  const { session, registerProfile, getProfessions } = useSession();

  const isDoctor = session?.role === 'doctor';

  // Pre-fill from session data (for back-navigation or re-login)
  const [fullName, setFullName] = useState(() => {
    const fn = session?.firstName || '';
    const ln = session?.lastName || '';
    return [fn, ln].filter(Boolean).join(' ');
  });
  const [phone, setPhone] = useState(session?.phone || '');
  const [dateOfBirth, setDateOfBirth] = useState(() => {
    // Session stores YYYY-MM-DD, display as DD.MM.YYYY
    if (session?.dateOfBirth) {
      const parts = session.dateOfBirth.split('-');
      if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`;
    }
    return '';
  });
  const [gender, setGender] = useState(session?.gender || null); // 'female' | 'male' | null
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleDobChange = (text) => {
    let cleaned = text.replace(/\D/g, '');
    let formatted = cleaned;
    if (cleaned.length > 2) {
      formatted = cleaned.slice(0, 2) + '.' + cleaned.slice(2);
    }
    if (cleaned.length > 4) {
      formatted = formatted.slice(0, 5) + '.' + cleaned.slice(4);
    }
    setDateOfBirth(formatted);
    if (validationErrors.dob) setValidationErrors(prev => ({ ...prev, dob: '' }));
  };

  const handlePhoneChange = (text) => {
    let cleaned = text.replace(/[^\d+]/g, '');
    setPhone(cleaned);
    if (validationErrors.phone) setValidationErrors(prev => ({ ...prev, phone: '' }));
  };

  const onNativeDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const day = selectedDate.getDate().toString().padStart(2, '0');
      const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
      const year = selectedDate.getFullYear();
      setDateOfBirth(`${day}.${month}.${year}`);
      if (validationErrors.dob) setValidationErrors(prev => ({ ...prev, dob: '' }));
    }
  };

  // Multi-specialization: array of selected profession codes, pre-fill from session
  const [professionCodes, setProfessionCodes] = useState(session?.professionCodes || []); // string[]
  const [searchQuery, setSearchQuery] = useState('');

  const [professions, setProfessions] = useState([]);
  const [professionsLoading, setProfessionsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (isDoctor) {
      setProfessionsLoading(true);
      getProfessions(i18n.language)
        .then(setProfessions)
        .finally(() => setProfessionsLoading(false));
    }
  }, [isDoctor, i18n.language]);

  const filteredProfessions = professions.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Toggle a profession code in/out of the selected array
  const toggleProfession = (code) => {
    setProfessionCodes(prev => {
      const isSelected = prev.includes(code);
      const next = isSelected ? prev.filter(c => c !== code) : [...prev, code];
      if (validationErrors.professionCode) {
        setValidationErrors(e => ({ ...e, professionCode: '' }));
      }
      return next;
    });
  };

  const validate = () => {
    let valid = true;
    let errors = {};

    if (!fullName.trim()) {
      errors.fullName = t('auth.required_field') || 'Required';
      valid = false;
    }
    if (isDoctor && professionCodes.length === 0) {
      errors.professionCode = t('auth.required_field') || 'Required';
      valid = false;
    }
    if (phone && phone.length < 10) {
      errors.phone = t('auth.invalid_format') || 'Too short';
      valid = false;
    }
    if (dateOfBirth) {
      const regex = /^\d{2}\.\d{2}\.\d{4}$/;
      if (!regex.test(dateOfBirth)) {
        errors.dob = t('auth.invalid_format') || 'Invalid format (DD.MM.YYYY)';
        valid = false;
      }
    }

    setValidationErrors(errors);
    return valid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setErrorMsg('');

    let formattedDob = dateOfBirth;
    if (dateOfBirth && dateOfBirth.includes('.')) {
      const parts = dateOfBirth.split('.');
      if (parts.length === 3) {
        formattedDob = `${parts[2]}-${parts[1]}-${parts[0]}`; // YYYY-MM-DD
      }
    }

    // Build names array for selected professions (for doc-upload labels)
    const selectedProfessionNames = professionCodes.map(code => {
      const prof = professions.find(p => p.code === code);
      return prof ? prof.name : code;
    });

    try {
      const result = await registerProfile({
        fullName: fullName.trim(),
        phone: phone.trim() || null,
        dateOfBirth: formattedDob || null,
        gender: gender,
        professionCodes: isDoctor ? professionCodes : [],
        professionNames: isDoctor ? selectedProfessionNames : [],
      });
      if (!result.success) {
        setErrorMsg(result.error || 'Failed to complete registration');
      } else {
        if (isDoctor) {
          router.push('/(onboarding)/doc-upload');
        } else {
          router.push('/(onboarding)/profile-created');
        }
      }
    } catch (e) {
      setErrorMsg('Network error');
    } finally {
      setLoading(false);
    }
  };

  const formContent = (
    <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/(onboarding)/choose-role')} style={styles.backButton}>
          <Icon name="arrow-back" size={sizes.scale(24)} color={styles.iconColor.color} />
        </TouchableOpacity>
      </View>

      <View style={styles.textWrap}>
        <Text style={styles.title}>{t('auth.profile_setup_title')}</Text>
        <Text style={styles.subtitle}>{t('auth.profile_setup_subtitle')}</Text>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.sectionTitle}>{t('auth.personal_data')}</Text>

        <Input
          label={t('auth.full_name')}
          placeholder={t('auth.full_name_placeholder')}
          value={fullName}
          onChangeText={(text) => {
            setFullName(text);
            if (validationErrors.fullName) setValidationErrors(prev => ({ ...prev, fullName: '' }));
          }}
          error={validationErrors.fullName}
          autoCapitalize="words"
          rounded
        />

        <Input
          label="Email"
          value={session?.email || ''}
          editable={false}
          rounded
          style={{ opacity: 0.7 }}
        />

        <Input
          label={t('auth.phone')}
          placeholder={t('auth.phone_placeholder')}
          value={phone}
          onChangeText={handlePhoneChange}
          error={validationErrors.phone}
          keyboardType="phone-pad"
          rounded
        />

        <Input
          label={t('auth.dob')}
          placeholder={t('auth.dob_placeholder')}
          value={dateOfBirth}
          onChangeText={handleDobChange}
          error={validationErrors.dob}
          keyboardType="numeric"
          maxLength={10} // DD.MM.YYYY
          rounded
          rightElement={
            <TouchableOpacity
              onPress={() => {
                if (Platform.OS !== 'web') {
                  setShowDatePicker(true);
                }
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{ position: 'relative', overflow: 'hidden' }}
            >
              <Icon name="calendar" size={sizes.scale(24)} color={styles.iconInactive.color} />
              {Platform.OS === 'web' && React.createElement('input', {
                type: 'date',
                style: { position: 'absolute', opacity: 0, top: 0, left: 0, width: '100%', height: '100%', cursor: 'pointer' },
                onChange: (e) => {
                  const val = e.target.value;
                  if (val) {
                    const [y, m, d] = val.split('-');
                    setDateOfBirth(`${d}.${m}.${y}`);
                    if (validationErrors.dob) setValidationErrors(prev => ({ ...prev, dob: '' }));
                  }
                }
              })}
            </TouchableOpacity>
          }
        />

        {Platform.OS !== 'web' && showDatePicker && (
          <DateTimePicker
            value={new Date()}
            mode="date"
            display="default"
            onChange={onNativeDateChange}
            maximumDate={new Date()}
          />
        )}

        <Text style={styles.sectionTitle}>{t('auth.gender')}</Text>
        <View style={styles.genderContainer}>
          <TouchableOpacity
            style={[styles.genderCard, gender === 'female' && styles.genderCardActive]}
            onPress={() => setGender('female')}
            activeOpacity={0.7}
          >
            <Icon name="gender-female" color={styles.iconActive.color} size={sizes.scale(24)} wrapped />
            <Text style={[styles.genderText, gender === 'female' && styles.genderTextActive]}>{t('auth.gender_female')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.genderCard, gender === 'male' && styles.genderCardActive]}
            onPress={() => setGender('male')}
            activeOpacity={0.7}
          >
            <Icon name="gender-male" color={styles.iconActive.color} size={sizes.scale(24)} wrapped />
            <Text style={[styles.genderText, gender === 'male' && styles.genderTextActive]}>{t('auth.gender_male')}</Text>
          </TouchableOpacity>
        </View>

        {isDoctor && (
          <View style={styles.specializationSection}>
            <Text style={styles.sectionTitle}>{t('auth.specialization_title')}</Text>
            <Text style={styles.specializationHint}>
              {t('auth.specialization_hint', 'Select one or more specializations')}
            </Text>

            <Input
              placeholder={t('auth.search_profession', 'Search profession...')}
              value={searchQuery}
              onChangeText={setSearchQuery}
              rounded
              style={{ marginBottom: sizes.spacing.m }}
              rightElement={<Icon name="search" size={sizes.scale(20)} color={styles.iconInactive.color} />}
            />

            {professionsLoading ? (
              <View style={{ alignItems: 'center', padding: sizes.spacing.m }}>
                <ActivityIndicator size="small" color={styles.iconActive.color} />
              </View>
            ) : (
              <View style={styles.specializationContainer}>
                {filteredProfessions.map(prof => {
                  const isSelected = professionCodes.includes(prof.code);
                  return (
                    <TouchableOpacity
                      key={prof.code}
                      style={[styles.profBadge, isSelected && styles.profBadgeActive]}
                      onPress={() => toggleProfession(prof.code)}
                    >
                      <Text style={[styles.profText, isSelected && styles.profTextActive]}>
                        {prof.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {validationErrors.professionCode ? (
              <Text style={styles.errorText}>{validationErrors.professionCode}</Text>
            ) : null}
          </View>
        )}

        {!!errorMsg && (
          <Text style={styles.errorText}>{errorMsg}</Text>
        )}
      </View>
    </ScrollView>
  );

  return (
    <Screen style={styles.container}>
      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {Platform.OS === 'web' ? formContent : (
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            {formContent}
          </TouchableWithoutFeedback>
        )}
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <Button
          title={t('auth.create_profile_btn')}
          variant="primary"
          onPress={handleSubmit}
          loading={loading}
          disabled={loading || !fullName.trim()}
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: theme.sizes.spacing.s,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.sizes.spacing.s,
    height: theme.sizes.scale(36),
  },
  backButton: {
    padding: theme.sizes.spacing.xs,
    marginLeft: -theme.sizes.spacing.xs,
  },
  iconColor: {
    color: theme.colors.p500,
  },
  iconActive: {
    color: theme.colors.p500,
  },
  iconInactive: {
    color: theme.colors.n400,
  },
  textWrap: {
    alignItems: 'center',
    marginBottom: theme.sizes.spacing.m,
  },
  title: {
    ...theme.sizes.typography.h2,
    color: theme.colors.n700,
    marginBottom: theme.sizes.spacing.s,
  },
  subtitle: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n700,
    textAlign: 'center',
  },
  sectionTitle: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n700,
    marginBottom: theme.sizes.spacing.s,
    marginTop: theme.sizes.spacing.s,
  },
  formContainer: {
    marginBottom: theme.sizes.scale(16),
  },
  genderContainer: {
    flexDirection: 'row',
    gap: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.m,
  },
  genderCard: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.n200,
    borderRadius: theme.sizes.borderRadius.large,
    paddingVertical: theme.sizes.spacing.s,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  genderCardActive: {
    borderColor: theme.colors.p500,
    backgroundColor: theme.colors.p100,
  },
  genderText: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n700,
    marginTop: theme.sizes.spacing.s,
  },
  genderTextActive: {
    color: theme.colors.n700,
  },
  specializationSection: {
  },
  specializationHint: {
    ...theme.sizes.typography.caption,
    color: theme.colors.n500,
    marginBottom: theme.sizes.spacing.m,
    marginTop: -theme.sizes.spacing.xs,
  },
  specializationContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.sizes.spacing.s,
  },
  profBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.sizes.spacing.m,
    paddingVertical: theme.sizes.scale(6),
    backgroundColor: theme.colors.p200,
    borderWidth: 1,
    borderColor: theme.colors.p500,
    borderRadius: theme.sizes.borderRadius.full,
  },
  profBadgeActive: {
    backgroundColor: theme.colors.p500,
  },
  profText: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.p500,
  },
  profTextActive: {
    color: theme.colors.white,
  },
  selectedCount: {
    ...theme.sizes.typography.caption,
    color: theme.colors.p500,
    marginTop: theme.sizes.spacing.s,
  },
  errorText: {
    ...theme.sizes.typography.caption,
    color: theme.colors.danger,
    marginTop: theme.sizes.spacing.s,
  },
  footer: {
    paddingBottom: theme.sizes.scale(40),
    marginTop: theme.sizes.spacing.m,
  }
});
