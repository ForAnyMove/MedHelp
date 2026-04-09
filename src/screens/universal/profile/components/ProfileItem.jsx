import { View, Text, TouchableOpacity } from 'react-native';
import { useStyles } from '../../../../theme/useStyles';
import { Icon } from '../../../../components/ui/Icon';
import { Switch } from '../../../../components/ui/Switch';
import { useTheme } from '../../../../theme/ThemeContext';

export function ProfileItem({ label, value, type = 'chevron', isLast = false, onPress, onToggle, isToggled, isDanger = false }) {
  const styles = useStyles(themeStyles);
  const { colors, sizes } = useTheme();

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={styles.item}
        disabled={type === 'toggle'}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Text style={[styles.label, isDanger && styles.dangerText]}>{label}</Text>
        <View style={styles.right}>
          {value && <Text style={styles.value}>{value}</Text>}

          {type === 'toggle' ? (
            <Switch
              value={isToggled}
              onValueChange={onToggle}
              trackColor={{ false: colors.n200, true: colors.p500 }}
              thumbColor={colors.white}
              ios_backgroundColor={colors.n200}
            />
          ) : (
            <Icon
              name="ChevronRight"
              size={sizes.scale(24)}
              color={isDanger ? colors.danger : colors.p500}
            />
          )}
        </View>
      </TouchableOpacity>
      {!isLast && <View style={styles.divider} />}
    </View>
  );
}

const themeStyles = (theme) => ({
  wrapper: {
    width: '100%',
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.sizes.scale(10),
  },
  label: {
    ...theme.sizes.typography.bodyLarge,
    fontSize: theme.sizes.scale(15),
    color: theme.colors.n500,
    flex: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  value: {
    ...theme.sizes.typography.bodyLarge,
    color: theme.colors.n700,
    fontFamily: 'Manrope_600SemiBold',
    marginRight: theme.sizes.spacing.s,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.n200,
  },
  dangerText: {
    color: theme.colors.danger,
  },
});
