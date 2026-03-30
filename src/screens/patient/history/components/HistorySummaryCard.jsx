import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useStyles } from '../../../../theme/useStyles';
import { Icon } from '../../../../components/ui/Icon';
import { SegmentedControl } from '../../../../components/ui/SegmentedControl';
import { formatIsoDate } from '../../../../utils/dateUtils';

export function HistorySummaryCard({ activeSegment, onSegmentChange, summary }) {
  const styles = useStyles(themeStyles);
  const { t } = useTranslation();

  return (
    <View style={styles.card}>
      <SegmentedControl 
        options={[
          { label: t('history.all'), value: 'all' },
          { label: t('history.latest_data'), value: 'latest' }
        ]}
        value={activeSegment}
        onChange={onSegmentChange}
        style={styles.segmented}
      />

      <View style={styles.list}>
        <SummaryItem 
          icon="FileText" 
          label={t('history.last_overview')} 
          value={summary.lastOverview ? formatIsoDate(summary.lastOverview, 'full', t) : '--'} 
          isFirst 
        />
        <SummaryItem icon="Activity" label={t('history.analyses_count', { count: summary.analysesCount })} />
        <SummaryItem icon="Stethoscope" label={t('history.consultations_count', { count: summary.consultationsCount })} />
      </View>
    </View>
  );
}

const SummaryItem = ({ icon, label, value, isFirst }) => {
  const styles = useStyles(themeStyles);
  return (
    <View style={styles.itemWrapper}>
      {!isFirst && <View style={styles.divider} />}
      <TouchableOpacity style={styles.item}>
        <View style={styles.iconContainer}>
          <Icon name={icon} size={22} color="#54DACC" />
        </View>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.spacer} />
        {value && <Text style={styles.value}>{value}</Text>}
        <Icon name="ChevronRight" size={20} color="#54DACC" />
      </TouchableOpacity>
    </View>
  );
};

const themeStyles = (theme) => ({
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: 32, // More rounded as per mockup
    padding: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.l,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  segmented: {
    marginBottom: theme.sizes.spacing.m,
  },
  list: {
    paddingHorizontal: 4,
  },
  itemWrapper: {
    width: '100%',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F9F9',
    marginVertical: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#00C2A710', // Very light teal
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.sizes.spacing.m,
  },
  label: {
    ...theme.sizes.typography.body,
    fontWeight: '700', // More bold for main items
    color: '#2D4A4A',
  },
  spacer: {
    flex: 1,
  },
  value: {
    ...theme.sizes.typography.body,
    fontWeight: '700',
    color: '#2D4A4A',
    marginRight: theme.sizes.spacing.s,
  },
});
