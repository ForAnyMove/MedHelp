import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../theme/ThemeContext';
import { useStyles } from '../../../../theme/useStyles';
import { Icon } from '../../../../components/ui/Icon';
import { transactionManager } from '../../../../managers/transactionManager';
import { SubViewScreen } from '../../../../components/common/SubViewScreen';

const AiBadge = ({ value, status }) => {
  const { colors, sizes } = useTheme();
  // status is 'Low' or 'High'
  const isLow = status?.toLowerCase() === 'low';
  const color = isLow ? colors.danger : colors.warning;
  const iconName = isLow ? 'arrow-down-small' : 'arrow-up-small';

  const match = value?.match(/^([\d.]+)\s*(.*)$/);
  const num = match ? match[1] : value;
  const unit = match ? match[2] : '';

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: sizes.spacing.m }}>
      <Icon name={iconName} size={sizes.scale(16)} color={color} />
      <Text style={{ color, fontSize: sizes.scale(16), fontFamily: 'Manrope_600SemiBold', marginLeft: sizes.scale(2) }}>
        {num}
      </Text>
      {!!unit && (
        <Text style={{ color, opacity: 0.8, fontSize: sizes.scale(13), marginLeft: sizes.scale(2) }}>
          {unit}
        </Text>
      )}
    </View>
  );
};

const AiStatusBadge = ({ status }) => {
  const { colors, sizes } = useTheme();
  const isLow = status?.toLowerCase() === 'low';
  const bgColor = isLow ? colors.sCoral + '33' : colors.sYell + '33';
  const iconColor = isLow ? colors.sCoral : colors.sYell;
  const iconName = isLow ? 'arrow-down-small' : 'arrow-up-small';

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: sizes.scale(8),
      paddingVertical: sizes.scale(4),
      borderRadius: sizes.borderRadius.full,
      backgroundColor: bgColor,
      marginLeft: sizes.spacing.m,
    }}>
      <Icon name={iconName} size={sizes.scale(14)} color={iconColor} />
      <Text style={{
        ...sizes.typography.bodyMedium,
        color: colors.n700,
        fontFamily: 'Manrope_600SemiBold',
        marginLeft: sizes.scale(2),
        textTransform: 'capitalize',
      }}>
        {status?.toLowerCase()}
      </Text>
    </View>
  );
};

export function PatientDetails({ patient, onBack }) {
  const { colors, sizes } = useTheme();
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
              <Icon name={analysis.icon} size={sizes.scale(24)} color={colors[analysis.iconColor]} wrapperStyle={styles.iconBox} wrapped />
              <Text style={styles.analysisTitle} numberOfLines={1} ellipsizeMode="tail">{analysis.title}</Text>
              <Text style={styles.analysisValue}>{analysis.value}</Text>
              <Icon name={analysis.status === 'low' ? 'arrow-down-small' : 'arrow-up-small'} size={sizes.scale(18)} color={analysis.status === 'low' ? colors.danger : colors.warning} />
            </View>
          ))}
        </View>

        {patient.aiSummary && (
          <>
            <Text style={styles.title}>{t('doctor_consultation.ai_summary')}</Text>
            <View style={styles.aiCard}>
              <View style={styles.aiHeader}>
                <Icon name="drops" size={sizes.scale(24)} color={colors.sYell} wrapperStyle={styles.aiIconBox} wrapped />
                <View style={styles.aiHeaderContent}>
                  <View style={styles.aiHeaderTitleRow}>
                    <Text style={styles.aiSummaryTitle}>{patient.aiSummary.title}</Text>
                    <AiBadge value={patient.aiSummary.value} status={patient.aiSummary.status} />
                    <AiStatusBadge status={patient.aiSummary.status} />
                  </View>
                  <Text style={styles.aiNormalRange}>(Normal {patient.aiSummary.normalRange})</Text>
                </View>
              </View>

              <View style={styles.aiDivider} />

              <Text style={styles.aiMainText}>
                <Text style={{ fontFamily: 'Manrope_600SemiBold' }}>{patient.aiSummary.title} -</Text> {patient.aiSummary.description}
              </Text>

              <View style={styles.insightContainer}>
                <View style={styles.insightBox}>
                  <Icon name="check" size={sizes.scale(24)} color={colors.p500} style={styles.circleCheck} />
                  <Text style={styles.insightText}>{patient.aiSummary.insight}</Text>
                </View>

                {patient.aiSummary.bullets?.map((bullet, idx) => (
                  <View key={idx} style={styles.bulletRow}>
                    <View style={styles.aiBullet} />
                    <Text style={styles.bulletText}>{bullet}</Text>
                  </View>
                ))}
              </View>
            </View>

            <Text style={styles.title}>{t('symptoms.res_cause')}</Text>
            <View style={styles.reasonsList}>
              {patient.aiSummary.reasons?.map((reason, idx) => (
                <View key={idx} style={styles.reasonItem}>
                  <Icon name="anemia" size={sizes.scale(24)} color={idx === 0 ? colors.sCoral : idx === 1 ? colors.sYell : colors.sBlue} wrapperStyle={styles.reasonIcon} wrapped />
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
    paddingBottom: theme.sizes.spacing.l,
  },
  title: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n700,
    marginBottom: theme.sizes.spacing.s,
  },
  row: {
    flexDirection: 'row',
    gap: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.m,
  },
  analysisCard: {
    width: theme.sizes.scale(108),
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.m,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  iconBox: {
    width: theme.sizes.scale(32),
    height: theme.sizes.scale(32),
    marginBottom: theme.sizes.spacing.xs,
  },
  analysisTitle: {
    ...theme.sizes.typography.bodyLarge,
    fontFamily: 'Manrope_600SemiBold',
    color: theme.colors.n700,
    marginBottom: theme.sizes.spacing.xs,
  },
  analysisValue: {
    ...theme.sizes.typography.bodySmall,
    color: theme.colors.n500,
    marginBottom: theme.sizes.spacing.xs,
  },
  aiCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.m,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
    marginBottom: theme.sizes.spacing.m,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiIconBox: {
    width: theme.sizes.scale(32),
    height: theme.sizes.scale(32),
  },
  aiHeaderContent: {
    flex: 1,
    marginLeft: theme.sizes.spacing.s,
  },
  aiHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiSummaryTitle: {
    ...theme.sizes.typography.h4,
    color: theme.colors.n700,
  },
  aiNormalRange: {
    ...theme.sizes.typography.bodySmall,
    color: theme.colors.n500,
  },
  aiDivider: {
    height: 1,
    backgroundColor: theme.colors.n200,
    marginVertical: theme.sizes.spacing.s,
  },
  aiMainText: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n700,
    marginBottom: theme.sizes.spacing.s,
    lineHeight: theme.sizes.scale(22),
  },
  insightContainer: {
    backgroundColor: theme.colors.opacityP400,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.m,
  },
  insightBox: {
    flexDirection: 'row',
    marginBottom: theme.sizes.spacing.s,
  },
  insightText: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n700,
    flex: 1,
  },
  circleCheck: {
    marginRight: theme.sizes.spacing.s,
    marginTop: theme.sizes.scale(2),
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.sizes.spacing.s,
  },
  aiBullet: {
    width: theme.sizes.scale(4),
    height: theme.sizes.scale(4),
    borderRadius: theme.sizes.borderRadius.full,
    backgroundColor: theme.colors.n700,
    marginTop: theme.sizes.spacing.s,
    marginRight: theme.sizes.spacing.s,
    marginLeft: theme.sizes.spacing.s,
  },
  bulletText: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n700,
    flex: 1,
  },
  reasonsList: {
    gap: theme.sizes.spacing.s,
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.m,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
    marginBottom: theme.sizes.spacing.m,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reasonIcon: {
    width: theme.sizes.scale(32),
    height: theme.sizes.scale(32),
    marginRight: theme.sizes.spacing.s,
  },
  reasonText: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n700,
  }
});
