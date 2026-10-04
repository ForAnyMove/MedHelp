import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, Modal, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useReportsApi } from '../../api/reportsApi';
import { Ionicons } from '@expo/vector-icons';

const REPORT_REASONS = [
  'Spam or misleading',
  'Inappropriate content',
  'Harassment or bullying',
  'Fake profile or impersonation',
  'Other'
];

export default function ReportModal({ visible, onClose, targetType, targetId }) {
  const { t } = useTranslation();
  
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
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('reports.title', 'Report Content')}</Text>
            <TouchableOpacity onPress={onClose} disabled={loading}>
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 300,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    textAlignVertical: 'top',
    fontSize: 16,
    marginTop: 10,
    marginBottom: 20,
  },
  reasonsList: {
    maxHeight: 300,
    marginBottom: 15,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#e74c3c',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#e74c3c',
  },
  reasonText: {
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#e74c3c',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#f5b7b1',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
