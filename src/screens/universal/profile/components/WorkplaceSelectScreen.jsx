import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Keyboard, Alert, DeviceEventEmitter } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useStyles } from '../../../../theme/useStyles';
import { Icon } from '../../../../components/ui/Icon';
import { Button } from '../../../../components/ui/Button';
import { useTheme } from '../../../../theme/ThemeContext';
import { createApiClient } from '../../../../api/apiClient';
import { useSession } from '../../../../context/SessionContext';

export function WorkplaceSelectScreen({ onBack, onClose, onSave, currentWorkplace }) {
  const { t } = useTranslation();
  const styles = useStyles(themeStyles);
  const { sizes, colors } = useTheme();
  const { session, refreshSessionToken, updateSession } = useSession();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [activeWorkplace, setActiveWorkplace] = useState(currentWorkplace || '');

  const displayResults = useMemo(() => {
    if (!query.trim() || selectedOrg) return [];

    const lowerQuery = query.trim().toLowerCase();
    const hasExactMatch = results.some(r => r.name.toLowerCase() === lowerQuery);

    let finalResults = [...results];

    if (!hasExactMatch && query.trim().length > 0) {
      finalResults.push({
        id: 'custom_org_id',
        name: query.trim(),
        isCustom: true,
        ownerName: t('profile.unregistered_org', 'Вы можете указать еще не зарегистрированную организацию, она будет отображаться в профиле без верификации места работы')
      });
    }
    return finalResults;
  }, [results, query, selectedOrg, t]);

  // Pending request state
  const [pendingRequest, setPendingRequest] = useState(null);
  const [isCheckingRequest, setIsCheckingRequest] = useState(true);

  const api = useMemo(
    () => createApiClient(session, refreshSessionToken),
    [session, refreshSessionToken]
  );

  useEffect(() => {
    let active = true;
    const checkPendingRequest = async () => {
      try {
        const req = await api.get('/doctors/me/join-request');
        if (active) {
          setPendingRequest(req || null);
        }
      } catch (e) {
        console.error('WorkplaceSelectScreen: fetch pending request error', e);
      } finally {
        if (active) setIsCheckingRequest(false);
      }
    };
    checkPendingRequest();

    const sub1 = DeviceEventEmitter.addListener('join_request_accepted', (data) => {
      setPendingRequest(null);
      setActiveWorkplace(data.orgName);
      if (onSave) onSave(data.orgName);
    });

    const sub2 = DeviceEventEmitter.addListener('join_request_rejected', () => {
      setPendingRequest(prev => prev ? { ...prev, status: 'rejected' } : null);
      setActiveWorkplace('');
      if (onSave) onSave('');
    });

    return () => {
      active = false;
      sub1.remove();
      sub2.remove();
    };
  }, [api, onSave]);

  useEffect(() => {
    if (currentWorkplace) {
      setActiveWorkplace(currentWorkplace);
    }
  }, [currentWorkplace]);

  const searchOrganizations = useCallback(async (text) => {
    setQuery(text);
    setSelectedOrg(null); // Clear selection if typing

    if (!text.trim()) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      const data = await api.get(`/organizations?q=${encodeURIComponent(text)}`);
      setResults(data || []);
    } catch (e) {
      console.error('Workplace search error', e);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [api]);

  const handleSelectOrg = (org) => {
    setSelectedOrg(org);
    setQuery(org.displayLabel || org.name);
    setResults([]);
    Keyboard.dismiss();
  };

  const handleSave = async () => {
    if (!selectedOrg) {
      return;
    }

    try {
      if (!selectedOrg.isCustom) {
        setIsSaving(true);
        try {
          await api.post(`/organizations/${selectedOrg.id}/join-requests`, {});
          // Optimistically save the workplace string as well
          await api.put('/doctors/workplace', { workplace: selectedOrg.name });
          await updateSession({ workplace: selectedOrg.name });

          // Re-fetch pending request instead of closing
          const req = await api.get('/doctors/me/join-request');
          setPendingRequest(req || null);

        } catch (e) {
          Alert.alert(t('common.error', 'Error'), e.message || 'Failed to send request');
        } finally {
          setIsSaving(false);
        }
      } else {
        setIsSaving(true);
        // Just save plain text workplace using the new endpoint
        await api.put('/doctors/workplace', { workplace: selectedOrg.name });
        await updateSession({ workplace: selectedOrg.name });
        setActiveWorkplace(selectedOrg.name);
        if (onSave) onSave(selectedOrg.name);
        setIsSaving(false);
      }
    } catch (e) {
      console.error(e);
      setIsSaving(false);
    }
  };

  const handleCancelRequest = async () => {
    try {
      setIsSaving(true);
      await api.del('/doctors/me/join-request');
      setPendingRequest(null);
      setQuery('');
      setSelectedOrg(null);
      setActiveWorkplace('');
    } catch (e) {
      Alert.alert(t('common.error', 'Error'), e.message || 'Failed to cancel request');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResendRequest = async () => {
    if (!pendingRequest?.organization?.id) return;
    try {
      setIsSaving(true);
      await api.post(`/organizations/${pendingRequest.organization.id}/join-requests`, {});
      const req = await api.get('/doctors/me/join-request');
      setPendingRequest(req || null);
    } catch (e) {
      Alert.alert(t('common.error', 'Error'), e.message || 'Failed to resend request');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveWorkplace = async () => {
    try {
      setIsSaving(true);
      await api.put('/doctors/workplace', { workplace: '' });
      await updateSession({ workplace: '' });
      setActiveWorkplace('');
      setQuery('');
      if (onSave) onSave('');
    } catch (e) {
      Alert.alert(t('common.error', 'Error'), e.message || 'Failed to remove workplace');
    } finally {
      setIsSaving(false);
    }
  };

  if (isCheckingRequest) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.p500} />
      </View>
    );
  }

  // --- PENDING / REJECTED REQUEST VIEW ---
  if (pendingRequest) {
    const isRejected = pendingRequest.status === 'rejected';

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          {onBack ? (
            <TouchableOpacity style={styles.backBtn} onPress={onBack}>
              <Icon name="arrow-back" size={sizes.scale(24)} color={colors.n900} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: sizes.scale(40) }} />
          )}
          <Text style={styles.title}>{t('profile.workplace_sheet_title', 'Workplace')}</Text>
          <View style={{ width: sizes.scale(40) }} />
        </View>

        <View style={styles.pendingContent}>
          <View style={styles.pendingIconWrap}>
            <Icon name={isRejected ? "close" : "clock"} size={sizes.scale(48)} color={isRejected ? colors.danger : colors.warning} />
          </View>
          <Text style={[styles.pendingTitle, isRejected && { color: colors.danger }]}>
            {isRejected ? t('profile.join_request_rejected_title', 'Request Rejected') : t('profile.join_request_pending', 'Waiting for confirmation')}
          </Text>
          <Text style={styles.pendingDesc}>
            {isRejected
              ? t('profile.join_request_rejected_desc', 'Your request to join this organization was rejected. You can cancel it or try sending again.')
              : t('profile.join_request_desc', 'Your request to join the following organization has been sent and is awaiting approval.')}
          </Text>

          <View style={styles.pendingCard}>
            <View style={styles.pendingCardIcon}>
              <Icon name="building" size={sizes.scale(24)} color={colors.p500} />
            </View>
            <View style={styles.pendingCardInfo}>
              <Text style={styles.pendingCardName}>{pendingRequest.organization?.name || t('common.unknown', 'Unknown')}</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          {isRejected && (
            <Button
              title={t('profile.resend_request', 'Resend Request')}
              onPress={handleResendRequest}
              loading={isSaving}
              variant="solid"
              style={{ marginBottom: sizes.spacing.m }}
              fullWidth
            />
          )}
          <Button
            title={t('profile.cancel_request', 'Cancel Request')}
            onPress={handleCancelRequest}
            loading={isSaving}
            variant="outline"
            textColor={colors.danger}
            style={{ borderColor: colors.danger }}
            fullWidth
          />
        </View>
      </View>
    );
  }

  // --- ACTIVE WORKPLACE VIEW ---
  if (activeWorkplace) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          {onBack ? (
            <TouchableOpacity style={styles.backBtn} onPress={onBack}>
              <Icon name="arrow-back" size={sizes.scale(24)} color={colors.n900} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: sizes.scale(40) }} />
          )}
          <Text style={styles.title}>{t('profile.workplace_sheet_title', 'Workplace')}</Text>
          <View style={{ width: sizes.scale(40) }} />
        </View>

        <View style={styles.pendingContent}>
          <View style={[styles.pendingIconWrap, { backgroundColor: colors.p50 }]}>
            <Icon name="building" size={sizes.scale(48)} color={colors.p500} />
          </View>
          <Text style={styles.pendingTitle}>{t('profile.active_workplace', 'Current Workplace')}</Text>
          <Text style={styles.pendingDesc}>
            {t('profile.active_workplace_desc', 'This is the organization currently displayed on your profile.')}
          </Text>

          <View style={styles.pendingCard}>
            <View style={styles.pendingCardIcon}>
              <Icon name="building" size={sizes.scale(24)} color={colors.p500} />
            </View>
            <View style={styles.pendingCardInfo}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.pendingCardName}>{activeWorkplace}</Text>
                {session?.workplaceConfirmed && (
                  <Icon name="check" size={sizes.scale(24)} color={colors.info} style={{ marginLeft: sizes.spacing.xs }} />
                )}
              </View>
            </View>
            <Icon name="check-circle" size={sizes.scale(24)} color={colors.p500} />
          </View>
        </View>

        <View style={styles.footer}>
          <Button
            title={t('profile.remove_workplace', 'Remove Workplace')}
            onPress={handleRemoveWorkplace}
            loading={isSaving}
            variant="outline"
            textColor={colors.danger}
            style={{ borderColor: colors.danger }}
            fullWidth
          />
        </View>
      </View>
    );
  }

  // --- STANDARD WORKPLACE SELECT VIEW ---
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {onBack ? (
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Icon name="arrow-back" size={sizes.scale(24)} color={colors.n900} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: sizes.scale(40) }} />
        )}
        <Text style={styles.title}>{t('profile.workplace_sheet_title', 'Workplace')}</Text>
        <View style={{ width: sizes.scale(40) }} />
      </View>

      <Text style={styles.hint}>
        {t('profile.workplace_sheet_hint', 'If you select a registered organization, its owner will receive a join request. Until they confirm, you will not be an official member.')}
      </Text>

      <View style={styles.inputContainer}>
        <Icon name="search" size={sizes.scale(20)} color={colors.n500} style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          placeholder={t('profile.search_org', 'Search organization...')}
          value={query}
          onChangeText={searchOrganizations}
          autoFocus
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => searchOrganizations('')} style={styles.clearBtn}>
            <Icon name="close" size={sizes.scale(20)} color={colors.n500} />
          </TouchableOpacity>
        )}
      </View>

      {selectedOrg && (
        <View style={styles.selectedCard}>
          <Icon name={selectedOrg.isCustom ? "business-outline" : "building"} size={sizes.scale(24)} color={colors.p500} />
          <View style={styles.selectedCardInfo}>
            <Text style={styles.selectedCardName}>{selectedOrg.name}</Text>
            {selectedOrg.isCustom ? (
              <Text style={styles.selectedCardOwnerCustom}>{t('profile.unregistered_org_short', 'Unregistered organization')}</Text>
            ) : (
              <Text style={styles.selectedCardOwner}>{selectedOrg.ownerName}</Text>
            )}
          </View>
          <Icon name="check-circle" size={sizes.scale(24)} color={colors.p500} />
        </View>
      )}

      <View style={{ flex: 1 }}>
        {loading ? (
          <ActivityIndicator size="small" color={colors.p500} style={styles.loader} />
        ) : (
          !selectedOrg && (
            <FlatList
              data={displayResults}
              keyExtractor={item => item.id}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.resultItem} onPress={() => handleSelectOrg(item)}>
                  <View style={styles.resultIconWrap}>
                    <Icon name={item.isCustom ? "business-outline" : "building"} size={sizes.scale(20)} color={colors.n600} />
                  </View>
                  <View style={styles.resultInfo}>
                    <Text style={styles.resultName}>{item.name}</Text>
                    <Text style={[styles.resultOwner, item.isCustom && styles.resultOwnerNote]}>{item.ownerName}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          )
        )}
      </View>

      <View style={styles.footer}>
        <Button
          title={t('common.save', 'Save')}
          onPress={handleSave}
          loading={isSaving}
          disabled={!selectedOrg}
          fullWidth
        />
      </View>
    </View>
  );
}

const themeStyles = (theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
    paddingTop: theme.sizes.spacing.m,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.l,
  },
  backBtn: {
    width: theme.sizes.scale(40),
    height: theme.sizes.scale(40),
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  title: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n900,
  },
  hint: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n600,
    paddingHorizontal: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.l,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.n100,
    borderRadius: theme.sizes.borderRadius.large,
    marginHorizontal: theme.sizes.spacing.m,
    paddingHorizontal: theme.sizes.spacing.m,
    height: theme.sizes.scale(50),
    marginBottom: theme.sizes.spacing.m,
  },
  searchIcon: {
    marginRight: theme.sizes.spacing.s,
  },
  input: {
    flex: 1,
    ...theme.sizes.typography.bodyLarge,
    color: theme.colors.n900,
    height: '100%',
    outlineStyle: 'none',
  },
  clearBtn: {
    padding: theme.sizes.spacing.xs,
  },
  loader: {
    marginTop: theme.sizes.spacing.xl,
  },
  listContent: {
    paddingHorizontal: theme.sizes.spacing.m,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.sizes.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.n200,
  },
  resultIconWrap: {
    width: theme.sizes.scale(40),
    height: theme.sizes.scale(40),
    borderRadius: theme.sizes.scale(20),
    backgroundColor: theme.colors.n100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.sizes.spacing.m,
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    ...theme.sizes.typography.bodyLarge,
    color: theme.colors.n900,
    fontFamily: 'Manrope_600SemiBold',
  },
  resultOwner: {
    ...theme.sizes.typography.caption,
    color: theme.colors.n600,
    marginTop: theme.sizes.scale(2),
  },
  resultOwnerNote: {
    color: theme.colors.n400,
    fontSize: theme.sizes.scale(12),
    fontStyle: 'italic',
    lineHeight: theme.sizes.scale(16),
    marginTop: theme.sizes.scale(4),
  },
  selectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.p50,
    borderWidth: 1,
    borderColor: theme.colors.p300,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.m,
    marginHorizontal: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.m,
  },
  selectedCardInfo: {
    flex: 1,
    marginLeft: theme.sizes.spacing.m,
  },
  selectedCardName: {
    ...theme.sizes.typography.bodyLarge,
    color: theme.colors.p900,
    fontFamily: 'Manrope_600SemiBold',
  },
  selectedCardOwner: {
    ...theme.sizes.typography.caption,
    color: theme.colors.p700,
    marginTop: theme.sizes.scale(2),
  },
  selectedCardOwnerCustom: {
    ...theme.sizes.typography.caption,
    color: theme.colors.n500,
    marginTop: theme.sizes.scale(2),
  },
  footer: {
    padding: theme.sizes.spacing.m,
    paddingBottom: theme.sizes.spacing.xl,
    borderTopWidth: 1,
    borderTopColor: theme.colors.n200,
  },

  // --- Pending state styles ---
  pendingContent: {
    flex: 1,
    paddingHorizontal: theme.sizes.spacing.m,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -theme.sizes.spacing.xxl,
  },
  pendingIconWrap: {
    width: theme.sizes.scale(80),
    height: theme.sizes.scale(80),
    borderRadius: theme.sizes.scale(40),
    backgroundColor: (theme.colors.warning || '#F59E0B') + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.sizes.spacing.l,
  },
  pendingTitle: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n900,
    fontFamily: 'Manrope_700Bold',
    marginBottom: theme.sizes.spacing.s,
    textAlign: 'center',
  },
  pendingDesc: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n600,
    textAlign: 'center',
    marginBottom: theme.sizes.spacing.xl,
    paddingHorizontal: theme.sizes.spacing.l,
  },
  pendingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.n200,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.m,
    width: '100%',
  },
  pendingCardIcon: {
    width: theme.sizes.scale(48),
    height: theme.sizes.scale(48),
    borderRadius: theme.sizes.scale(24),
    backgroundColor: theme.colors.p50,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.sizes.spacing.m,
  },
  pendingCardInfo: {
    flex: 1,
  },
  pendingCardName: {
    ...theme.sizes.typography.bodyLarge,
    color: theme.colors.n900,
    fontFamily: 'Manrope_600SemiBold',
  },
});
