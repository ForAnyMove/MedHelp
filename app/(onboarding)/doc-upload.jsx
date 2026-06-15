import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '../../src/components/ui/Screen';
import { Button } from '../../src/components/ui/Button';
import { useTheme } from '../../src/theme/ThemeContext';
import { useStyles } from '../../src/theme/useStyles';
import { Icon } from '../../src/components/ui/Icon';
import { useSession } from '../../src/context/SessionContext';
import * as DocumentPicker from 'expo-document-picker';

export default function DocUpload() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { sizes, colors } = useTheme();
  const styles = useStyles(themeStyles);
  const { session, updateDocStatus, markDocUploadHandled, getProfessions } = useSession();

  // Determine the mode: 
  // 'skipped' = user previously skipped and is returning after re-login
  // 'first_time' = user is going through onboarding for the first time (status = 'none')
  const isReturnAfterSkip = session?.docVerificationStatus === 'skipped';

  // In return-after-skip mode: no back button, skip/submit go directly to /home
  // In first-time mode: show back button, skip/submit go through profile-created
  const showBackButton = !isReturnAfterSkip;

  // Specialization names — may need to be fetched if not in session (e.g., re-login)
  const [resolvedProfessionNames, setResolvedProfessionNames] = useState(
    session?.professionNames?.length > 0 ? session.professionNames : []
  );

  useEffect(() => {
    // If we have profession codes but no names (e.g., re-login), fetch names from API
    const codes = session?.professionCodes || [];
    const names = session?.professionNames || [];

    if (codes.length > 0 && names.length === 0) {
      getProfessions(i18n.language).then(allProfessions => {
        const lookedUpNames = codes.map(code => {
          const prof = allProfessions.find(p => p.code === code);
          return prof ? prof.name : code;
        });
        setResolvedProfessionNames(lookedUpNames);
      });
    }
  }, []);

  const professionNames = useMemo(() => {
    if (resolvedProfessionNames.length > 0) return resolvedProfessionNames;
    // Fallback: use profession codes
    if (session?.professionCodes?.length > 0) return session.professionCodes;
    return ['Specialization'];
  }, [resolvedProfessionNames, session?.professionCodes]);

  // Required documents state
  const [diploma, setDiploma] = useState(null);
  // One license slot per specialization
  const [licenseFiles, setLicenseFiles] = useState(() =>
    new Array(professionNames.length).fill(null)
  );

  // Sync license slots when professionNames changes (after async fetch)
  useEffect(() => {
    setLicenseFiles(prev => {
      if (prev.length === professionNames.length) return prev;
      return new Array(professionNames.length).fill(null);
    });
  }, [professionNames.length]);

  // Optional documents state
  const [certs, setCerts] = useState(null);
  const [identity, setIdentity] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // All required docs must be uploaded to enable submit
  const canSubmit = !!diploma && licenseFiles.every(f => !!f);

  const pickDocument = async (setter) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: false,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setter(result.assets[0]);
      }
    } catch (e) {
      console.log('Document picking failed', e);
      // Fallback mock for environments without picker
      setter({ name: 'document.pdf' });
    }
  };

  const setLicenseFile = (index, file) => {
    setLicenseFiles(prev => {
      const next = [...prev];
      next[index] = file;
      return next;
    });
  };

  const handleSkip = async () => {
    await updateDocStatus('skipped');
    markDocUploadHandled();

    if (isReturnAfterSkip) {
      // Repeat skip → go directly to app
      router.replace('/home');
    } else {
      // First skip → go through profile-created
      router.replace('/(onboarding)/profile-created');
    }
  };

  const handleSubmit = () => {
    setShowModal(true);
  };

  const handleModalOk = async () => {
    setIsSubmitting(true);
    await updateDocStatus('pending');
    markDocUploadHandled();
    setIsSubmitting(false);
    setShowModal(false);

    if (isReturnAfterSkip) {
      // Return flow → go directly to app
      router.replace('/home');
    } else {
      // First time flow → go through profile-created
      router.replace('/(onboarding)/profile-created');
    }
  };

  const renderDocCard = (keyName, title, desc, iconName, file, setFile) => {
    const isUploaded = !!file;

    return (
      <TouchableOpacity
        key={keyName ? iconName + keyName : iconName}
        style={[styles.docCard, isUploaded && styles.docCardUploaded]}
        onPress={() => isUploaded ? setFile(null) : pickDocument(setFile)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        activeOpacity={0.8}
      >
        <View style={[styles.docIconContainer, { opacity: isUploaded ? 1 : 0.5 }]}>
          <Icon name={iconName} size={sizes.scale(24)} color={colors.p500} wrapped />
        </View>
        <View style={styles.docTextContainer}>
          <Text style={styles.docTitle}>{title}</Text>
          {isUploaded ? (
            <View style={styles.uploadedRow}>
              <Text style={styles.uploadedText}>{t('auth.file_uploaded')}</Text>
              <Icon name="check2" size={sizes.scale(16)} color={styles.iconActive.color} />
            </View>
          ) : (
            <Text style={styles.docDesc}>{desc}</Text>
          )}
        </View>
        <Icon
          name={isUploaded ? "close" : "plus"}
          size={sizes.scale(24)}
          color={isUploaded ? styles.iconDanger.color : styles.iconActive.color}
          wrapped
          wrapperRadius={sizes.borderRadius.full}
          wrapperSize={sizes.scale(24)}
          wrapperStyle={{
            padding: sizes.spacing.xs,
          }}
        />
      </TouchableOpacity>
    );
  };

  return (
    <Screen style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header — only show back button in first-time flow */}
        {showBackButton ? (
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.canGoBack() ? router.back() : router.replace('/(onboarding)/profile-setup')}
              style={styles.backButton}
            >
              <Icon name="arrow-back" size={sizes.scale(24)} color={colors.p500} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.headerSpacer} />
        )}

        <View style={styles.textWrap}>
          <Text style={styles.title}>{t('auth.doc_upload_title')}</Text>
          <Text style={styles.subtitle}>{t('auth.doc_upload_subtitle')}</Text>
        </View>

        {/* ── Required documents ── */}
        <Text style={styles.sectionTitle}>{t('auth.necessarily')}</Text>

        {/* Diploma — always required */}
        {renderDocCard(
          null,
          t('auth.medical_diploma'),
          t('auth.license_cert_desc'),
          "doc-diploma",
          diploma,
          setDiploma
        )}

        {/* One license card per specialization */}
        {professionNames.map((name, index) =>
          renderDocCard(
            `${index}`,
            `${t('auth.license_cert')} — ${name}`,
            t('auth.license_cert_desc'),
            "doc-license",
            licenseFiles[index],
            (file) => setLicenseFile(index, file),
          )
        )}

        {/* ── Optional documents ── */}
        <Text style={[styles.sectionTitle, { marginTop: sizes.spacing.m }]}>{t('auth.additionally')}</Text>
        {renderDocCard(
          null,
          t('auth.certs_ids'),
          t('auth.certs_ids_desc'),
          "doc-certificate",
          certs,
          setCerts
        )}
        {renderDocCard(
          null,
          t('auth.identity_card'),
          t('auth.identity_card_desc'),
          "doc-identity",
          identity,
          setIdentity
        )}

        <View style={styles.infoBox}>
          <Icon name="shield-lock" size={sizes.scale(20)} color={styles.iconActive.color} style={{ marginTop: sizes.scale(2) }} />
          <Text style={styles.infoText}>{t('auth.doc_info_text')}</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={t('auth.submit_for_review')}
          variant="primary"
          onPress={handleSubmit}
          disabled={!canSubmit || isSubmitting}
          style={styles.submitBtn}
        />
        <Button
          title={t('auth.skip_fill_later')}
          variant="outlined"
          onPress={handleSkip}
          style={styles.submitBtn}
        />
      </View>

      {/* Verification Modal */}
      <Modal transparent visible={showModal} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowModal(false)}>
              <Icon name="close" size={sizes.scale(24)} color={styles.iconColor.color} />
            </TouchableOpacity>

            <ActivityIndicator size="large" color={styles.iconActive.color} style={styles.modalLoader} />

            <Text style={styles.modalTitle}>{t('auth.verification_popup_title')}</Text>
            <Text style={styles.modalTime}>{t('auth.verification_popup_time')}</Text>
            <Text style={styles.modalNotify}>{t('auth.verification_popup_notify')}</Text>

            <Button
              title={t('auth.ok_btn')}
              variant="primary"
              onPress={handleModalOk}
              loading={isSubmitting}
              style={{ width: '100%' }}
            />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const themeStyles = (theme) => ({
  container: {
    paddingHorizontal: theme.sizes.spacing.m,
    paddingTop: theme.sizes.spacing.s,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: theme.sizes.spacing.m,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    height: theme.sizes.scale(24),
    marginTop: theme.sizes.spacing.m,
  },
  headerSpacer: {
    height: theme.sizes.scale(24),
    marginTop: theme.sizes.spacing.m,
  },
  backButton: {
    padding: theme.sizes.spacing.xs,
    marginLeft: -theme.sizes.spacing.xs,
  },
  iconColor: {
    color: theme.colors.n500,
  },
  iconActive: {
    color: theme.colors.p500,
  },
  iconDanger: {
    color: theme.colors.danger,
  },
  textWrap: {
    alignItems: 'center',
    marginBottom: theme.sizes.scale(32),
  },
  title: {
    ...theme.sizes.typography.h3,
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
  },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    paddingVertical: theme.sizes.spacing.m,
    paddingHorizontal: theme.sizes.scale(19),
    marginBottom: theme.sizes.spacing.m,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  docCardUploaded: {
    borderColor: theme.colors.p500,
    backgroundColor: theme.colors.p100,
  },
  docIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.sizes.spacing.m,
  },
  docTextContainer: {
    flex: 1,
  },
  docTitle: {
    ...theme.sizes.typography.h4,
    color: theme.colors.n700,
    marginBottom: theme.sizes.scale(4),
  },
  docDesc: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n500,
  },
  uploadedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.sizes.scale(4),
  },
  uploadedText: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.p500,
    fontFamily: 'Manrope_400Regular',
  },
  actionBtn: {
    padding: theme.sizes.spacing.xs,
  },
  infoBox: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.p200,
    borderWidth: 1,
    borderColor: theme.colors.p500,
    borderRadius: theme.sizes.borderRadius.large,
    marginTop: theme.sizes.spacing.s,
    padding: theme.sizes.spacing.m,
    gap: theme.sizes.spacing.m,
  },
  infoText: {
    ...theme.sizes.typography.bodySmall,
    color: theme.colors.p500,
    flex: 1,
  },
  footer: {
    paddingBottom: theme.sizes.scale(40),
    marginTop: theme.sizes.spacing.s,
    gap: theme.sizes.spacing.m,
  },
  submitBtn: {
  },
  skipBtn: {
    paddingVertical: theme.sizes.spacing.m,
    alignItems: 'center',
  },
  skipBtnText: {
    ...theme.sizes.typography.h4,
    color: theme.colors.p500,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.sizes.spacing.xl,
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.xl,
    alignItems: 'center',
    width: '100%',
    position: 'relative',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: theme.sizes.spacing.m,
    right: theme.sizes.spacing.m,
    padding: theme.sizes.spacing.xs,
  },
  modalLoader: {
    marginBottom: theme.sizes.spacing.l,
    transform: [{ scale: 1.5 }],
  },
  modalTitle: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n700,
    marginBottom: theme.sizes.spacing.m,
    textAlign: 'center',
  },
  modalTime: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n500,
    marginBottom: theme.sizes.spacing.m,
    textAlign: 'center',
  },
  modalNotify: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n700,
    marginBottom: theme.sizes.spacing.l,
    textAlign: 'center',
  }
});
