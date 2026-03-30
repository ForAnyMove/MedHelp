import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../../theme/ThemeContext';
import { Button } from '../../../../../components/ui/Button';
import { CheckerLayout } from './CheckerLayout';

export function Step3Duration({ data, updateData, onNext, onBack }) {
  const { t } = useTranslation();
  const { sizes, colors } = useTheme();
  
  const options = [
    { id: 'less_3', label: t('symptoms.dur_less_3') },
    { id: 'several', label: t('symptoms.dur_several') },
    { id: 'more_week', label: t('symptoms.dur_more_week') }
  ];

  const st = styles(sizes, colors);

  return (
    <CheckerLayout onBack={onBack}>
      <View style={st.content}>
        <View style={st.topFill}>
          <Text style={st.question}>{t('symptoms.q_duration')}</Text>
          
          <View style={st.radioContainer}>
            {options.map(opt => {
              const isActive = data.duration === opt.id;
              return (
                <TouchableOpacity 
                  key={opt.id} 
                  activeOpacity={0.7}
                  onPress={() => updateData({ duration: opt.id })}
                  style={st.radioRow}
                >
                  <View style={[st.radioOuter, isActive && st.radioOuterActive]}>
                    {isActive && <View style={st.radioInner} />}
                  </View>
                  <Text style={st.radioText}>{opt.label}</Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        <View style={st.footer}>
          <Button 
            title={t('symptoms.next')} 
            variant="primary" 
            onPress={onNext} 
            disabled={!data.duration}
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
  radioContainer: {
    gap: sizes.spacing.l,
    paddingHorizontal: sizes.spacing.l,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioOuter: {
    width: sizes.scale(20),
    height: sizes.scale(20),
    borderRadius: sizes.scale(10),
    borderWidth: 2,
    borderColor: colors.p400,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: sizes.spacing.m,
  },
  radioOuterActive: {
    borderColor: colors.p500,
  },
  radioInner: {
    width: sizes.scale(10),
    height: sizes.scale(10),
    borderRadius: sizes.scale(5),
    backgroundColor: colors.p500,
  },
  radioText: {
    ...sizes.typography.body,
    color: colors.n900,
  },
  footer: {
    justifyContent: 'flex-end',
  }
});
