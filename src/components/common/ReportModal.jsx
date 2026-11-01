import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, Modal, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useReportsApi } from '../../api/reportsApi';
import { Ionicons } from '@expo/vector-icons';
import { getHitSlopForSize } from '../../utils/accessibility';
import { useTheme } from '../../theme/ThemeContext';
import { useStyles } from '../../theme/useStyles';

const REPORT_REASONS = [
  'Spam or misleading',
  'Inappropriate content',
  'Harassment or bullying',
  'Fake profile or impersonation',
  'Other'
];

export default function ReportModal({ visible, onClose, targetType, targetId }) {
  const { t } = useTranslation();
  const styles = useStyles(themeStyles);
  
  const REPORT_REASONS = [
    { key: 'spam', label: t('reports.reason_spam', 'Spam or misleading') },
    { key: 'inappropriate', label: t('reports.reason_inappropriate', 'Inappropriate content') },
    { key: 'harassment', label: t('reports.reason_harassment', 'Harassment or bullying') },
    { key: 'fake', label: t('reports.reason_fake', 'Fake profile or impersonation') },
    { key: 'other', label: t('reports.reason_other', 'Other') }
  ];

  const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [loading, setLoading] = useState(false);
  const { createReport } = useReportsApi();

  const handleSubmit = async () => {
    let finalReason = selectedReason.label;
    if (selectedReason.key === 'other') {
      if (customReason.trim().length < 5) {
        Alert.alert(t('common.error', 'Error'), t('reports.reason_too_short', 'Reason must be at least 5 characters long.'));
        return;
      }
      finalReason = `Other: ${customReason.trim()}`;
    }

    setLoading(true);
    try {
      await createReport(targetType, targetId, finalReason);
      Alert.alert(t('common.success', 'Success'), t('reports.success_msg', 'Your report has been submitted. Our moderators will review it shortly.'));
      setCustomReason('');
      setSelectedReason(REPORT_REASONS[0]);
      onClose();
    } catch (err) {
      Alert.alert(t('common.error', 'Error'), err.message || t('reports.error_msg', 'Failed to submit report. You may have already reported this content.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      transparent
      accessibilityViewIsModal={true}
      aria-modal={true}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title} accessibilityRole="header">{t('reports.title', 'Report Content')}</Text>
            <TouchableOpacity 
              onPress={onClose} 
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel={t('common.close', 'Закрыть')}
              hitSlop={getHitSlopForSize(24, 24)}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.subtitle}>
            {t('reports.subtitle', 'Please select a reason for reporting this {{type}}.', { type: targetType })}
          </Text>
          
          <ScrollView style={styles.reasonsList} showsVerticalScrollIndicator={false}>
            {REPORT_REASONS.map((r, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.reasonOption} 
                onPress={() => setSelectedReason(r)}
                disabled={loading}
                accessibilityRole="radio"
                accessibilityState={{ checked: selectedReason.key === r.key }}
                accessibilityLabel={r.label}
              >
                <View style={styles.radioCircle}>
                  {selectedReason.key === r.key && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.reasonText}>{r.label}</Text>
              </TouchableOpacity>
            ))}

            {selectedReason.key === 'other' && (
              <TextInput
                style={styles.input}
                multiline
                numberOfLines={4}
                placeholder={t('reports.describe_issue', 'Describe the issue...')}
                value={customReason}
                onChangeText={setCustomReason}
                editable={!loading}
                maxLength={500}
              />
            )}
          </ScrollView>

          <TouchableOpacity 
            style={[styles.button, ((selectedReason.key === 'other' && !customReason.trim()) || loading) && styles.buttonDisabled]} 
            onPress={handleSubmit}
            disabled={(selectedReason.key === 'other' && !customReason.trim()) || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{t('reports.submit', 'Submit Report')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const themeStyles = (theme) => {
  const { colors, sizes } = theme;
  return {
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    container: {
      backgroundColor: colors.white,
      borderTopLeftRadius: sizes.borderRadius.large,
      borderTopRightRadius: sizes.borderRadius.large,
      padding: sizes.spacing.l,
      minHeight: sizes.scale(300),
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: sizes.spacing.m,
    },
    title: {
      ...sizes.typography.h3,
      color: colors.n900,
    },
    subtitle: {
      ...sizes.typography.bodyMedium,
      color: colors.n700,
      marginBottom: sizes.spacing.m,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.n300,
      borderRadius: sizes.borderRadius.small,
      padding: sizes.spacing.s,
      textAlignVertical: 'top',
      ...sizes.typography.bodyMedium,
      color: colors.n900,
      marginTop: sizes.spacing.s,
      marginBottom: sizes.spacing.l,
    },
    reasonsList: {
      maxHeight: sizes.scale(300),
      marginBottom: sizes.spacing.m,
    },
    reasonOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: sizes.scale(10),
      minHeight: sizes.scale(44),
    },
    radioCircle: {
      width: sizes.scale(20),
      height: sizes.scale(20),
      borderRadius: sizes.scale(10),
      borderWidth: 2,
      borderColor: colors.danger,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: sizes.spacing.s,
    },
    radioInner: {
      width: sizes.scale(10),
      height: sizes.scale(10),
      borderRadius: sizes.scale(5),
      backgroundColor: colors.danger,
    },
    reasonText: {
      ...sizes.typography.bodyLarge,
      color: colors.n900,
    },
    button: {
      backgroundColor: colors.danger,
      padding: sizes.spacing.m,
      borderRadius: sizes.borderRadius.small,
      alignItems: 'center',
      minHeight: sizes.scale(44),
      justifyContent: 'center',
    },
    buttonDisabled: {
      backgroundColor: colors.n300,
    },
    buttonText: {
      color: colors.white,
      ...sizes.typography.bodyLarge,
      fontFamily: 'Manrope_700Bold',
    },
  };
};
