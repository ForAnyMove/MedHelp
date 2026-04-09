import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../../../theme/ThemeContext';
import { useStyles } from '../../../../theme/useStyles';
import { Icon } from '../../../../components/ui/Icon';
import { useTranslation } from 'react-i18next';

export function TimerBlock({ seconds = 0 }) {
  const { t } = useTranslation();
  const { colors, sizes } = useTheme();
  const styles = useStyles(themeStyles);

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    return [
      String(hours).padStart(2, '0'),
      String(mins).padStart(2, '0'),
      String(secs).padStart(2, '0')
    ].join(':');
  };

  const timeStr = formatTime(seconds);
  const digits = timeStr.split(''); // ['0', '0', ':', '1', '0', ':', '3', '0']

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon name="timer" size={sizes.scale(24)} color={colors.sPink} wrapperStyle={styles.iconWrapper} wrapped />
        <Text style={styles.title}>{t('consultation.timer')}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.timerRow}>
        {digits.map((digit, index) => (
          digit === ':' ? (
            <Text key={`sep-${index}`} style={styles.separator}>:</Text>
          ) : (
            <View key={`digit-${index}`} style={styles.digitBox}>
              <Text style={styles.digitText}>{digit}</Text>
            </View>
          )
        ))}
      </View>
    </View>
  );
}

const themeStyles = (theme) => ({
  container: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.s,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.sizes.spacing.s,
  },
  iconWrapper: {
    width: theme.sizes.scale(32),
    height: theme.sizes.scale(32),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.sizes.spacing.s,
  },
  title: {
    ...theme.sizes.typography.bodyLarge,
    fontFamily: 'Manrope_600SemiBold',
    color: theme.colors.n700,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: theme.colors.n200,
    marginBottom: theme.sizes.scale(12),
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.sizes.scale(4),
    marginBottom: theme.sizes.spacing.s,
  },
  digitBox: {
    backgroundColor: theme.colors.bg,
    borderRadius: theme.sizes.borderRadius.small,
    width: theme.sizes.scale(24),
    height: theme.sizes.scale(32),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.n300,
  },
  digitText: {
    ...theme.sizes.typography.h4,
    color: theme.colors.n700,
  },
  separator: {
    ...theme.sizes.typography.h4,
    color: theme.colors.n700,
  }
});
