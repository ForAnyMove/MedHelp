import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../theme/ThemeContext';
import { Button } from '../../../components/ui/Button';
import { CheckerLayout } from './CheckerLayout';

export function Step2Choose({ data, updateData, onNext, onBack }) {
  const { t } = useTranslation();
  const { sizes, colors } = useTheme();
  
  const options = [
    { id: 'headache', label: t('symptoms.sym_headache') },
    { id: 'fatigue', label: t('symptoms.sym_fatigue') },
    { id: 'pain', label: t('symptoms.sym_pain') },
    { id: 'digestive', label: t('symptoms.sym_digestive') },
    { id: 'other', label: t('symptoms.sym_other') }
  ];

  const toggleSymptom = (id) => {
    const current = data.symptoms;
    if (current.includes(id)) {
      updateData({ symptoms: current.filter(item => item !== id) });
    } else {
      updateData({ symptoms: [...current, id] });
    }
  };

  const st = styles(sizes, colors);

  return (
    <CheckerLayout onBack={onBack}>
      <View style={st.content}>
        <View style={st.topFill}>
          <Text style={st.question}>{t('symptoms.q_what')}</Text>
          
          <View style={st.chipsContainer}>
            {options.map(opt => {
              const isActive = data.symptoms.includes(opt.id);
              return (
                <TouchableOpacity 
                  key={opt.id} 
                  activeOpacity={0.7}
                  onPress={() => toggleSymptom(opt.id)}
                  style={[st.chip, isActive && st.chipActive]}
                >
                  <Text style={[st.chipText, isActive && st.chipTextActive]}>{opt.label}</Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        <View style={st.footer}>
          <Text style={st.hint}>{t('symptoms.sym_hint')}</Text>
          <Button 
            title={t('symptoms.next')} 
            variant="primary" 
            onPress={onNext} 
            disabled={data.symptoms.length === 0}
          />
        </View>
      </View>
    </CheckerLayout>
  );
}

const styles = (sizes, colors) => StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: sizes.spacing.l,
    paddingBottom: sizes.spacing.xl,
  },
  topFill: {
    flex: 1,
    marginTop: sizes.spacing.xxl,
  },
  question: {
    ...sizes.typography.h2,
    textAlign: 'center',
    marginBottom: sizes.spacing.xl,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: sizes.spacing.s,
  },
  chip: {
    paddingHorizontal: sizes.spacing.m,
    paddingVertical: sizes.spacing.s,
    borderRadius: sizes.scale(20),
    borderWidth: 1,
    borderColor: colors.p500,
    backgroundColor: 'transparent',
  },
  chipActive: {
    backgroundColor: colors.p500,
  },
  chipText: {
    ...sizes.typography.body,
    color: colors.p500,
  },
  chipTextActive: {
    color: colors.white,
  },
  footer: {
    alignItems: 'center',
  },
  hint: {
    ...sizes.typography.caption,
    color: colors.n500,
    marginBottom: sizes.spacing.l,
  }
});
