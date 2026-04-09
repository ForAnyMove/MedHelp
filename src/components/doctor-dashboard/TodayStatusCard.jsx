import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeContext';
import { useStyles } from '../../theme/useStyles';
import { Icon } from '../ui/Icon';

export function TodayStatusCard({ consultationCount, onConsultationPress }) {
  const { colors, sizes } = useTheme();
  const { t } = useTranslation();
  const styles = useStyles(themeStyles);

  return (
    <View style={styles.container}>
      <TouchableOpacity activeOpacity={0.9} onPress={onConsultationPress}>
        <View style={styles.todayCard}>
          <Text style={styles.todayHeader}>{t('common.today')}</Text>
          <View style={styles.todayContent}>
            <View style={styles.todayWhiteBox}>
              <Icon name="stethoscope" size={sizes.scale(24)} color={colors.p500} />
              <Text style={styles.todayText}>
                {t('doctor_dashboard.today_consultations', { count: consultationCount })}
              </Text>
              <Icon name="arrow-right" size={sizes.scale(24)} color={colors.p500} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const themeStyles = (theme) => ({
  container: {
    marginBottom: theme.sizes.spacing.l,
  },
  todayCard: {
    backgroundColor: theme.colors.p400,
    borderRadius: theme.sizes.borderRadius.large,
    paddingHorizontal: theme.sizes.spacing.m,
    paddingVertical: theme.sizes.spacing.s,
    height: theme.sizes.scale(120),
    justifyContent: 'space-between',
  },
  todayHeader: {
    ...theme.sizes.typography.h4,
    color: theme.colors.white,
  },
  todayContent: {
    flex: 1,
    justifyContent: 'center',
    marginTop: theme.sizes.spacing.s,
  },
  todayWhiteBox: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.full,
    paddingVertical: theme.sizes.spacing.m,
    paddingHorizontal: theme.sizes.spacing.m,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  todayText: {
    ...theme.sizes.typography.bodyLarge,
    color: theme.colors.n900,
    fontFamily: 'Manrope_600SemiBold',
    flex: 1,
    marginLeft: theme.sizes.spacing.s,
  }
});
