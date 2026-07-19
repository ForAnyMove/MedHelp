import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useStyles } from '../../../../theme/useStyles';
import { useTheme } from '../../../../theme/ThemeContext';
import { useComponentContext } from '../../../../context/GlobalContext';
import { Icon } from '../../../../components/ui/Icon';
import _ from 'lodash';

export function MedicalProfileEdit({ user, type, onClose }) {
  const { sizes, colors } = useTheme();
  const { t, i18n } = useTranslation();
  const { patientApi, refreshMedicalProfile } = useComponentContext();
  const styles = useStyles(themeStyles);

  const [initialItems, setInitialItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState({}); // mapped by code
  const [dictionary, setDictionary] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const currentLang = i18n.language || 'ru';

  const baseColor = type === 'allergies' ? colors.sCoral : colors.p500;
  const baseColorBg = baseColor + '33'; // 20% opacity

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [profileRes, dictRes] = await Promise.all([
        patientApi.getMedicalProfile(user.id),
        patientApi.searchDictionary(type, '') // fetch all
      ]);

      if (profileRes) {
        const items = profileRes[type] || [];
        setInitialItems(items);

        // Populate local state with initial selections
        const initialSelected = {};
        items.forEach(item => {
          const code = item.condition_code || item.allergy_code || item.medication_code;
          if (code) initialSelected[code] = item;
          else if (item.custom_name) initialSelected[item.custom_name] = item;
        });
        setSelectedItems(initialSelected);
      }

      if (dictRes) {
        setDictionary(dictRes);
      }
    } catch (e) {
      console.error('Failed to load profile data', e);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [type, user.id]);

  const toggleItem = (item) => {
    const code = item.code || item.custom_name;
    setSelectedItems(prev => {
      const updated = { ...prev };
      if (updated[code]) {
        delete updated[code];
      } else {
        updated[code] = item;
      }
      return updated;
    });
  };

  const removeSelectedItem = (code) => {
    setSelectedItems(prev => {
      const updated = { ...prev };
      delete updated[code];
      return updated;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Find items to remove
      const initialCodes = initialItems.map(i => i.condition_code || i.allergy_code || i.medication_code || i.custom_name);
      const currentCodes = Object.keys(selectedItems);

      const toRemove = initialItems.filter(i => {
        const code = i.condition_code || i.allergy_code || i.medication_code || i.custom_name;
        return !selectedItems[code];
      });

      const toAdd = currentCodes.filter(code => !initialCodes.includes(code)).map(code => selectedItems[code]);

      // Process removals
      for (const item of toRemove) {
        const isCustom = !!item.custom_name;
        const value = isCustom ? item.custom_name : (item.condition_code || item.allergy_code || item.medication_code);
        await patientApi.removeMedicalProfileItem(user.id, type, value, isCustom);
      }

      // Process additions
      for (const item of toAdd) {
        let payload = {};
        if (item.custom_name) {
          payload.custom_name = item.custom_name;
        } else {
          payload.code = item.code;
        }
        await patientApi.addMedicalProfileItem(user.id, type, payload);
      }

      if (refreshMedicalProfile) {
        await refreshMedicalProfile();
      }

      onClose();
    } catch (e) {
      console.error('Failed to save medical profile', e);
    }
    setIsSaving(false);
  };

  const getTitle = () => {
    switch (type) {
      case 'conditions': return t('profile.chronic_conditions');
      case 'allergies': return t('profile.allergies');
      case 'medications': return t('profile.medications');
      default: return '';
    }
  };

  const getItemName = (item) => {
    if (item.custom_name) return item.custom_name;
    if (item[currentLang]) return item[currentLang];
    if (item.en) return item.en;

    // For initial items
    const translation = item.condition_translations || item.allergy_translations || item.medication_translations;
    return translation ? translation[currentLang] || translation.en : 'Unknown';
  };

  // Group dictionary items dynamically
  const groupedDictionary = useMemo(() => {
    let filtered = dictionary;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = dictionary.filter(item =>
        (item.ru && item.ru.toLowerCase().includes(q)) ||
        (item.en && item.en.toLowerCase().includes(q))
      );
    }

    const otherLabel = t('common.other', 'Other');
    const groups = _.groupBy(filtered, item => {
      if (!item.group) return otherLabel;
      return item.group[currentLang] || item.group.en || otherLabel;
    });

    // Sort by group order if available
    const sortedGroups = Object.keys(groups).sort((a, b) => {
      if (a === otherLabel) return 1;
      if (b === otherLabel) return -1;
      const orderA = groups[a][0]?.group?.order || 999;
      const orderB = groups[b][0]?.group?.order || 999;
      return orderA - orderB;
    });

    return sortedGroups.map(groupName => ({
      title: groupName,
      data: groups[groupName]
    }));
  }, [dictionary, searchQuery, currentLang]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <Icon name="arrow-back" size={sizes.scale(24)} color={colors.p500} />
        </TouchableOpacity>
        <Text style={styles.title}>{getTitle()}</Text>
      </View>

      <Text style={styles.subtitle}>
        {t('profile.select_all_that_apply', 'Select all that apply. This helps doctors prepare before your consultation.')}
      </Text>

      {/* Selected Tags at the top */}
      <View style={styles.selectedTagsContainer}>
        {Object.keys(selectedItems).map((code) => {
          const item = selectedItems[code];
          return (
            <View key={code} style={[styles.selectedTag, { backgroundColor: baseColorBg }]}>
              <Text style={[styles.selectedTagText, { color: baseColor }]}>{getItemName(item)}</Text>
              <TouchableOpacity onPress={() => removeSelectedItem(code)} hitSlop={{ top: sizes.scale(10), bottom: sizes.scale(10), left: sizes.scale(10), right: sizes.scale(10) }}>
                <Icon name="close" size={sizes.scale(24)} color={baseColor} style={styles.removeIcon} />
              </TouchableOpacity>
            </View>
          );
        })}
      </View>

      {/* Turquoise Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Icon name="search" size={sizes.scale(20)} color={colors.p500} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('common.search', 'Search...')}
            placeholderTextColor={colors.p300}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearIcon}>
              <Icon name="x" size={sizes.scale(20)} color={colors.p500} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.p500} style={styles.loader} />
      ) : (
        <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {groupedDictionary.length > 0 ? (
            groupedDictionary.map(group => (
              <View key={group.title} style={styles.groupSection}>
                <Text style={styles.groupTitle}>{group.title}</Text>
                <View style={styles.tagsContainer}>
                  {group.data.map(item => {
                    const isSelected = !!selectedItems[item.code];
                    return (
                      <TouchableOpacity
                        key={item.code}
                        style={[
                          styles.tag,
                          isSelected && styles.tagSelected,
                          { borderColor: baseColor, backgroundColor: isSelected ? baseColor : baseColorBg }
                        ]}
                        onPress={() => toggleItem(item)}
                      >
                        <Text style={[
                          styles.tagText,
                          { color: isSelected ? colors.white : baseColor },
                          isSelected && styles.tagTextSelected
                        ]}>
                          {item[currentLang] || item.en}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t('common.no_results', 'No results found')}</Text>
              {searchQuery.trim().length > 0 && (
                <TouchableOpacity
                  style={styles.addCustomBtn}
                  onPress={() => {
                    toggleItem({ custom_name: searchQuery });
                    setSearchQuery('');
                    Keyboard.dismiss();
                  }}
                >
                  <Icon name="plus" size={sizes.scale(16)} color={colors.white} />
                  <Text style={styles.addCustomText}>{t('profile.add_custom', 'Add custom value')}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>
      )}

      {/* Sticky Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color={colors.p500} size="small" />
          ) : (
            <>
              <Icon name="check" size={sizes.scale(24)} color={colors.p500} />
              <Text style={styles.saveBtnText}>{t('common.save_changes', 'Save changes')}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const themeStyles = (theme) => ({
  container: {
    flex: 1,
    backgroundColor: /* TODO: color */ '#FAFAFA', // Light background matching mockup
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.sizes.spacing.l,
    paddingTop: theme.sizes.spacing.xl,
    paddingBottom: theme.sizes.spacing.s,
  },
  backButton: {
    marginRight: theme.sizes.spacing.m,
  },
  title: {
    ...theme.sizes.typography.h3,
    color: /* TODO: color */ '#0A333A', // Dark teal color from mockup
  },
  subtitle: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n500,
    paddingHorizontal: theme.sizes.spacing.l,
    marginBottom: theme.sizes.spacing.m,
  },
  selectedTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: theme.sizes.spacing.l,
    marginBottom: theme.sizes.spacing.m,
    gap: theme.sizes.spacing.s,
  },
  selectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: /* TODO: color */ '#E0F7F4', // Light turquoise background
    borderRadius: theme.sizes.scale(),
    paddingVertical: theme.sizes.spacing.xs,
    paddingHorizontal: theme.sizes.spacing.m,
  },
  selectedTagText: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.p500,
    marginRight: theme.sizes.spacing.xs,
  },
  removeIcon: {
    marginLeft: theme.sizes.spacing.xs,
  },
  searchSection: {
    paddingHorizontal: theme.sizes.spacing.l,
    marginBottom: theme.sizes.spacing.m,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.p200, // Turquoise background for search
    borderRadius: theme.sizes.scale(),
    paddingHorizontal: theme.sizes.spacing.m,
    height: theme.sizes.scale(),
  },
  searchIcon: {
    marginRight: theme.sizes.spacing.s,
  },
  clearIcon: {
    padding: theme.sizes.spacing.xs,
  },
  searchInput: {
    flex: 1,
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.p700,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.sizes.spacing.l,
    paddingBottom: theme.sizes.scale(), // Space for absolute footer
  },
  groupSection: {
    marginBottom: theme.sizes.spacing.l,
  },
  groupTitle: {
    ...theme.sizes.typography.h4,
    color: /* TODO: color */ '#0A333A',
    marginBottom: theme.sizes.spacing.s,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.sizes.spacing.s,
  },
  tag: {
    borderWidth: theme.sizes.scale(),
    borderColor: theme.colors.p300,
    backgroundColor: 'transparent',
    borderRadius: theme.sizes.scale(),
    paddingVertical: theme.sizes.spacing.xs,
    paddingHorizontal: theme.sizes.spacing.m,
  },
  tagSelected: {
    backgroundColor: theme.colors.p500,
    borderColor: theme.colors.p500,
  },
  tagText: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.p500,
  },
  tagTextSelected: {
    color: theme.colors.white,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.sizes.spacing.xl,
  },
  emptyText: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n500,
    marginBottom: theme.sizes.spacing.m,
  },
  addCustomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.p500,
    paddingVertical: theme.sizes.spacing.s,
    paddingHorizontal: theme.sizes.spacing.m,
    borderRadius: theme.sizes.borderRadius.medium,
  },
  addCustomText: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.white,
    marginLeft: theme.sizes.spacing.xs,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: theme.sizes.scale(),
    left: theme.sizes.scale(),
    right: theme.sizes.scale(),
    padding: theme.sizes.spacing.l,
    backgroundColor: /* TODO: color */ '#FAFAFA',
    // Gradient fade effect at bottom might be added with LinearGradient, but plain background is fine
    borderTopWidth: 1,
    borderTopColor: /* TODO: color */ 'rgba(0,0,0,0.05)',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.p500,
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.scale(),
    height: theme.sizes.scale(),
  },
  saveBtnText: {
    ...theme.sizes.typography.h4,
    color: theme.colors.p500,
    marginLeft: theme.sizes.spacing.s,
  },
  loader: {
    marginTop: theme.sizes.spacing.xl,
  }
});
