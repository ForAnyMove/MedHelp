import React from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet, Image, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeContext';
import { useStyles } from '../../theme/useStyles';
import { Icon } from '../ui/Icon';
import { NotificationBadge } from '../common/NotificationBadge';
import { useComponentContext } from '../../context/GlobalContext';
import { useSession } from '../../context/SessionContext';

/**
 * AdaptiveNavigationShell
 * Orchestrates navigation across all form factors:
 * - Mobile / Portrait: Bottom TabBar
 * - Tablet Landscape: Vertical Navigation Rail (84px)
 * - Desktop / Wide / Ultrawide: Full Desktop Sidebar (250px)
 */
export function AdaptiveNavigationShell({
  routes = [],
  currentIndex = 0,
  onIndexChange,
  children,
  role = 'patient',
}) {
  const { sizes, colors, responsive } = useTheme();
  const styles = useStyles(themeStyles);
  const { t } = useTranslation();
  const context = useComponentContext();
  const { logout } = useSession();

  const isDoctor = role === 'doctor';
  const isOwner = role === 'owner';
  const user = isDoctor ? context?.doctorProfileController?.profile : context?.user;

  const navMode = responsive?.navigationMode || 'bottomBar';
  const isBottomBar = navMode === 'bottomBar';
  const isNavRail = navMode === 'navRail';
  const isSidebar = navMode === 'sidebar';

  const roleLabelMap = {
    patient: t('common.patient', 'Пациент'),
    doctor: t('common.doctor', 'Врач'),
    owner: t('common.clinic', 'Клиника'),
  };

  const getUserDisplayName = () => {
    if (!user) return t('profile.user', 'Пользователь');
    const first = user.firstName || user.first_name || '';
    const last = user.lastName || user.last_name || '';
    if (first || last) {
      return `${first} ${last}`.trim();
    }
    if (user.name) return user.name;
    return user.email || t('profile.user', 'Пользователь');
  };

  // --- 1. RENDER: Bottom TabBar (Mobile & Portrait) ---
  const renderBottomTabBar = () => (
    <View style={styles.bottomTabBar}>
      {routes.map((route, i) => {
        const isFocused = currentIndex === i;
        return (
          <TouchableOpacity
            key={route.key}
            style={styles.bottomTabItem}
            activeOpacity={0.7}
            onPress={() => onIndexChange?.(i)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isFocused }}
          >
            <View style={styles.iconWrapper}>
              <Icon
                name={route.icon}
                color={isFocused ? colors.p500 : colors.n700}
                size={sizes.scale(24)}
              />
              {route.badgeCount > 0 && (
                <NotificationBadge count={route.badgeCount} />
              )}
            </View>
            <Text
              style={[
                styles.bottomTabText,
                isFocused && styles.bottomTabTextFocused,
              ]}
              numberOfLines={1}
            >
              {route.title}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  // --- 2. RENDER: Navigation Rail (Tablet Landscape, 84px) ---
  const renderNavRail = () => (
    <View style={styles.navRailContainer}>
      <View style={styles.railTopBrand}>
        <View style={styles.railBrandLogo}>
          <Icon name="stethoscope" color={colors.white} size={sizes.scale(22)} />
        </View>
      </View>

      <ScrollView
        style={styles.railNavScroll}
        contentContainerStyle={styles.railNavItems}
        showsVerticalScrollIndicator={false}
      >
        {routes.map((route, i) => {
          const isFocused = currentIndex === i;
          return (
            <TouchableOpacity
              key={route.key}
              style={[
                styles.railItem,
                isFocused && styles.railItemActive,
              ]}
              activeOpacity={0.7}
              onPress={() => onIndexChange?.(i)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
            >
              <View style={styles.iconWrapper}>
                <Icon
                  name={route.icon}
                  color={isFocused ? colors.p500 : colors.n500}
                  size={sizes.scale(22)}
                />
                {route.badgeCount > 0 && (
                  <NotificationBadge count={route.badgeCount} />
                )}
              </View>
              <Text
                style={[
                  styles.railItemText,
                  isFocused && styles.railItemTextActive,
                ]}
                numberOfLines={1}
              >
                {route.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.railBottomAction}>
        <TouchableOpacity
          style={styles.railLogoutBtn}
          onPress={logout}
          activeOpacity={0.7}
          accessibilityLabel={t('profile.logout', 'Выйти')}
        >
          <Icon name="log-out" color={colors.n500} size={sizes.scale(20)} />
        </TouchableOpacity>
      </View>
    </View>
  );

  // --- 3. RENDER: Desktop Sidebar (Laptop / Desktop / Ultrawide, 250px) ---
  const renderDesktopSidebar = () => (
    <View style={styles.sidebarContainer}>
      {/* Brand Header */}
      <View style={styles.sidebarBrand}>
        <View style={styles.brandIconCircle}>
          <Icon name="stethoscope" color={colors.white} size={sizes.scale(20)} />
        </View>
        <View style={styles.brandTextCol}>
          <Text style={styles.brandTitle}>MedHelp</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>{roleLabelMap[role] || role}</Text>
          </View>
        </View>
      </View>

      {/* Nav Items List */}
      <ScrollView
        style={styles.sidebarNavScroll}
        contentContainerStyle={styles.sidebarNavList}
        showsVerticalScrollIndicator={false}
      >
        {routes.map((route, i) => {
          const isFocused = currentIndex === i;
          return (
            <TouchableOpacity
              key={route.key}
              style={[
                styles.sidebarItem,
                isFocused && styles.sidebarItemActive,
              ]}
              activeOpacity={0.75}
              onPress={() => onIndexChange?.(i)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
            >
              <View style={styles.sidebarItemLeft}>
                <Icon
                  name={route.icon}
                  color={isFocused ? colors.p500 : colors.n500}
                  size={sizes.scale(20)}
                />
                <Text
                  style={[
                    styles.sidebarItemText,
                    isFocused && styles.sidebarItemTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {route.title}
                </Text>
              </View>

              {route.badgeCount > 0 && (
                <View style={styles.sidebarBadgePill}>
                  <Text style={styles.sidebarBadgeText}>{route.badgeCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* User & Logout Card */}
      <View style={styles.sidebarFooter}>
        <View style={styles.userCard}>
          <View style={styles.userAvatarCircle}>
            <Text style={styles.userAvatarInitials}>
              {(getUserDisplayName()[0] || 'U').toUpperCase()}
            </Text>
          </View>
          <View style={styles.userInfoCol}>
            <Text style={styles.userNameText} numberOfLines={1}>
              {getUserDisplayName()}
            </Text>
            <Text style={styles.userRoleText} numberOfLines={1}>
              {roleLabelMap[role] || role}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.sidebarLogoutBtn}
            onPress={logout}
            activeOpacity={0.7}
            accessibilityLabel={t('profile.logout', 'Выйти')}
          >
            <Icon name="log-out" color={colors.n500} size={sizes.scale(18)} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.shellLayout}>
      {isNavRail && renderNavRail()}
      {isSidebar && renderDesktopSidebar()}

      <View style={styles.mainContentArea}>
        {children}
      </View>

      {isBottomBar && renderBottomTabBar()}
    </View>
  );
}

const themeStyles = (theme) => ({
  shellLayout: {
    flex: 1,
    flexDirection: theme.responsive?.navigationMode === 'bottomBar' ? 'column' : 'row',
    backgroundColor: theme.colors.bg,
  },
  mainContentArea: {
    flex: 1,
    height: '100%',
    backgroundColor: theme.colors.bg,
    overflow: 'hidden',
  },

  // --- Bottom Tab Bar Styles ---
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.n300,
    paddingBottom: theme.sizes.spacing.xl,
    paddingTop: theme.sizes.spacing.s,
  },
  bottomTabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomTabText: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n700,
    marginTop: theme.sizes.spacing.xs,
  },
  bottomTabTextFocused: {
    color: theme.colors.p500,
    fontFamily: 'Manrope_600SemiBold',
  },

  // --- Navigation Rail Styles (Tablet Landscape) ---
  navRailContainer: {
    width: 84,
    height: '100%',
    backgroundColor: theme.colors.white,
    borderRightWidth: 1,
    borderRightColor: theme.colors.n300,
    alignItems: 'center',
    paddingVertical: theme.sizes.spacing.m,
    zIndex: 10,
  },
  railTopBrand: {
    marginBottom: (theme.responsive?.height && theme.responsive.height < 640) ? theme.sizes.spacing.s : theme.sizes.spacing.l,
    alignItems: 'center',
    flexShrink: 0,
  },
  railBrandLogo: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: theme.colors.p500,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.p500,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  railNavScroll: {
    flex: 1,
    minHeight: 0,
    width: '100%',
  },
  railNavItems: {
    width: '100%',
    alignItems: 'center',
    gap: (theme.responsive?.height && theme.responsive.height < 640) ? 4 : theme.sizes.spacing.s,
    paddingBottom: theme.sizes.spacing.s,
  },
  railItem: {
    width: 68,
    paddingVertical: (theme.responsive?.height && theme.responsive.height < 640) ? 6 : theme.sizes.spacing.s,
    alignItems: 'center',
    borderRadius: theme.sizes.borderRadius.medium,
    marginVertical: 1,
  },
  railItemActive: {
    backgroundColor: theme.colors.p100,
  },
  railItemText: {
    ...theme.sizes.typography.caption,
    fontSize: 10,
    lineHeight: 12,
    color: theme.colors.n500,
    marginTop: 4,
    textAlign: 'center',
  },
  railItemTextActive: {
    color: theme.colors.p500,
    fontFamily: 'Manrope_600SemiBold',
  },
  railBottomAction: {
    marginTop: theme.sizes.spacing.xs,
    alignItems: 'center',
    flexShrink: 0,
  },
  railLogoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.n100,
  },

  // --- Desktop Sidebar Styles (Laptop / Desktop / Ultrawide) ---
  sidebarContainer: {
    width: 250,
    height: '100%',
    backgroundColor: theme.colors.white,
    borderRightWidth: 1,
    borderRightColor: theme.colors.n300,
    paddingHorizontal: theme.sizes.spacing.m,
    paddingVertical: (theme.responsive?.height && theme.responsive.height < 640) ? theme.sizes.spacing.m : theme.sizes.spacing.l,
    flexDirection: 'column',
    zIndex: 10,
  },
  sidebarBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.sizes.spacing.xs,
    marginBottom: (theme.responsive?.height && theme.responsive.height < 640) ? theme.sizes.spacing.m : theme.sizes.spacing.xl,
    flexShrink: 0,
  },
  brandIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: theme.colors.p500,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.sizes.spacing.s,
    shadowColor: theme.colors.p500,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  brandTextCol: {
    justifyContent: 'center',
  },
  brandTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 20,
    lineHeight: 24,
    color: theme.colors.n900,
    letterSpacing: -0.3,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.p100,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
  },
  roleBadgeText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 10,
    lineHeight: 12,
    color: theme.colors.p500,
  },
  sidebarNavScroll: {
    flex: 1,
    minHeight: 0,
  },
  sidebarNavList: {
    gap: (theme.responsive?.height && theme.responsive.height < 640) ? 4 : 6,
    paddingBottom: theme.sizes.spacing.s,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: (theme.responsive?.height && theme.responsive.height < 640) ? 9 : 12,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  sidebarItemActive: {
    backgroundColor: theme.colors.p100,
  },
  sidebarItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sidebarItemText: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 14,
    color: theme.colors.n700,
  },
  sidebarItemTextActive: {
    fontFamily: 'Manrope_600SemiBold',
    color: theme.colors.p500,
  },
  sidebarBadgePill: {
    backgroundColor: theme.colors.danger,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  sidebarBadgeText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    color: theme.colors.white,
  },

  // --- Sidebar User Footer ---
  sidebarFooter: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.n200,
    paddingTop: (theme.responsive?.height && theme.responsive.height < 640) ? theme.sizes.spacing.s : theme.sizes.spacing.m,
    flexShrink: 0,
    backgroundColor: theme.colors.white,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    backgroundColor: theme.colors.n100,
  },
  userAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.p500,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  userAvatarInitials: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
    color: theme.colors.white,
  },
  userInfoCol: {
    flex: 1,
    marginRight: 6,
  },
  userNameText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 13,
    color: theme.colors.n900,
  },
  userRoleText: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 11,
    color: theme.colors.n500,
  },
  sidebarLogoutBtn: {
    padding: 6,
    borderRadius: 8,
  },
});
