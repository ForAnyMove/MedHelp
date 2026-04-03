import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import i18n from '../../locales/i18n';
import { useTheme } from '../../theme/ThemeContext';
import { useComponentContext } from '../../context/GlobalContext';
import { useStyles } from '../../theme/useStyles';
import { Icon } from '../ui/Icon';

export function Header() {
  const { sizes, colors } = useTheme();
  const { user, initials } = useComponentContext();
  const { t } = useTranslation();
  const styles = useStyles(themeStyles);

  if (!user) return null;

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.greeting}>{t('dashboard.greeting', { name: user.firstName })}</Text>
      </View>
      
      <View style={{flexDirection: 'row', alignItems: 'center', gap: sizes.spacing.m}}>
        <TouchableOpacity 
          style={styles.langBtn} 
          activeOpacity={0.7}
          onPress={() => i18n.changeLanguage(i18n.language === 'en' ? 'ru' : 'en')}
        >
          <Text style={styles.langText}>{i18n.language.toUpperCase()}</Text>
        </TouchableOpacity>
        <Icon name="notifications" size={sizes.scale(24)} color={colors.p500} onPress={() => console.log('Notifications')} />
      </View>
    </View>
  );
}

const themeStyles = (theme) => ({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.sizes.spacing.s,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: theme.sizes.scale(32),
    height: theme.sizes.scale(32),
    borderRadius: theme.sizes.scale(20),
    backgroundColor: theme.colors.p500,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.sizes.spacing.s,
  },
  avatarText: {
    ...theme.sizes.typography.h3,
    color: theme.colors.white,
  },
  greeting: {
    ...theme.sizes.typography.h4,
    color: theme.colors.n900,
  },
  langBtn: {
    paddingHorizontal: theme.sizes.spacing.xs,
    paddingVertical: theme.sizes.spacing.xs,
    backgroundColor: theme.colors.n100,
    borderRadius: theme.sizes.borderRadius.small,
  },
  langText: {
    ...theme.sizes.typography.caption,
    fontWeight: '600',
    color: theme.colors.n700,
  }
});
