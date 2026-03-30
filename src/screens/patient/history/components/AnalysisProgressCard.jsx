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
    borderRadius: 32,
    padding: theme.sizes.spacing.l,
    marginBottom: theme.sizes.spacing.l,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  sectionTitle: {
    ...theme.sizes.typography.h3,
    color: '#2D4A4A',
    marginBottom: theme.sizes.spacing.l,
    fontWeight: '800',
  },
  item: {
    marginBottom: theme.sizes.spacing.m,
  },
  label: {
    fontSize: 12,
    color: '#B0BCBC',
    marginBottom: 6,
    fontWeight: '500',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#F3F9F9',
    borderRadius: 4,
    marginRight: theme.sizes.spacing.l,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  percentContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    width: 50,
    justifyContent: 'flex-end',
  },
  percentText: {
    ...theme.sizes.typography.h3,
    fontWeight: '800',
    color: '#2D4A4A',
  },
  percentSymbol: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2D4A4A',
    marginLeft: 2,
  },
});
