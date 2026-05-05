import React, { useState, useRef, useMemo } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  StyleSheet, 
  Animated,
  Platform
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useStyles } from '../../theme/useStyles';
import { Icon } from './Icon';

export function SearchableDropdown({ 
  label, 
  placeholder, 
  data = [], 
  onSelect, 
  value = '', 
  error = '' 
}) {
  const { colors, sizes } = useTheme();
  const styles = useStyles(themeStyles);
  
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const filteredData = useMemo(() => {
    if (!search) return data;
    return data.filter(item => 
      item.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [data, search]);

  const selectedItem = data.find(i => i.code === value);
  const displayValue = selectedItem ? selectedItem.name : '';

  const handleSelect = (item) => {
    onSelect(item.code);
    setSearch('');
    setIsOpen(false);
  };

  return (
    <View style={styles.container}>
      {!!label && <Text style={styles.label}>{label}</Text>}
      
      <TouchableOpacity 
        activeOpacity={0.8}
        style={[
          styles.inputContainer, 
          isOpen && styles.inputContainerActive,
          !!error && styles.inputContainerError
        ]}
        onPress={() => setIsOpen(!isOpen)}
      >
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.n500}
          value={isOpen ? search : displayValue}
          onChangeText={setSearch}
          onFocus={() => setIsOpen(true)}
          pointerEvents={isOpen ? 'auto' : 'none'}
          editable={isOpen}
          autoCorrect={false}
        />
        <Icon 
          name={isOpen ? "ChevronUp" : "ChevronDown"} 
          size={sizes.scale(20)} 
          color={colors.n600} 
        />
      </TouchableOpacity>

      {!!error && <Text style={styles.errorText}>{error}</Text>}

      {isOpen && (
        <View style={styles.dropdown}>
          <FlatList
            data={filteredData}
            keyExtractor={item => item.code}
            style={{ maxHeight: sizes.scale(48 * 4) }} // Height of 4 items
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.item}
                onPress={() => handleSelect(item)}
              >
                <Text style={[
                  styles.itemText,
                  item.code === value && styles.itemTextActive
                ]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyItem}>
                <Text style={styles.emptyText}>Нет результатов</Text>
              </View>
            }
          />
        </View>
      )}
    </View>
  );
}

const themeStyles = (theme) => ({
  container: {
    width: '100%',
    zIndex: 1000, // Important for dropdown visibility
  },
  label: {
    ...theme.sizes.typography.caption,
    color: theme.colors.n600,
    marginBottom: 6,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.colors.n300,
    paddingHorizontal: theme.sizes.spacing.m,
    height: theme.sizes.scale(48),
  },
  inputContainerActive: {
    borderColor: theme.colors.p500,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  inputContainerError: {
    borderColor: theme.colors.d500,
  },
  input: {
    flex: 1,
    ...theme.sizes.typography.bodyLarge,
    color: theme.colors.n900,
    padding: 0,
  },
  dropdown: {
    position: 'absolute',
    top: theme.sizes.scale(48 + (!!theme.label ? 24 : 18)),
    left: 0,
    right: 0,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.n300,
    borderTopWidth: 0,
    borderBottomLeftRadius: theme.sizes.borderRadius.medium,
    borderBottomRightRadius: theme.sizes.borderRadius.medium,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  item: {
    paddingHorizontal: theme.sizes.spacing.m,
    paddingVertical: theme.sizes.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.n100,
  },
  itemText: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n800,
  },
  itemTextActive: {
    color: theme.colors.p500,
    fontWeight: 'bold',
  },
  emptyItem: {
    padding: theme.sizes.spacing.m,
    alignItems: 'center',
  },
  emptyText: {
    ...theme.sizes.typography.caption,
    color: theme.colors.n500,
  },
  errorText: {
    ...theme.sizes.typography.caption,
    color: theme.colors.d500,
    marginTop: 4,
    marginLeft: 4,
  }
});
