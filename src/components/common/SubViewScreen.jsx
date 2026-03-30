import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { useStyles } from '../../theme/useStyles';
import { Icon } from '../ui/Icon';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * Standard sub-view wrapper used by all 6 detail screens:
 *   PatientCard, PatientDetails, OngoingConsultation,
 *   DoctorConsultationSummary, RequestPayout, TransactionHistory
 *
 * Props:
 *   title            {string}   — header title
 *   onBack           {fn}       — called when back arrow is pressed (and confirm is either skipped or approved)
 *   confirmBeforeExit {boolean} — if true, shows a confirmation modal before calling onBack
 *   confirmTitle     {string}   — modal title (default: 'Discard changes?')
 *   confirmMessage   {string}   — modal body text
 *   confirmLabel     {string}   — confirm button label (default: 'Leave')
 *   cancelLabel      {string}   — cancel button label (default: 'Stay')
 *   children         {node}     — the screen content
 */
export function SubViewScreen({
  title,
  onBack,
  confirmBeforeExit = false,
  confirmTitle = 'Discard changes?',
  confirmMessage = 'Your unsaved changes will be lost.',
  confirmLabel = 'Leave',
  cancelLabel = 'Stay',
  children,
}) {
  const styles = useStyles(themeStyles);
  const [showConfirm, setShowConfirm] = React.useState(false);

  // Animate in on mount
  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, []);

  const handleBack = () => {
    if (confirmBeforeExit) {
      setShowConfirm(true);
    } else {
      onBack?.();
    }
  };

  const handleConfirm = () => {
    setShowConfirm(false);
    onBack?.();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Icon name="ArrowLeft" size={24} color={styles.backIcon.color} />
        </TouchableOpacity>
        {title ? <Text style={styles.title}>{title}</Text> : null}
      </View>

      {/* Content */}
      {children}

      {/* Confirmation modal */}
      <Modal
        visible={showConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirm(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{confirmTitle}</Text>
            <Text style={styles.modalMessage}>{confirmMessage}</Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.btnStay} onPress={() => setShowConfirm(false)}>
                <Text style={styles.btnStayText}>{cancelLabel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnLeave} onPress={handleConfirm}>
                <Text style={styles.btnLeaveText}>{confirmLabel}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const themeStyles = (theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.sizes.spacing.l,
    paddingVertical: theme.sizes.spacing.m,
  },
  backBtn: {
    marginRight: theme.sizes.spacing.m,
  },
  backIcon: {
    color: theme.colors.p500,
  },
  title: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n900,
    flex: 1,
  },
  // Modal
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(23, 43, 46, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.sizes.spacing.l,
  },
  modal: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.xl,
    width: '100%',
    alignItems: 'center',
  },
  modalTitle: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n900,
    fontFamily: 'Manrope_700Bold',
    marginBottom: theme.sizes.spacing.s,
    textAlign: 'center',
  },
  modalMessage: {
    ...theme.sizes.typography.bodySmall,
    color: theme.colors.n500,
    textAlign: 'center',
    marginBottom: theme.sizes.spacing.xl,
  },
  modalBtns: {
    flexDirection: 'row',
    gap: theme.sizes.spacing.m,
    width: '100%',
  },
  btnStay: {
    flex: 1,
    paddingVertical: theme.sizes.spacing.m,
    borderRadius: theme.sizes.borderRadius.large,
    backgroundColor: theme.colors.n100,
    alignItems: 'center',
  },
  btnStayText: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n900,
    fontFamily: 'Manrope_600SemiBold',
  },
  btnLeave: {
    flex: 1,
    paddingVertical: theme.sizes.spacing.m,
    borderRadius: theme.sizes.borderRadius.large,
    backgroundColor: theme.colors.p500,
    alignItems: 'center',
  },
  btnLeaveText: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.white,
    fontFamily: 'Manrope_700Bold',
  },
});
