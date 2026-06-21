import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../../components/ui/Button';
import { useTheme } from '../../../../theme/ThemeContext';
import { useStyles } from '../../../../theme/useStyles';
import { Icon } from '../../../../components/ui/Icon';
import { useSession } from '../../../../context/SessionContext';
import * as DocumentPicker from 'expo-document-picker';

export function DocUploadSheet({ onClose }) {
  const { t, i18n } = useTranslation();
  const { sizes, colors } = useTheme();
  const styles = useStyles(themeStyles);
  const { session, updateDocStatus, getProfessions } = useSession();

  const [resolvedProfessionNames, setResolvedProfessionNames] = useState(
    session?.professionNames?.length > 0 ? session.professionNames : []
  );

  useEffect(() => {
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
  }, [session, getProfessions, i18n.language]);

  const professionNames = useMemo(() => {
    if (resolvedProfessionNames.length > 0) return resolvedProfessionNames;
    if (session?.professionCodes?.length > 0) return session.professionCodes;
    return ['Specialization'];
  }, [resolvedProfessionNames, session?.professionCodes]);

  const [diploma, setDiploma] = useState(null);
  const [licenseFiles, setLicenseFiles] = useState(() =>
    new Array(professionNames.length).fill(null)
  );

  useEffect(() => {
    setLicenseFiles(prev => {
      if (prev.length === professionNames.length) return prev;
      return new Array(professionNames.length).fill(null);
    });
  }, [professionNames.length]);

  const [certs, setCerts] = useState(null);
  const [identity, setIdentity] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSubmit = () => {
    setShowModal(true);
  };

  const handleModalOk = async () => {
    setIsSubmitting(true);
    await updateDocStatus('pending');
    setIsSubmitting(false);
    setShowModal(false);
    if (onClose) onClose(true); // pass true to indicate changes saved
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
    <View style={styles.container}>
      <Text style={styles.mainTitle}>{t('profile.upload_documents', 'Upload documents')}</Text>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.textWrap}>
          <Text style={styles.subtitle}>{t('auth.doc_upload_subtitle')}</Text>
        </View>

        <Text style={styles.sectionTitle}>{t('auth.necessarily')}</Text>
        {renderDocCard(
          null,
          t('auth.medical_diploma'),
          t('auth.license_cert_desc'),
          "doc-diploma",
          diploma,
          setDiploma
        )}

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

      {/* Button placed outside scroll container */}
      <View style={styles.footer}>
        <Button
          title={t('auth.submit_for_review')}
          variant="primary"
          onPress={handleSubmit}
          disabled={!canSubmit || isSubmitting}
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
    </View>
  );
}

const themeStyles = (theme) => ({
  container: {
    flex: 1,
    paddingHorizontal: theme.sizes.spacing.m,
    paddingTop: theme.sizes.spacing.s,
  },
  mainTitle: {
    ...theme.sizes.typography.h2,
    color: theme.colors.n900,
    marginBottom: theme.sizes.spacing.m,
  },
  scrollContent: {
    paddingBottom: theme.sizes.scale(40),
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
    marginBottom: theme.sizes.spacing.m,
  },
  subtitle: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n700,
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
