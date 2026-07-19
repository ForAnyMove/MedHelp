import React, { useState, useEffect } from 'react';
import { View, Text, Switch, KeyboardAvoidingView, ScrollView, Platform, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '../../../components/ui/Screen';
import { Button } from '../../../components/ui/Button';
import { Icon } from '../../../components/ui/Icon';
import { useTheme } from '../../../theme/ThemeContext';
import { useStyles } from '../../../theme/useStyles';
import { useComponentContext } from '../../../context/GlobalContext';

export function SettingsVisibilityScreen({ onBack }) {
  const router = useRouter();
  const { t } = useTranslation();
  const { sizes, colors } = useTheme();
  const styles = useStyles(themeStyles);
  const { settingsController } = useComponentContext();
  
  const [visibility, setVisibility] = useState({
    phone: false,
    email: false,
    date_of_birth: false
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settingsController?.settings?.data_visibility) {
      setVisibility(prev => ({
        ...prev,
        ...settingsController.settings.data_visibility
      }));
    }
  }, [settingsController?.settings]);

  const toggleSwitch = (key) => {
    setVisibility(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleBack = () => {
    if (onBack) onBack();
    else router.back();
  };

  const handleSave = async () => {
    setIsSaving(true);
    await settingsController.updateSettings({ data_visibility: visibility });
    setIsSaving(false);
    handleBack();
  };

  const VisibilityRow = ({ label, desc, field, isFirst, isLast }) => (
    <View style={[
      styles.row, 
      !isLast && styles.rowBorder,
      isFirst && styles.rowFirst,
      isLast && styles.rowLast
    ]}>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowDesc}>{desc}</Text>
      </View>
      <Switch
        trackColor={{ false: colors.n300, true: colors.p500 }}
        thumbColor={colors.white}
        ios_backgroundColor={colors.n300}
        onValueChange={() => toggleSwitch(field)}
        value={visibility[field]}
      />
    </View>
  );

  return (
    <Screen style={styles.container}>
      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Icon name="arrow-back" size={sizes.scale(24)} color={colors.p500} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('settings.visibility_title', 'Profile visibility')}</Text>
        </View>

        <Text style={styles.subtitle}>
          {t('settings.visibility_desc', 'Control what doctors can see before and during a consultation.')}
        </Text>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Info Box */}
          <View style={styles.infoBox}>
            <View style={styles.infoIconWrapper}>
              <Icon name="shield-checkmark-outline" size={sizes.scale(20)} color={colors.p500} />
            </View>
            <Text style={styles.infoText}>
              {t('settings.visibility_info', 'Hidden data is never shared with doctors or third parties. Only you can see it in your profile.')}
            </Text>
          </View>

          <View style={styles.card}>
            <VisibilityRow 
              label={t('settings.hide_phone', 'Hide phone number')}
              desc={t('settings.hide_phone_desc', 'Doctors won’t see your phone in your patient card')}
              field="phone"
              isFirst
            />
            <VisibilityRow 
              label={t('settings.hide_email', 'Hide email')}
              desc={t('settings.hide_email_desc', 'Doctors won’t see your email address')}
              field="email"
            />
            <VisibilityRow 
              label={t('settings.hide_dob', 'Hide date of birth')}
              desc={t('settings.hide_dob_desc', 'Only your age range will be shown')}
              field="date_of_birth"
              isLast
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title={t('common.save_changes', 'Save changes')}
            variant="outlined"
            onPress={handleSave}
            loading={isSaving}
            disabled={isSaving}
            style={styles.saveBtn}
            icon={!isSaving ? <Icon name="checkmark" size={sizes.scale(20)} color={colors.p500} /> : null}
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const themeStyles = (theme) => ({
  container: {
    paddingHorizontal: theme.sizes.spacing.m,
    backgroundColor: theme.colors.bg,
  },
  keyboardView: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.sizes.scale(40),
    marginBottom: theme.sizes.scale(16),
  },
  backButton: {
    padding: theme.sizes.spacing.xs,
    marginRight: theme.sizes.spacing.s,
  },
  headerTitle: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n900,
  },
  subtitle: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n500,
    marginBottom: theme.sizes.spacing.l,
    paddingHorizontal: theme.sizes.spacing.xs,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: theme.sizes.scale(100),
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: /* TODO: color */ '#E6F9F5', // Light green background matching screenshot
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.l,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: /* TODO: color */ '#B3EBE0',
  },
  infoIconWrapper: {
    width: theme.sizes.scale(32),
    height: theme.sizes.scale(32),
    borderRadius: theme.sizes.scale(16),
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.sizes.spacing.m,
  },
  infoText: {
    ...theme.sizes.typography.bodySmall,
    color: theme.colors.p500,
    flex: 1,
    lineHeight: theme.sizes.scale(20),
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    marginBottom: theme.sizes.spacing.l,
    shadowColor: /* TODO: color */ '#000',
    shadowOffset: { width: theme.sizes.scale(0), height: theme.sizes.scale(2) },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.sizes.spacing.m,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.n200,
  },
  rowFirst: {
    borderTopLeftRadius: theme.sizes.borderRadius.large,
    borderTopRightRadius: theme.sizes.borderRadius.large,
  },
  rowLast: {
    borderBottomLeftRadius: theme.sizes.borderRadius.large,
    borderBottomRightRadius: theme.sizes.borderRadius.large,
  },
  rowText: {
    flex: 1,
    paddingRight: theme.sizes.spacing.m,
  },
  rowLabel: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n900,
    marginBottom: theme.sizes.scale(2),
  },
  rowDesc: {
    ...theme.sizes.typography.bodySmall,
    color: theme.colors.n500,
  },
  footer: {
    paddingBottom: theme.sizes.scale(40),
    paddingTop: theme.sizes.scale(20),
    backgroundColor: theme.colors.bg,
  },
  saveBtn: {
    borderColor: theme.colors.p500,
    borderRadius: theme.sizes.scale(30),
  }
});
