import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../theme/ThemeContext';
import { useStyles } from '../../../../theme/useStyles';
import { Input } from '../../../../components/ui/Input';
import { Button } from '../../../../components/ui/Button';
import { Icon } from '../../../../components/ui/Icon';
import DateTimePicker from '@react-native-community/datetimepicker';

export function ProfileEditForm({ user, role, getProfessions, onSave, setDirty }) {
  const { t, i18n } = useTranslation();
  const { sizes } = useTheme();
  const styles = useStyles(themeStyles);

  const isDoctor = role === 'doctor';

  const [fullName, setFullName] = useState(() => {
    if (user?.firstName || user?.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    return '';
  });

  const [phone, setPhone] = useState(user?.phone || '');
  const [dateOfBirth, setDateOfBirth] = useState(() => {
    // Session stores YYYY-MM-DD, display as DD.MM.YYYY
    if (user?.dob) {
      const parts = user.dob.split('-');
      if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`;
    }
    return user?.dob || '';
  });
  const [gender, setGender] = useState(user?.gender || null);

  // Doctor specific
  const [professionCodes, setProfessionCodes] = useState(user?.professionCodes || []);
  const [professions, setProfessions] = useState([]);
  const [professionsLoading, setProfessionsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Patient specific
  const [height, setHeight] = useState(user?.height ? String(user.height) : '');
  const [weight, setWeight] = useState(user?.weight ? String(user.weight) : '');
  const [bloodType, setBloodType] = useState(user?.bloodType || null);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (isDoctor && getProfessions) {
      setProfessionsLoading(true);
      getProfessions(i18n.language)
        .then(setProfessions)
        .catch(console.error)
        .finally(() => setProfessionsLoading(false));
    }
  }, [isDoctor, i18n.language, getProfessions]);

  // Track dirty state
  useEffect(() => {
    const originalFullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
    const originalDob = user?.dob ? (() => {
      const parts = user.dob.split('-');
      return parts.length === 3 ? `${parts[2]}.${parts[1]}.${parts[0]}` : user.dob;
    })() : '';
    const originalHeight = user?.height ? String(user.height) : '';
    const originalWeight = user?.weight ? String(user.weight) : '';
    const originalBloodType = user?.bloodType || null;
    const originalProfessionCodes = user?.professionCodes || [];

    const isDirty = fullName !== originalFullName ||
      phone !== (user?.phone || '') ||
      dateOfBirth !== originalDob ||
      gender !== (user?.gender || null) ||
      (isDoctor && JSON.stringify(professionCodes) !== JSON.stringify(originalProfessionCodes)) ||
      (!isDoctor && (height !== originalHeight || weight !== originalWeight || bloodType !== originalBloodType));

    setDirty(isDirty);
  }, [fullName, phone, dateOfBirth, gender, professionCodes, height, weight, bloodType, user, isDoctor, setDirty]);

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

  const handlePhoneChange = (text) => {
    let cleaned = text.replace(/[^\d+]/g, '');
    setPhone(cleaned);
    if (validationErrors.phone) setValidationErrors(prev => ({ ...prev, phone: '' }));
  };

  const toggleProfession = (code) => {
    setProfessionCodes(prev => {
      const isSelected = prev.includes(code);
      return isSelected ? prev.filter(c => c !== code) : [...prev, code];
    });
  };

  const validate = () => {
    let valid = true;
    let errors = {};

    if (!fullName.trim()) {
      errors.fullName = t('auth.required_field') || 'Required';
      valid = false;
    }
    if (phone && phone.length > 0 && phone.length < 10) {
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

    let formattedDob = dateOfBirth;
    if (dateOfBirth && dateOfBirth.includes('.')) {
      const parts = dateOfBirth.split('.');
      if (parts.length === 3) {
        formattedDob = `${parts[2]}-${parts[1]}-${parts[0]}`; // YYYY-MM-DD
      }
    }

    const payload = {
      fullName: fullName.trim(),
      phone: phone.trim() || null,
      dateOfBirth: formattedDob || null,
      gender: gender,
    };

    if (isDoctor) {
      payload.professionCodes = professionCodes;
      payload.professionNames = professionCodes.map(code => {
        const prof = professions.find(p => p.code === code);
        return prof ? prof.name : code;
      });
    } else {
      payload.height = height ? parseFloat(height) : null;
      payload.weight = weight ? parseFloat(weight) : null;
      payload.bloodType = bloodType;
    }

    await onSave(payload);
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('profile.profile_edit_title')}</Text>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >

        <Input
          label={t('auth.full_name')}
          value={fullName}
          onChangeText={(text) => {
            setFullName(text);
            if (validationErrors.fullName) setValidationErrors(prev => ({ ...prev, fullName: '' }));
          }}
          error={validationErrors.fullName}
          rounded
        />

        <Input
          label="Email"
          value={user?.email || ''}
          editable={false}
          rounded
          style={{ opacity: 0.7 }}
        />

        <Input
          label={t('auth.phone')}
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
          maxLength={10}
          rounded
          rightElement={
            <TouchableOpacity
              onPress={() => {
                if (Platform.OS !== 'web') setShowDatePicker(true);
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

            <Input
              placeholder={t('auth.search_profession', 'Search profession...')}
              value={searchQuery}
              onChangeText={setSearchQuery}
              rounded
              style={{ marginBottom: sizes.spacing.m }}
              rightElement={<Icon name="search" size={sizes.scale(20)} color={styles.iconInactive.color} />}
            />

            {professionsLoading ? (
              <ActivityIndicator size="small" color={styles.iconActive.color} style={{ marginVertical: sizes.spacing.m }} />
            ) : (
              <View style={styles.specializationContainer}>
                {professions.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map(prof => {
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
          </View>
        )}

        {!isDoctor && (
          <View style={styles.bodySection}>
            <Text style={styles.sectionTitle}>{t('auth.additionally', 'Body parameters')}</Text>

            <View style={styles.row}>
              <View style={styles.flex1}>
                <Input
                  label={t('profile.height_weight').split('/')[0] + ' (cm)'}
                  value={height}
                  onChangeText={setHeight}
                  keyboardType="numeric"
                  rounded
                />
              </View>
              <View style={{ width: sizes.spacing.m }} />
              <View style={styles.flex1}>
                <Input
                  label={t('profile.height_weight').split('/')[1] + ' (kg)'}
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="numeric"
                  rounded
                />
              </View>
            </View>

            <Text style={styles.label}>{t('profile.blood_type')}</Text>
            <View style={styles.bloodTypeContainer}>
              {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(type => {
                const isSelected = bloodType === type;
                return (
                  <TouchableOpacity
                    key={type}
                    style={[styles.bloodTypeCard, isSelected && styles.bloodTypeCardActive]}
                    onPress={() => setBloodType(type)}
                  >
                    <Text style={[styles.bloodTypeText, isSelected && styles.bloodTypeTextActive]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={t('profile.save_changes')}
          variant="outlined"
          onPress={handleSubmit}
          loading={loading}
        />
      </View>
    </View>
  );
}

const themeStyles = (theme) => ({
  container: {
    flex: 1,
    paddingHorizontal: theme.sizes.spacing.m,
    paddingTop: theme.sizes.spacing.s,
  },
  scrollContent: {
    paddingBottom: theme.sizes.scale(40),
  },
  title: {
    ...theme.sizes.typography.h2,
    color: theme.colors.n900,
    marginBottom: theme.sizes.spacing.m,
  },
  sectionTitle: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n900,
    marginBottom: theme.sizes.spacing.s,
    marginTop: theme.sizes.spacing.s,
  },
  label: {
    ...theme.sizes.typography.caption,
    color: theme.colors.n700,
    marginBottom: theme.sizes.spacing.xs,
    marginLeft: theme.sizes.spacing.xs,
  },
  iconInactive: {
    color: theme.colors.n400,
  },
  iconActive: {
    color: theme.colors.p500,
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
    marginBottom: theme.sizes.spacing.m,
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
  bodySection: {
    marginBottom: theme.sizes.spacing.m,
  },
  row: {
    flexDirection: 'row',
    marginBottom: theme.sizes.spacing.s,
  },
  flex1: {
    flex: 1,
  },
  bloodTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.sizes.spacing.s,
    marginBottom: theme.sizes.spacing.m,
  },
  bloodTypeCard: {
    width: '22%',
    paddingVertical: theme.sizes.scale(10),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.p200,
    borderWidth: 1,
    borderColor: theme.colors.p500,
    borderRadius: theme.sizes.borderRadius.medium,
  },
  bloodTypeCardActive: {
    backgroundColor: theme.colors.p500,
  },
  bloodTypeText: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.p500,
    fontFamily: 'Manrope_600SemiBold',
  },
  bloodTypeTextActive: {
    color: theme.colors.white,
  },
  footer: {
    paddingBottom: theme.sizes.scale(28),
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.sizes.spacing.m,
    marginHorizontal: -theme.sizes.spacing.m,
    paddingTop: theme.sizes.scale(14),
    shadowColor: theme.colors.n900,
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 2,
  }
});
