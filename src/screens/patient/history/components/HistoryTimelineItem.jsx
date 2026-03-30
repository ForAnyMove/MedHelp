import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useStyles } from '../../../../theme/useStyles';
import { Icon } from '../../../../components/ui/Icon';
import { formatIsoDate } from '../../../../utils/dateUtils';

export function HistoryTimelineItem({ item }) {
  const { t } = useTranslation();
  const styles = useStyles(themeStyles);

  const localizedDate = formatIsoDate(item.date, 'full', t);
  const localizedType = item.type ? (item.type.includes('history.') ? t(item.type) : item.type) : item.type;
  const localizedCategory = item.category ? (item.category.includes('history.') ? t(item.category) : item.category) : item.category;
  
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.8}>
      <Text style={styles.date}>{localizedDate}</Text>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: item.statusColor + '10' }]}>
          <Icon name={item.icon} size={22} color={item.statusColor} />
        </View>
        <View style={styles.textContainer}>
          <View style={styles.row}>
            <Text style={styles.type}>{localizedType}</Text>
            <View style={[styles.statusDot, { backgroundColor: item.statusColor }]} />
          </View>
          <Text style={styles.category}>{localizedCategory}</Text>
        </View>
        <Icon name="ChevronRight" size={20} color="#54DACC" />
      </View>
    </TouchableOpacity>
  );
}

const themeStyles = (theme) => ({
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: 32,
    padding: theme.sizes.spacing.l,
    marginBottom: theme.sizes.spacing.m,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  date: {
    ...theme.sizes.typography.body,
    fontWeight: '800',
    color: '#2D4A4A',
    marginBottom: theme.sizes.spacing.s,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.sizes.spacing.m,
  },
  textContainer: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  type: {
    ...theme.sizes.typography.body,
    fontWeight: '800',
    color: '#2D4A4A',
    marginRight: 6,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  category: {
    ...theme.sizes.typography.caption,
    fontWeight: '500',
    color: '#8A9999',
  },
});
