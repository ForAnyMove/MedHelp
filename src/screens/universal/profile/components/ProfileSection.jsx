import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useStyles } from '../../../../theme/useStyles';
import { Icon } from '../../../../components/ui/Icon';
import { useTheme } from '../../../../theme/ThemeContext';

export function ProfileSection({ title, children, onEdit }) {
  const styles = useStyles(themeStyles);
  const { sizes, colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
        {onEdit && (
          <TouchableOpacity onPress={onEdit} hitSlop={{ top: sizes.scale(10), bottom: sizes.scale(10), left: sizes.scale(10), right: sizes.scale(10) }}>
            <Icon name="edit" size={sizes.scale(24)} color={colors.p500} />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.card}>
        {children}
      </View>
    </View>
  );
}

const themeStyles = (theme) => ({
  container: {
    paddingHorizontal: theme.sizes.spacing.m,
    marginTop: theme.sizes.spacing.l,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.sizes.spacing.m,
  },
  title: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n700,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    paddingHorizontal: theme.sizes.spacing.m,
    shadowColor: /* TODO: color */ '#000',
    shadowOffset: { width: theme.sizes.scale(0), height: theme.sizes.scale(2) },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
});
