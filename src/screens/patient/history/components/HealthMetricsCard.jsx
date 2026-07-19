import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useStyles } from '../../../../theme/useStyles';
import { Icon } from '../../../../components/ui/Icon';
import { useTheme } from '../../../../theme/ThemeContext';

export function HealthMetricsCard({ metrics }) {
  const { sizes, colors } = useTheme();
  const styles = useStyles(themeStyles);
  
  return (
    <View style={styles.card}>
      <MetricItem data={metrics.hemoglobin} icon="Droplets" />
      <View style={styles.divider} />
      <MetricItem data={metrics.ferritin} icon="Thermometer" />
      <View style={styles.divider} />
      <MetricItem data={metrics.cholesterol} icon = 'loader-circle' />
    </View>
  );
}

const MetricItem = ({ data, icon }) => {
  const { sizes } = useTheme();
  const styles = useStyles(themeStyles);
  const { t } = useTranslation();
  return (
    <View style={styles.item}>
      <View style={[styles.iconContainer, { backgroundColor: data.color + '15' }]}>
        <Icon name={icon} size={sizes.scale(20)} color={data.color} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.value}>{data.value}</Text>
        <Text style={styles.label}>{t(data.label)}</Text>
      </View>
    </View>
  );
};

const themeStyles = (theme) => ({
  card: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.scale(32),
    padding: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.l,
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: /* TODO: color */ '#000',
    shadowOffset: { width: theme.sizes.scale(0), height: theme.sizes.scale(4) },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  divider: {
    width: theme.sizes.scale(1),
    height: theme.sizes.scale(30),
    backgroundColor: /* TODO: color */ '#F3F9F9',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: theme.sizes.scale(40),
    height: theme.sizes.scale(40),
    borderRadius: theme.sizes.scale(14),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.sizes.scale(6),
  },
  textContainer: {
    justifyContent: 'center',
  },
  value: {
    ...theme.sizes.typography.h4,
    fontWeight: '800',
    color: /* TODO: color */ '#2D4A4A',
    marginBottom: theme.sizes.scale(-2),
  },
  label: {
    fontSize: theme.sizes.scale(10),
    fontWeight: '500',
    color: /* TODO: color */ '#8A9999',
  },
});
