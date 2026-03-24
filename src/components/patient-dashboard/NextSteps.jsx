import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon } from '../ui/Icon';
import { useTheme } from '../../theme/ThemeContext';
import { useStyles } from '../../theme/useStyles';

export function NextSteps() {
  const { sizes, colors } = useTheme();
  const { t } = useTranslation();
  const styles = useStyles(themeStyles);

  const steps = [
    { id: 1, title: t('dashboard.find_doctor'), desc: t('dashboard.find_doctor_desc'), icon: 'UserPlus' },
    { id: 2, title: t('dashboard.view_history'), desc: t('dashboard.view_history_desc'), icon: 'Clock' },
    { id: 3, title: t('dashboard.urgency_level'), desc: t('dashboard.urgency_desc'), icon: 'AlertTriangle' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{t('dashboard.next_steps')}</Text>
      <View style={styles.card}>
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <TouchableOpacity style={styles.stepRow} activeOpacity={0.7}>
              <View style={styles.leftContent}>
                <View style={[styles.iconWrapper, { backgroundColor: `${step.color}15` }]}>
                  <Icon name={step.icon} size={sizes.scale(20)} color={step.color} />
                </View>
                <View style={styles.textContent}>
                  <Text style={styles.title}>{step.title}</Text>
                  <Text style={styles.desc}>{step.desc}</Text>
                </View>
              </View>
              <Icon name="ChevronRight" size={sizes.scale(20)} color={colors.p400} />
            </TouchableOpacity>
            {index < steps.length - 1 && <View style={styles.divider} />}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

const themeStyles = (theme) => ({
  container: {
    marginBottom: theme.sizes.spacing.xl,
  },
  sectionTitle: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n900,
    marginBottom: theme.sizes.spacing.m,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.medium,
    paddingVertical: theme.sizes.spacing.s,
    shadowColor: theme.colors.n900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.sizes.spacing.m,
    paddingHorizontal: theme.sizes.spacing.m,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: theme.sizes.spacing.m,
  },
  iconWrapper: {
    width: theme.sizes.scale(36),
    height: theme.sizes.scale(36),
    borderRadius: theme.sizes.scale(10),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.sizes.spacing.m,
  },
  textContent: {
    flex: 1,
  },
  title: {
    ...theme.sizes.typography.bodyMedium,
    fontWeight: '600',
    color: theme.colors.n900,
    marginBottom: theme.sizes.scale(2),
  },
  desc: {
    ...theme.sizes.typography.caption,
    color: theme.colors.n500,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.n200,
    marginHorizontal: theme.sizes.spacing.m,
  }
});
