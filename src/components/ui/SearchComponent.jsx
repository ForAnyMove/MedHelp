import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeContext';
import { useStyles } from '../../theme/useStyles';
import { Icon } from './Icon';
import { SearchableDropdown } from './SearchableDropdown';

export function SearchComponent({
  value,
  onChangeText,
  placeholder,
  mode,
  professions = [],
  onSearchTypeChange // (type: 'name' | 'profession') => void
}) {
  const { t } = useTranslation();
  const { colors, sizes } = useTheme();
  const styles = useStyles(themeStyles);

  const [isFocused, setIsFocused] = useState(false);

  // Filter professions based on input value
  const matchingProfessions = React.useMemo(() => {
    if (!value || !professions || professions.length === 0) return [];
    return professions.filter(p => p.name.toLowerCase().includes(value.toLowerCase()));
  }, [value, professions]);

  const handleSelectProfession = (profName) => {
    onChangeText(profName);
    setIsFocused(false);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.inputWrapper, isFocused && matchingProfessions.length > 0 && styles.inputWrapperActive]}>
        <Icon name="search" size={sizes.scale(24)} color={colors.p500} style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.n500}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            // Delay to allow tap on dropdown item to register before hiding
            setTimeout(() => setIsFocused(false), 300);
          }}
        />
      </View>

      {/* Autocomplete Dropdown */}
      {isFocused && matchingProfessions.length > 0 && (
        <ScrollView style={styles.dropdown} keyboardShouldPersistTaps="handled">
          {matchingProfessions.slice(0, 5).map((prof) => (
            <TouchableOpacity
              key={prof.code}
              style={styles.dropdownItem}
              onPressIn={() => handleSelectProfession(prof.name)}
            >
              <Text style={styles.dropdownItemText}>{prof.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const themeStyles = (theme) => ({
  container: {
    backgroundColor: theme.colors.p400,
    borderRadius: theme.sizes.borderRadius.large,
    paddingHorizontal: theme.sizes.spacing.m,
    paddingVertical: theme.sizes.scale(22),
    marginVertical: theme.sizes.spacing.m,
    // Add some subtle shadow to pop out
    shadowColor: theme.colors.p900,
    shadowOffset: { width: theme.sizes.scale(0), height: theme.sizes.scale(2) },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 10, // For dropdown
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    paddingHorizontal: theme.sizes.spacing.m,
    height: theme.sizes.scale(56),
    shadowColor: /* TODO: color */ "#000",
    shadowOffset: { width: theme.sizes.scale(0), height: theme.sizes.scale(2) },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  inputWrapperActive: {
    borderBottomLeftRadius: theme.sizes.scale(0),
    borderBottomRightRadius: theme.sizes.scale(0),
  },
  searchIcon: {
    marginRight: theme.sizes.spacing.s,
  },
  input: {
    flex: 1,
    ...theme.sizes.typography.bodyLarge,
    color: theme.colors.n900,
    height: '100%',
  },
  dropdown: {
    position: 'absolute',
    top: theme.sizes.scale(48) + theme.sizes.spacing.m, // below input
    left: theme.sizes.spacing.m,
    right: theme.sizes.spacing.m,
    backgroundColor: theme.colors.white,
    borderBottomLeftRadius: theme.sizes.borderRadius.medium,
    borderBottomRightRadius: theme.sizes.borderRadius.medium,
    shadowColor: /* TODO: color */ "#000",
    shadowOffset: { width: theme.sizes.scale(0), height: theme.sizes.scale(4) },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 20,
    paddingVertical: theme.sizes.spacing.xs,
  },
  dropdownItem: {
    paddingHorizontal: theme.sizes.spacing.m,
    paddingVertical: theme.sizes.spacing.s,
  },
  dropdownItemText: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n800,
  }
});
