import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../theme/ThemeContext';
import { useStyles } from '../../../../theme/useStyles';
import { Icon } from '../../../../components/ui/Icon';

export function ActionGrid() {
  const { t } = useTranslation();
  const { colors, sizes } = useTheme();
  const styles = useStyles(themeStyles);

  const ACTIONS = [
    { id: 'chat', label: t('actions.chat'), icon: 'MessageCircle', color: '#FF7D7D' },
    { id: 'video', label: t('actions.video'), icon: 'Video', color: '#54DACC' },
    { id: 'files', label: t('actions.files'), icon: 'FileText', color: '#FFD789' },
    { id: 'messages', label: t('actions.messages'), icon: 'Mail', color: '#7D96FF' },
  ];

  return (
    <View style={styles.grid}>
      {ACTIONS.map(action => (
        <TouchableOpacity key={action.id} style={styles.card} activeOpacity={0.8}>
          <View style={[styles.iconBox, { backgroundColor: action.color + '15' }]}>
            <Icon name={action.icon} size={28} color={action.color} />
          </View>
          <Text style={styles.label}>{action.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const themeStyles = (theme) => ({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.l,
  },
  card: {
    width: '47%', // roughly half - gap
    backgroundColor: theme.colors.white,
    borderRadius: 24,
    padding: theme.sizes.spacing.m,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  iconBox: {
    width: theme.sizes.scale(48),
    height: theme.sizes.scale(48),
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.sizes.spacing.m,
  },
  label: {
    ...theme.sizes.typography.body,
    fontWeight: '600',
    color: theme.colors.n900,
  }
});
