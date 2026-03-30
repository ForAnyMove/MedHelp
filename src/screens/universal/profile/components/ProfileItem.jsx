import { View, Text, TouchableOpacity } from 'react-native';
import { useStyles } from '../../../../theme/useStyles';
import { Icon } from '../../../../components/ui/Icon';
import { Switch } from '../../../../components/ui/Switch';

export function ProfileItem({ label, value, type = 'chevron', isLast = false, onPress, onToggle, isToggled, isDanger = false }) {
  const styles = useStyles(themeStyles);

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
              trackColor={{ false: '#EBF4F4', true: '#54DACC' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#EBF4F4"
            />
          ) : (
            <Icon 
              name="ChevronRight" 
              size={18} 
              color={isDanger ? '#F05252' : '#54DACC'} 
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
    paddingVertical: 14,
  },
  label: {
    ...theme.sizes.typography.body,
    color: '#B0BCBC',
    fontWeight: '500',
    flex: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  value: {
    ...theme.sizes.typography.body,
    color: '#2D4A4A',
    fontWeight: '700',
    marginRight: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F9F9',
  },
  dangerText: {
    color: '#F05252',
  },
});
