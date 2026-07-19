import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform, KeyboardAvoidingView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '../../../components/ui/Screen';
import { Icon } from '../../../components/ui/Icon';
import { useTheme } from '../../../theme/ThemeContext';
import { useStyles } from '../../../theme/useStyles';
import { useComponentContext } from '../../../context/GlobalContext';
import { setAppLanguage } from '../../../locales/i18n';

export function SettingsLanguageScreen({ onBack }) {
  const router = useRouter();
  const { t } = useTranslation();
  const { sizes, colors } = useTheme();
  const styles = useStyles(themeStyles);
  const { settingsController } = useComponentContext();
  
  const { settings, languages, isLoadingSettings } = settingsController || {};
  const currentLanguageCode = settings?.language || 'en';

  const [isChanging, setIsChanging] = useState(false);

  const handleSelectLanguage = async (langCode) => {
    if (langCode === currentLanguageCode || isChanging) return;
    
    setIsChanging(true);
    // 1. Save to backend
    await settingsController.updateSettings({ language: langCode });
    // 2. Apply locally to i18n
    await setAppLanguage(langCode);
    setIsChanging(false);
  };

  const renderRadio = (selected) => (
    <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
      {selected && <View style={styles.radioInner} />}
    </View>
  );

  const handleBack = () => {
    if (onBack) onBack();
    else router.back();
  };

  return (
    <Screen style={styles.container}>
      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Icon name="arrow-back" size={sizes.scale(24)} color={colors.p500} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('settings.language_title', 'Application language')}</Text>
        </View>

        <Text style={styles.subtitle}>
          {t('settings.language_desc', 'Choose the language for the app interface. This won’t affect content shared by your doctor.')}
        </Text>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            {isLoadingSettings && languages?.length === 0 ? (
              <ActivityIndicator style={{ padding: sizes.scale(40) }} color={colors.p500} />
            ) : (
              languages?.map((lang, index) => {
                const isSelected = currentLanguageCode === lang.code;
                const isFirst = index === 0;
                const isLast = index === languages.length - 1;

                return (
                  <TouchableOpacity
                    key={lang.code}
                    activeOpacity={0.7}
                    onPress={() => handleSelectLanguage(lang.code)}
                    style={[
                      styles.row,
                      !isLast && styles.rowBorder,
                      isFirst && styles.rowFirst,
                      isLast && styles.rowLast
                    ]}
                  >
                    <View style={styles.rowText}>
                      <Text style={styles.rowLabel}>{lang.name}</Text>
                      <Text style={styles.rowDesc}>{lang.name_en}</Text>
                    </View>
                    {isChanging && isSelected ? (
                      <ActivityIndicator size="small" color={colors.p500} />
                    ) : (
                      renderRadio(isSelected)
                    )}
                  </TouchableOpacity>
                );
              })
            )}
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
    paddingBottom: theme.sizes.scale(40),
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
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
  },
  rowLabel: {
    ...theme.sizes.typography.bodyLarge,
    color: theme.colors.n900,
    marginBottom: theme.sizes.scale(2),
    fontWeight: '500',
  },
  rowDesc: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n400,
  },
  radioOuter: {
    width: theme.sizes.scale(24),
    height: theme.sizes.scale(24),
    borderRadius: theme.sizes.scale(12),
    borderWidth: 2,
    borderColor: theme.colors.n300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderColor: theme.colors.p500,
  },
  radioInner: {
    width: theme.sizes.scale(12),
    height: theme.sizes.scale(12),
    borderRadius: theme.sizes.scale(6),
    backgroundColor: theme.colors.p500,
  }
});
