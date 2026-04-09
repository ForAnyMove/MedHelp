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
    { id: 'chat', label: t('actions.chat'), icon: 'chat', color: colors.sCoral },
    { id: 'video', label: t('actions.video'), icon: 'video', color: colors.p500 },
    { id: 'files', label: t('actions.files'), icon: 'files', color: colors.sYell },
    { id: 'messages', label: t('actions.messages'), icon: 'message', color: colors.sBlue },
  ];

  return (
    <View style={styles.grid}>
      {ACTIONS.map(action => (
        <TouchableOpacity key={action.id} style={styles.card} activeOpacity={0.8}>
          <Icon name={action.icon} size={sizes.scale(24)} color={action.color} wrapperStyle={styles.iconBox} wrapped />
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
    marginBottom: theme.sizes.spacing.m,
  },
  card: {
    width: '47%', // roughly half - gap
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    paddingVertical: theme.sizes.spacing.l,
    paddingHorizontal: theme.sizes.spacing.s,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  iconBox: {
    width: theme.sizes.scale(32),
    height: theme.sizes.scale(32),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.sizes.spacing.s,
  },
  label: {
    ...theme.sizes.typography.bodyLarge,
    fontFamily: 'Manrope_600SemiBold',
    color: theme.colors.n700,
  }
});
