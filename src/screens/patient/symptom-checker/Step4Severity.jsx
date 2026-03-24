import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../theme/ThemeContext';
import { Button } from '../../../components/ui/Button';
import { CheckerLayout } from './CheckerLayout';

export function Step4Severity({ data, updateData, onNext, onBack }) {
  const { t } = useTranslation();
  const { sizes, colors } = useTheme();

  const severities = [
    { value: 1, emoji: '😐', color: colors.success },
    { value: 3, emoji: '😕', color: colors.info },
    { value: 5, emoji: '😟', color: colors.warning },
    { value: 7, emoji: '😨', color: colors.sCoral },
    { value: 10, emoji: '😫', color: colors.error }
  ];

  const st = styles(sizes, colors);

  return (
    <CheckerLayout onBack={onBack}>
      <View style={st.content}>
        <View style={st.topFill}>
          <Text style={st.question}>{t('symptoms.q_severity')}</Text>

          <View style={st.scaleContainer}>
            <View style={st.scaleLabels}>
              <Text style={st.scaleLabel}>1{'\n'}{t('symptoms.sev_mild')}</Text>
              <Text style={st.scaleLabel}>10{'\n'}{t('symptoms.sev_severe')}</Text>
            </View>

            <View style={st.trackContainer}>
              <View style={st.trackLine} />
              {severities.map(item => (
                <View 
                  key={item.value} 
                  style={[st.trackDot, data.severity >= item.value && { backgroundColor: item.color }]} 
                />
              ))}
            </View>

            <View style={st.emojiRow}>
              {severities.map(item => {
                const isActive = data.severity === item.value;
                return (
                  <TouchableOpacity
                    key={item.value}
                    activeOpacity={0.7}
                    onPress={() => updateData({ severity: item.value })}
                    style={[st.emojiBtn, isActive && st.emojiBtnActive, isActive && { borderColor: item.color }]}
                  >
                    <Text style={st.emojiText}>{item.emoji}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
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
  scaleContainer: {
    paddingHorizontal: sizes.spacing.m,
  },
  scaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: sizes.spacing.m,
  },
  scaleLabel: {
    ...sizes.typography.caption,
    color: colors.n500,
    textAlign: 'center',
  },
  trackContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 10,
    marginBottom: sizes.spacing.l,
    position: 'relative',
  },
  trackLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: colors.n200,
    borderRadius: 2,
  },
  trackDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.n300,
  },
  emojiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  emojiBtn: {
    width: sizes.scale(40),
    height: sizes.scale(40),
    borderRadius: sizes.scale(20),
    backgroundColor: colors.n100,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  emojiBtnActive: {
    backgroundColor: colors.white,
  },
  emojiText: {
    fontSize: sizes.scale(20),
  },
  footer: {
    justifyContent: 'flex-end',
  }
});
