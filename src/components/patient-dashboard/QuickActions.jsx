import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon } from '../ui/Icon';
import { useTheme } from '../../theme/ThemeContext';
import { useStyles } from '../../theme/useStyles';

export function QuickActions({ onAction }) {
  const { sizes, colors } = useTheme();
  const { t } = useTranslation();
  const styles = useStyles(themeStyles);

  const actions = [
    { id: 'upload', title: t('dashboard.upload_analysis'), desc: t('dashboard.upload_desc'), icon: 'Upload', color: colors.sCoral },
    { id: 'checker', title: t('dashboard.symptom_checker'), desc: t('dashboard.checker_desc'), icon: 'Stethoscope', color: colors.warning },
    { id: 'consult', title: t('dashboard.next_consultation'), desc: t('dashboard.consult_desc'), icon: 'User', color: colors.info },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{t('dashboard.quick_actions')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {actions.map(action => (
          <TouchableOpacity
            key={action.id}
            style={styles.card}
            onPress={() => onAction && onAction(action.id)}
            activeOpacity={0.7}
          >
            <Icon name={action.icon} wrapped size={sizes.scale(24)} color={action.color} style={styles.icon} wrapperStyle={styles.iconWrapper} wrapperOpacity={0.15} />
            <Text style={styles.title} numberOfLines={2}>{action.title}</Text>
            <Text style={styles.desc} numberOfLines={1}>{action.desc}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const themeStyles = (theme) => ({
  container: {
    marginBottom: theme.sizes.spacing.m,
  },
  sectionTitle: {
    ...theme.sizes.typography.h3,
    fontWeight: '700',
    color: theme.colors.n700,
  },
  scrollContent: {
    gap: theme.sizes.spacing.m,
    paddingRight: theme.sizes.spacing.l, // Space at the very end of scroll
    paddingVertical: theme.sizes.spacing.s,
  },
  card: {
    width: theme.sizes.scale(108),
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.scale(12),
    // Soft shadow for cards
    shadowColor: theme.colors.n900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconWrapper: {
    width: theme.sizes.scale(32),
    height: theme.sizes.scale(32),
    borderRadius: theme.sizes.scale(8),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.sizes.spacing.xs,
  },
  icon: {
    padding: theme.sizes.scale(4),
  },
  title: {
    ...theme.sizes.typography.bodyLarge,
    fontWeight: '600',
    fontFamily: 'Manrope_600SemiBold',
    color: theme.colors.n700,
    marginBottom: theme.sizes.spacing.xs,
  },
  desc: {
    ...theme.sizes.typography.caption,
    color: theme.colors.n500,
  },
});
