import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../../theme/ThemeContext';
import { Button } from '../../../../../components/ui/Button';
import { Checkbox } from '../../../../../components/ui/Checkbox';
import { CheckerLayout } from './CheckerLayout';

export function Step5RedFlags({ data, updateData, onNext, onBack }) {
  const { t } = useTranslation();
  const { sizes, colors } = useTheme();
  
  const options = [
    { id: 'fever', label: t('symptoms.flag_fever') },
    { id: 'worsening', label: t('symptoms.flag_worsening') },
    { id: 'breath', label: t('symptoms.flag_breath') }
  ];

  const toggleFlag = (id) => {
    const current = data.redFlags;
    if (current.includes(id)) {
      updateData({ redFlags: current.filter(item => item !== id) });
    } else {
      updateData({ redFlags: [...current, id] });
    }
  };

  const st = styles(sizes, colors);

  return (
    <CheckerLayout onBack={onBack}>
      <View style={st.content}>
        <View style={st.topFill}>
          <Text style={st.question}>{t('symptoms.q_flags')}</Text>
          
          <View style={st.list}>
            {options.map(opt => (
              <Checkbox 
                key={opt.id}
                checked={data.redFlags.includes(opt.id)}
                onChange={() => toggleFlag(opt.id)}
                label={opt.label}
              />
            ))}
          </View>
        </View>

        <View style={st.footer}>
          <Button 
            title={t('symptoms.next')} 
            variant="primary" 
            onPress={onNext} 
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
  list: {
    gap: sizes.spacing.l,
    paddingHorizontal: sizes.spacing.m,
  },
  footer: {
    justifyContent: 'flex-end',
  }
});
