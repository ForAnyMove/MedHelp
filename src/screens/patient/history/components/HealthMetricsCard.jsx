import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useStyles } from '../../../../theme/useStyles';
import { Icon } from '../../../../components/ui/Icon';

export function HealthMetricsCard({ metrics }) {
  const styles = useStyles(themeStyles);
  
  return (
    <View style={styles.card}>
      <MetricItem data={metrics.hemoglobin} icon="Droplets" />
      <View style={styles.divider} />
      <MetricItem data={metrics.ferritin} icon="Thermometer" />
      <View style={styles.divider} />
      <MetricItem data={metrics.cholesterol} icon="Activity" />
    </View>
  );
}

const MetricItem = ({ data, icon }) => {
  const styles = useStyles(themeStyles);
  const { t } = useTranslation();
  return (
    <View style={styles.item}>
      <View style={[styles.iconContainer, { backgroundColor: data.color + '15' }]}>
        <Icon name={icon} size={20} color={data.color} />
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
    borderRadius: 32,
    padding: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.l,
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: '#F3F9F9',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  textContainer: {
    justifyContent: 'center',
  },
  value: {
    ...theme.sizes.typography.h4,
    fontWeight: '800',
    color: '#2D4A4A',
    marginBottom: -2,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    color: '#8A9999',
  },
});
