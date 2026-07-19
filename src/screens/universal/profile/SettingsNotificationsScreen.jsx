import React, { useState, useEffect } from 'react';
import { View, Text, Switch, KeyboardAvoidingView, ScrollView, Platform, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '../../../components/ui/Screen';
import { Button } from '../../../components/ui/Button';
import { Icon } from '../../../components/ui/Icon';
import { useTheme } from '../../../theme/ThemeContext';
import { useStyles } from '../../../theme/useStyles';
import { useComponentContext } from '../../../context/GlobalContext';

export function SettingsNotificationsScreen({ onBack }) {
  const router = useRouter();
  const { t } = useTranslation();
  const { sizes, colors } = useTheme();
  const styles = useStyles(themeStyles);
  const { settingsController } = useComponentContext();
  
  const [types, setTypes] = useState({
    all: true,
    consultation_reminders: true,
    lab_results_ready: true,
    doctors_notes_ready: true,
    new_messages: true,
    tips_updates: true
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settingsController?.settings?.notification_types) {
      setTypes(prev => ({
        ...prev,
        ...settingsController.settings.notification_types
      }));
    }
  }, [settingsController?.settings]);

  const toggleSwitch = (key) => {
    setTypes(prev => {
      const next = { ...prev, [key]: !prev[key] };
      
      if (key === 'all' && next.all === true) {
        // Turn on all switches
        next.consultation_reminders = true;
        next.lab_results_ready = true;
        next.doctors_notes_ready = true;
        next.new_messages = true;
        next.tips_updates = true;
      } else if (key !== 'all' && !next[key]) {
        // If we manually turn off a specific switch, turn off the 'all' switch
        next.all = false;
      } else if (key !== 'all' && next[key]) {
        // If we turn on a specific switch, check if all others are on
        const allOn = ['consultation_reminders', 'lab_results_ready', 'doctors_notes_ready', 'new_messages', 'tips_updates']
          .every(k => k === key ? next[k] : prev[k]);
        if (allOn) next.all = true;
      }
      return next;
    });
  };

  const handleBack = () => {
    if (onBack) onBack();
    else router.back();
  };

  const handleSave = async () => {
    setIsSaving(true);
    await settingsController.updateSettings({ notification_types: types });
    setIsSaving(false);
    handleBack();
  };

  const NotificationRow = ({ label, desc, field, isFirst, isLast }) => (
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
        value={types[field]}
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
          <Text style={styles.headerTitle}>{t('settings.notifications_title', 'Notifications')}</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.card}>
            <NotificationRow 
              label={t('settings.enable_all', 'Enable all notifications')}
              desc={t('settings.enable_all_desc', 'Turn on all push alerts')}
              field="all"
              isFirst
              isLast
            />
          </View>

          <View style={styles.card}>
            <NotificationRow 
              label={t('settings.consultation_reminders', 'Consultation reminders')}
              desc={t('settings.consultation_reminders_desc', '1 hour before your appointment')}
              field="consultation_reminders"
              isFirst
            />
            <NotificationRow 
              label={t('settings.lab_results_ready', 'Lab results ready')}
              desc={t('settings.lab_results_ready_desc', 'When new results are available')}
              field="lab_results_ready"
            />
            <NotificationRow 
              label={t('settings.doctors_notes_ready', 'Doctor’s notes ready')}
              desc={t('settings.doctors_notes_ready_desc', 'After consultation summary')}
              field="doctors_notes_ready"
            />
            <NotificationRow 
              label={t('settings.new_messages', 'New messages')}
              desc={t('settings.new_messages_desc', 'Messages from your doctor')}
              field="new_messages"
            />
            <NotificationRow 
              label={t('settings.tips_updates', 'Tips & updates')}
              desc={t('settings.tips_updates_desc', 'Health tips and app news')}
              field="tips_updates"
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
    marginBottom: theme.sizes.scale(24),
  },
  backButton: {
    padding: theme.sizes.spacing.xs,
    marginRight: theme.sizes.spacing.s,
  },
  headerTitle: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n900,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: theme.sizes.scale(100),
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
