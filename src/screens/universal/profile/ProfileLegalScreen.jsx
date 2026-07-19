import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import RenderHtml from 'react-native-render-html';
import { Screen } from '../../../components/ui/Screen';
import { Icon } from '../../../components/ui/Icon';
import { useTheme } from '../../../theme/ThemeContext';
import { useStyles } from '../../../theme/useStyles';
import { useComponentContext } from '../../../context/GlobalContext';

export function ProfileLegalScreen({ type, onBack }) {
  const { t } = useTranslation();
  const { sizes, colors } = useTheme();
  const styles = useStyles(themeStyles);
  const { width } = useWindowDimensions();
  const { legalController } = useComponentContext();

  const isPrivacy = type === 'privacy';
  const list = isPrivacy ? (legalController?.content?.privacy_policy || []) : (legalController?.content?.terms_of_use || []);
  const pageTitle = isPrivacy ? t('profile.privacy_policy', 'Privacy policy') : t('profile.terms_of_use', 'Terms of use');

  const htmlStyles = {
    p: { ...sizes.typography.bodySmall, color: colors.n500, marginVertical: sizes.scale(4), lineHeight: sizes.scale(20) },
    ul: { marginVertical: sizes.scale(4), paddingLeft: sizes.scale(10) },
    li: { ...sizes.typography.bodySmall, color: colors.n500, marginVertical: sizes.scale(2), lineHeight: sizes.scale(20) },
    a: { color: colors.p500, textDecorationLine: 'none' },
    b: { ...sizes.typography.bodyMedium, color: colors.n900 }
  };

  return (
    <Screen style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Icon name="arrow-back" size={sizes.scale(24)} color={colors.p500} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{pageTitle}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {list.map((item, index) => {
          const isFirst = index === 0;
          return (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconWrapper, isFirst && styles.iconWrapperFirst]}>
                  <Icon
                    name={item.icon}
                    size={sizes.scale(isFirst ? 20 : 18)}
                    color={isFirst ? colors.p500 : colors.p500}
                  />
                </View>
                <View style={styles.titleWrapper}>
                  <Text style={[styles.cardTitle, isFirst && styles.cardTitleFirst]}>{item.title}</Text>
                </View>
              </View>
              <View style={styles.contentWrapper}>
                <RenderHtml
                  contentWidth={width - sizes.scale(64)}
                  source={{ html: item.content }}
                  tagsStyles={htmlStyles}
                />
              </View>
            </View>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

const themeStyles = (theme) => ({
  container: {
    paddingHorizontal: theme.sizes.spacing.m,
    backgroundColor: /* TODO: color */ '#FAFAFA', // Light background as in mockup
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.sizes.scale(40),
    marginBottom: theme.sizes.scale(24),
  },
  backButton: {
    padding: theme.sizes.spacing.xs,
    marginRight: theme.sizes.spacing.s,
  },
  headerTitle: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n900,
  },
  scrollContent: {
    paddingBottom: theme.sizes.scale(100),
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    marginBottom: theme.sizes.spacing.m,
    padding: theme.sizes.spacing.m,
    shadowColor: /* TODO: color */ '#000',
    shadowOffset: { width: theme.sizes.scale(0), height: theme.sizes.scale(2) },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.sizes.spacing.s,
  },
  iconWrapper: {
    width: theme.sizes.scale(28),
    height: theme.sizes.scale(28),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.sizes.spacing.s,
  },
  iconWrapperFirst: {
    width: theme.sizes.scale(40),
    height: theme.sizes.scale(40),
    borderRadius: theme.sizes.scale(12),
    backgroundColor: /* TODO: color */ '#E6F3FF', // Light blue background for the first icon
    marginRight: theme.sizes.spacing.m,
  },
  titleWrapper: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: theme.sizes.scale(4),
  },
  cardTitle: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n900,
    fontWeight: 'bold',
  },
  cardTitleFirst: {
    ...theme.sizes.typography.h3,
    paddingTop: theme.sizes.scale(8),
  },
  contentWrapper: {
    paddingLeft: theme.sizes.scale(2),
  }
});
