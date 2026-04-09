import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeContext';
import { useStyles } from '../../theme/useStyles';
import { Icon } from '../ui/Icon';

export function DoctorQuickActions() {
  const { colors, sizes } = useTheme();
  const { t } = useTranslation();
  const styles = useStyles(themeStyles);

  const actions = [
    { id: 'review', title: t('doctor_dashboard.review_docs'), icon: 'medical-document', color: colors.sCoral },
    { id: 'notes', title: t('doctor_dashboard.add_notes'), icon: 'note', color: colors.sYell },
    { id: 'history', title: t('doctor_dashboard.history'), icon: 'medic-history', color: colors.sBlue },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{t('doctor_dashboard.current_actions')}</Text>
      <View style={styles.grid}>
        {actions.map(action => (
          <TouchableOpacity key={action.id} style={styles.card} activeOpacity={0.7}>
            <Icon name={action.icon} size={sizes.scale(24)} color={action.color} wrapperStyle={styles.iconBox} wrapped />
            <Text style={styles.title}>{action.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const themeStyles = (theme) => ({
  container: {
    marginBottom: theme.sizes.spacing.l,
  },
  sectionTitle: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n700,
    marginBottom: theme.sizes.spacing.s,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.sizes.spacing.m,
  },
  card: {
    flex: 1,
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.scale(12),
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  iconBox: {
    width: theme.sizes.scale(32),
    height: theme.sizes.scale(32),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.sizes.spacing.s,
  },
  title: {
    ...theme.sizes.typography.bodyLarge,
    color: theme.colors.n700,
    fontFamily: 'Manrope_600SemiBold',
    marginBottom: theme.sizes.spacing.m,
  }
});
