import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../../../theme/ThemeContext';
import { useStyles } from '../../../../theme/useStyles';
import { Icon } from '../../../../components/ui/Icon';

export function TimerBlock({ seconds = 0 }) {
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
        <View style={styles.iconCircle}>
          <Icon name="Clock" size={20} color={colors.sCoral} />
        </View>
        <Text style={styles.title}>Timer</Text>
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
    borderRadius: 24,
    padding: theme.sizes.spacing.m,
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
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFE8E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.sizes.spacing.s,
  },
  title: {
    ...theme.sizes.typography.body,
    fontWeight: '600',
    color: theme.colors.n900,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: theme.colors.n100,
    marginBottom: theme.sizes.spacing.m,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  digitBox: {
    backgroundColor: '#F0F7F6',
    borderRadius: 8,
    width: 32,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2EAE9',
  },
  digitText: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n700,
  },
  separator: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n700,
    marginHorizontal: 2,
  }
});
