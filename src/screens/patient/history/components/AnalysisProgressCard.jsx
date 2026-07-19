import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useStyles } from '../../../../theme/useStyles';

export function AnalysisProgressCard({ vitamins }) {
  const { t } = useTranslation();
  const styles = useStyles(themeStyles);
  
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>{t('history.analyses_title')}</Text>
      {vitamins.map((v, index) => (
        <View key={v.id} style={styles.item}>
           <Text style={styles.label}>{t(v.name)}</Text>
           <View style={styles.progressContainer}>
             <View style={styles.barBg}>
               <View style={[styles.barFill, { width: `${v.percentage}%`, backgroundColor: v.color }]} />
             </View>
             <View style={styles.percentContainer}>
                <Text style={styles.percentText}>{v.percentage}</Text>
                <Text style={styles.percentSymbol}>%</Text>
             </View>
           </View>
        </View>
      ))}
    </View>
  );
}

const themeStyles = (theme) => ({
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.scale(32),
    padding: theme.sizes.spacing.l,
    marginBottom: theme.sizes.spacing.l,
    shadowColor: /* TODO: color */ '#000',
    shadowOffset: { width: theme.sizes.scale(0), height: theme.sizes.scale(4) },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  sectionTitle: {
    ...theme.sizes.typography.h3,
    color: /* TODO: color */ '#2D4A4A',
    marginBottom: theme.sizes.spacing.l,
    fontWeight: '800',
  },
  item: {
    marginBottom: theme.sizes.spacing.m,
  },
  label: {
    fontSize: theme.sizes.scale(12),
    color: /* TODO: color */ '#B0BCBC',
    marginBottom: theme.sizes.scale(6),
    fontWeight: '500',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barBg: {
    flex: 1,
    height: theme.sizes.scale(8),
    backgroundColor: /* TODO: color */ '#F3F9F9',
    borderRadius: theme.sizes.scale(4),
    marginRight: theme.sizes.spacing.l,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: theme.sizes.scale(4),
  },
  percentContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    width: theme.sizes.scale(50),
    justifyContent: 'flex-end',
  },
  percentText: {
    ...theme.sizes.typography.h3,
    fontWeight: '800',
    color: /* TODO: color */ '#2D4A4A',
  },
  percentSymbol: {
    fontSize: theme.sizes.scale(14),
    fontWeight: '700',
    color: /* TODO: color */ '#2D4A4A',
    marginLeft: theme.sizes.scale(2),
  },
});
