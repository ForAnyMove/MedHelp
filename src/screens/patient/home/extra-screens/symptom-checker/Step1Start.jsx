import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../../theme/ThemeContext';
import { Button } from '../../../../../components/ui/Button';
import { CheckerLayout } from './CheckerLayout';

export function Step1Start({ onNext, onBack }) {
  const { t } = useTranslation();
  const { sizes, colors } = useTheme();
  
  // Note: Since we don't have the exact illustration background, 
  // we will use a solid beautiful turquoise background and space it nicely.
  return (
    <CheckerLayout onBack={onBack} style={{ backgroundColor: colors.p50 }}>
      <View style={styles(sizes).content}>
        
        <View style={styles(sizes).imagePlaceholder}>
          <Text style={styles(sizes).title}>{t('symptoms.title')}</Text>
          <Text style={styles(sizes).subtitle}>{t('symptoms.subtitle')}</Text>
        </View>

        <View style={styles(sizes).footer}>
          <Button title={t('symptoms.start')} variant="primary" onPress={onNext} />
        </View>
      </View>
    </CheckerLayout>
  );
}

const styles = (sizes) => StyleSheet.create({
  content: {
    flex: 1,
    paddingBottom: sizes.spacing.xl,
    paddingHorizontal: sizes.spacing.l,
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...sizes.typography.h1,
    textAlign: 'center',
    marginBottom: sizes.spacing.s,
  },
  subtitle: {
    ...sizes.typography.body,
    textAlign: 'center',
    paddingHorizontal: sizes.spacing.xl,
  },
  footer: {
    justifyContent: 'flex-end',
  }
});
