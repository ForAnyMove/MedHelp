import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useStyles } from '../../../../theme/useStyles';
import { Icon } from '../../../../components/ui/Icon';
import { SegmentedControl } from '../../../../components/ui/SegmentedControl';
import { formatIsoDate } from '../../../../utils/dateUtils';
import { useTheme } from '../../../../theme/ThemeContext';

export function HistorySummaryCard({ activeSegment, onSegmentChange, summary, onConsultationsPress }) {
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
          icon="medic-history"
          label={t('history.last_overview')}
          value={summary.lastOverview ? formatIsoDate(summary.lastOverview, 'full', t) : '--'}
          isFirst
        />
        <SummaryItem icon="microscope" label={t('history.analyses_count', { count: summary.analysesCount })} />
        <SummaryItem
          icon="stethoscope"
          label={t('history.consultations_count', { count: summary.consultationsCount })}
          onPress={onConsultationsPress}
        />
      </View>
    </View>
  );
}

const SummaryItem = ({ icon, label, value, isFirst, onPress }) => {
  const styles = useStyles(themeStyles);
  const { sizes, colors } = useTheme();
  return (
    <View style={styles.itemWrapper}>
      {!isFirst && <View style={styles.divider} />}
      <TouchableOpacity style={styles.item} onPress={onPress} activeOpacity={0.7}>
        <View style={styles.iconContainer}>
          <Icon name={icon} size={sizes.scale(24)} color=/* TODO: color */ "#54DACC" />
        </View>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.spacer} />
        {value && <Text style={styles.value}>{value}</Text>}
        <Icon name="arrow-right" size={sizes.scale(20)} color=/* TODO: color */ "#54DACC"  />
      </TouchableOpacity>
    </View>
  );
};

const themeStyles = (theme) => ({
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.scale(32), // More rounded as per mockup
    padding: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.l,
    shadowColor: /* TODO: color */ '#000',
    shadowOffset: { width: theme.sizes.scale(0), height: theme.sizes.scale(4) },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  segmented: {
    marginBottom: theme.sizes.spacing.m,
  },
  list: {
    paddingHorizontal: theme.sizes.scale(4),
  },
  itemWrapper: {
    width: '100%',
  },
  divider: {
    height: theme.sizes.scale(1),
    backgroundColor: /* TODO: color */ '#F3F9F9',
    marginVertical: theme.sizes.scale(4),
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.sizes.scale(10),
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.sizes.spacing.m,
  },
  label: {
    ...theme.sizes.typography.body,
    fontWeight: '700', // More bold for main items
    color: /* TODO: color */ '#2D4A4A',
  },
  spacer: {
    flex: 1,
  },
  value: {
    ...theme.sizes.typography.body,
    fontWeight: '700',
    color: /* TODO: color */ '#2D4A4A',
    marginRight: theme.sizes.spacing.s,
  },
});
