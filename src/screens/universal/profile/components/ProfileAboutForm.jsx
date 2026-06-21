import React, { useState } from 'react';
import { View, Text, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useStyles } from '../../../../theme/useStyles';
import { Button } from '../../../../components/ui/Button';

export function ProfileAboutForm({ user, onSave, loading }) {
  const { t } = useTranslation();
  const styles = useStyles(themeStyles);

  const [about, setAbout] = useState(user?.about || '');

  const MAX_LENGTH = 200;

  const handleSubmit = () => {
    onSave({ about });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('profile.about_me')}</Text>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.subtitle}>{t('profile.description', 'Description')}</Text>

        <View style={styles.inputContainer}>
          <View style={styles.textInputContainer}>
            <Text style={styles.inputTitle}>{t('profile.about_title')}</Text>
            <TextInput
              style={styles.textInput}
              multiline
              maxLength={MAX_LENGTH}
              placeholder={t('profile.about_placeholder')}
              placeholderTextColor={styles.placeholder.color}
              value={about}
              onChangeText={setAbout}
              textAlignVertical="top"
            />
          </View>
          <Text style={styles.charCount}>
            {about.length}/{MAX_LENGTH}
          </Text>
        </View>
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
  title: {
    ...theme.sizes.typography.h2,
    color: theme.colors.n700,
    marginBottom: theme.sizes.spacing.m,
  },
  scrollContent: {
    paddingBottom: theme.sizes.scale(40),
  },
  subtitle: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n500,
    marginBottom: theme.sizes.spacing.s,
  },
  inputContainer: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.n200,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.m,
    minHeight: theme.sizes.scale(150),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  textInputContainer: {
    borderWidth: 1,
    borderColor: theme.colors.n300,
    borderRadius: theme.sizes.borderRadius.large,
    flex: 1,
    minHeight: theme.sizes.scale(114),
    paddingHorizontal: theme.sizes.spacing.m,
    paddingVertical: theme.sizes.spacing.s,
  },
  inputTitle: {
    ...theme.sizes.typography.bodySmall,
    color: theme.colors.n500,
    marginBottom: theme.sizes.spacing.xs,
  },
  textInput: {
    ...theme.sizes.typography.bodyLarge,
    color: theme.colors.n700,
    flex: 1,
    minHeight: theme.sizes.scale(100),
    ...(Platform.OS === 'web' && { outlineStyle: 'none' }),
  },
  placeholder: {
    color: theme.colors.n500,
  },
  charCount: {
    ...theme.sizes.typography.caption,
    color: theme.colors.n500,
    textAlign: 'right',
    marginTop: theme.sizes.spacing.xs,
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
