import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../theme/ThemeContext';
import { useStyles } from '../../../../theme/useStyles';
import { Icon } from '../../../../components/ui/Icon';
import { SubViewScreen } from '../../../../components/common/SubViewScreen';

export function PatientDetails({ patient, onBack }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useStyles(themeStyles);

  if (!patient) return null;

  return (
    <SubViewScreen onBack={onBack}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>{t('doctor_consultation.analyses')}</Text>
        <View style={styles.row}>
           {patient.analyses?.map(analysis => (
             <View key={analysis.id} style={styles.analysisCard}>
               <View style={styles.iconBox}>
                 <Icon name="Droplets" size={20} color={colors.danger} />
               </View>
               <Text style={styles.analysisTitle}>{analysis.title}</Text>
               <Text style={styles.analysisValue}>{analysis.value}</Text>
               <Icon name={analysis.status === 'low' ? 'ArrowDown' : 'ArrowUp'} size={14} color={analysis.status === 'low' ? colors.danger : '#FFC87E'} />
             </View>
           ))}
        </View>

        {patient.aiSummary && (
          <>
            <Text style={styles.title}>{t('doctor_consultation.ai_summary')}</Text>
            <View style={styles.aiCard}>
               <View style={styles.aiHeader}>
                  <View style={styles.aiIconBox}>
                    <Icon name="Droplets" size={18} color="#FFC87E" />
                  </View>
                  <Text style={styles.aiSummaryTitle}>{patient.aiSummary.title}</Text>
                  <View style={styles.aiBadge}>
                     <Icon name="ArrowDown" size={12} color={colors.danger} />
                     <Text style={styles.aiBadgeText}>{patient.aiSummary.value}</Text>
                  </View>
                  <View style={[styles.aiStatusBadge, { backgroundColor: '#FFF0F0' }]}>
                     <Text style={[styles.aiStatusText, { color: colors.danger }]}>{patient.aiSummary.status}</Text>
                  </View>
               </View>
               
               <Text style={styles.aiNormalRange}>(Normal {patient.aiSummary.normalRange})</Text>
               
               <Text style={styles.aiMainText}>
                 <Text style={{ fontWeight: '700' }}>{patient.aiSummary.title}</Text> - {patient.aiSummary.description}
               </Text>

               <View style={styles.insightBox}>
                  <Icon name="CheckCircle" size={20} color={colors.p500} />
                  <Text style={styles.insightText}>{patient.aiSummary.insight}</Text>
               </View>

               {patient.aiSummary.bullets?.map((bullet, idx) => (
                 <View key={idx} style={styles.bulletRow}>
                    <View style={styles.bullet} />
                    <Text style={styles.bulletText}>{bullet}</Text>
                 </View>
               ))}
            </View>

            <Text style={styles.title}>{t('symptoms.res_cause')}</Text>
            <View style={styles.reasonsList}>
               {patient.aiSummary.reasons?.map((reason, idx) => (
                 <View key={idx} style={styles.reasonItem}>
                    <View style={[styles.reasonIcon, { backgroundColor: idx === 0 ? '#FFF0F0' : idx === 1 ? '#FFF9F0' : '#F0F9FF' }]}>
                       <Icon name="Droplet" size={16} color={idx === 0 ? '#FF7E7E' : idx === 1 ? '#FFC87E' : '#7EBFFF'} />
                    </View>
                    <Text style={styles.reasonText}>{reason.text}</Text>
                 </View>
               ))}
            </View>
          </>
        )}
      </ScrollView>
    </SubViewScreen>
  );
}

const themeStyles = (theme) => ({
  scrollContent: {
    paddingHorizontal: theme.sizes.spacing.l,
    paddingBottom: theme.sizes.spacing.xl,
  },
  title: {
    ...theme.sizes.typography.h2,
    color: theme.colors.n900,
    marginBottom: theme.sizes.spacing.l,
    marginTop: theme.sizes.spacing.m,
  },
  row: {
    flexDirection: 'row',
    gap: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.xl,
  },
  analysisCard: {
    flex: 1,
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.m,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  iconBox: {
    width: theme.sizes.scale(40),
    height: theme.sizes.scale(40),
    borderRadius: theme.sizes.borderRadius.medium,
    backgroundColor: '#FFF0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.sizes.spacing.s,
  },
  analysisTitle: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n900,
    marginBottom: 2,
  },
  analysisValue: {
    ...theme.sizes.typography.caption,
    color: theme.colors.n400,
    marginBottom: 4,
  },
  aiCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.l,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
    marginBottom: theme.sizes.spacing.xl,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.sizes.spacing.s,
  },
  aiIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFF9F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.sizes.spacing.s,
  },
  aiSummaryTitle: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n900,
    flex: 1,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: theme.sizes.spacing.s,
  },
  aiBadgeText: {
    ...theme.sizes.typography.caption,
    color: theme.colors.danger,
    marginLeft: 2,
    fontWeight: '700',
  },
  aiStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  aiStatusText: {
    ...theme.sizes.typography.caption,
    fontSize: 10,
    fontWeight: '700',
  },
  aiNormalRange: {
    ...theme.sizes.typography.caption,
    color: theme.colors.n400,
    marginBottom: theme.sizes.spacing.m,
    marginLeft: 40,
  },
  aiMainText: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n900,
    marginBottom: theme.sizes.spacing.l,
    lineHeight: 22,
  },
  insightBox: {
    flexDirection: 'row',
    backgroundColor: '#E0F9F6',
    borderRadius: 12,
    padding: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.m,
  },
  insightText: {
    ...theme.sizes.typography.bodySmall,
    color: theme.colors.n900,
    flex: 1,
    marginLeft: theme.sizes.spacing.s,
    fontWeight: '700',
    lineHeight: 18,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: theme.sizes.spacing.s,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius:3,
    backgroundColor: theme.colors.p400,
    marginTop: 6,
    marginRight: theme.sizes.spacing.s,
  },
  bulletText: {
    ...theme.sizes.typography.bodySmall,
    color: theme.colors.n600,
    flex: 1,
  },
  reasonsList: {
    gap: theme.sizes.spacing.m,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    padding: theme.sizes.spacing.m,
    borderRadius: 12,
  },
  reasonIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.sizes.spacing.m,
  },
  reasonText: {
    ...theme.sizes.typography.bodySmall,
    color: theme.colors.n900,
    fontWeight: '700',
  }
});
