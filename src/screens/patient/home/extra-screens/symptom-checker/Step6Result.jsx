import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../../theme/ThemeContext';
import { Button } from '../../../../../components/ui/Button';
import { Icon } from '../../../../../components/ui/Icon';
import { CheckerLayout } from './CheckerLayout';

export function Step6Result({ data, onBack, onClose }) {
  const { t } = useTranslation();
  const { sizes, colors } = useTheme();
  
  // Compute priority (mock logic)
  const isHighPriority = data.redFlags.length > 0 || data.severity >= 7;

  const priorities = [
    { id: 1, label: t('symptoms.res_consult'), desc: isHighPriority ? t('symptoms.res_high_prio') : t('symptoms.res_suggested'), icon: 'User', color: colors.sCoral },
    { id: 2, label: t('symptoms.res_tested'), desc: isHighPriority ? t('symptoms.res_high_prio') : t('symptoms.res_recommended'), icon: 'Activity', color: colors.primary },
    { id: 3, label: t('symptoms.res_cause'), desc: isHighPriority ? t('symptoms.res_high_prio') : t('symptoms.res_optional'), icon: 'FileText', color: colors.warning }
  ];

  const recommendations = [
    { id: 1, label: t('symptoms.rec_1'), icon: 'check', color: colors.sCoral },
    { id: 2, label: t('symptoms.rec_2'), icon: 'list', color: colors.warning },
    { id: 3, label: t('symptoms.rec_3'), icon: 'chemical', color: colors.info },
    { id: 4, label: t('symptoms.rec_4'), icon: 'pil', color: colors.sCoral },
    { id: 5, label: t('symptoms.rec_5'), icon: 'drops', color: colors.primary },
    { id: 6, label: t('symptoms.rec_6'), icon: 'time', color: colors.sCoral },
    { id: 7, label: t('symptoms.rec_7'), icon: 'doctor', color: colors.warning },
  ];

  const st = styles(sizes, colors);

  return (
    <CheckerLayout onBack={onBack} hideLogo={true}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={st.content}>
        
        <Text style={st.sectionTitle}>{t('symptoms.res_priority')}</Text>
        <View style={st.priorityRow}>
          {priorities.map(p => (
            <View key={p.id} style={st.priorityCard}>
              <View style={[st.iconCircle, { backgroundColor: p.color + '20' }]}>
                <Icon name={p.icon} size={sizes.scale(20)} color={p.color} />
              </View>
              <Text style={st.prioLabel}>{p.label}</Text>
              <Text style={st.prioDesc}>{p.desc}</Text>
            </View>
          ))}
        </View>

        <Text style={st.sectionTitle}>{t('symptoms.res_recs')}</Text>
        <View style={st.recsContainer}>
          {recommendations.map(r => (
            <View key={r.id} style={st.recRow}>
              <View style={[st.recIconBox, { backgroundColor: r.color + '20' }]}>
                {/* Fallback to simple icon if CustomSVG doesn't exist */}
                <Icon name={r.icon} size={sizes.scale(16)} color={r.color} />
              </View>
              <Text style={st.recText}>{r.label}</Text>
            </View>
          ))}
        </View>

        <View style={st.footer}>
          <Button 
            title={t('symptoms.btn_find_doctor')} 
            variant="primary" 
            onPress={() => console.log('Find Doctor')} 
            style={{ marginBottom: sizes.spacing.m }}
          />
          <Button 
            title={t('symptoms.btn_back_home')} 
            variant="outlined" 
            onPress={onClose} 
          />
        </View>
      </ScrollView>
    </CheckerLayout>
  );
}

const styles = (sizes, colors) => StyleSheet.create({
  content: {
    paddingHorizontal: sizes.spacing.l,
    paddingBottom: sizes.spacing.xl,
  },
  sectionTitle: {
    ...sizes.typography.h3,
    color: colors.n900,
    marginBottom: sizes.spacing.m,
    marginTop: sizes.spacing.l,
  },
  priorityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: sizes.spacing.s,
  },
  priorityCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: sizes.borderRadius.medium,
    padding: sizes.spacing.m,
    alignItems: 'center',
    shadowColor: colors.n900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  iconCircle: {
    width: sizes.scale(40),
    height: sizes.scale(40),
    borderRadius: sizes.scale(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: sizes.spacing.s,
  },
  prioLabel: {
    ...sizes.typography.caption,
    fontWeight: '600',
    color: colors.n900,
    textAlign: 'center',
    marginBottom: 4,
  },
  prioDesc: {
    fontSize: sizes.scale(10),
    color: colors.n500,
    textAlign: 'center',
  },
  recsContainer: {
    backgroundColor: colors.white,
    borderRadius: sizes.borderRadius.large,
    padding: sizes.spacing.m,
    shadowColor: colors.n900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  recRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: sizes.spacing.m,
  },
  recIconBox: {
    width: sizes.scale(32),
    height: sizes.scale(32),
    borderRadius: sizes.scale(8),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: sizes.spacing.m,
  },
  recText: {
    ...sizes.typography.body,
    flex: 1,
    color: colors.n800,
  },
  footer: {
    marginTop: sizes.spacing.xxl,
  }
});
