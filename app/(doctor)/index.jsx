import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import { TabView, SceneMap } from 'react-native-tab-view';
import { useTranslation } from 'react-i18next';
import { Screen } from '../../src/components/ui/Screen';
import { Icon } from '../../src/components/ui/Icon';
import { useStyles } from '../../src/theme/useStyles';

const HomeRoute = () => <Screen><Text>Doctor Home</Text></Screen>;
const BalanceRoute = () => <Screen><Text>Balance & Profit</Text></Screen>;
const ConsultationRoute = () => <Screen><Text>Consultation</Text></Screen>;
const HistoryRoute = () => <Screen><Text>Patient History</Text></Screen>;
const ProfileRoute = () => <Screen><Text>Profile</Text></Screen>;

const renderScene = SceneMap({
  home: HomeRoute,
  balance: BalanceRoute,
  consultation: ConsultationRoute,
  history: HistoryRoute,
  profile: ProfileRoute,
});

export default function DoctorTabs() {
  const layout = useWindowDimensions();
  const styles = useStyles(tabStyles);
  const { t } = useTranslation();
  
  const [index, setIndex] = useState(0);
  
  const routes = useMemo(() => [
    { key: 'home', title: t('doctor_tabs.home'), icon: 'Home' },
    { key: 'balance', title: t('doctor_tabs.balance'), icon: 'Briefcase' },
    { key: 'consultation', title: t('doctor_tabs.consultation'), icon: 'Video' },
    { key: 'history', title: t('doctor_tabs.history'), icon: 'Clock' },
    { key: 'profile', title: t('doctor_tabs.profile'), icon: 'User' },
  ], [t]);

  const renderTabBar = (props) => {
    return (
      <View style={styles.tabBar}>
        {props.navigationState.routes.map((route, i) => {
          const isFocused = index === i;
          return (
            <TouchableOpacity
              key={route.key}
              style={styles.tabItem}
              onPress={() => setIndex(i)}
            >
              <Icon 
                name={route.icon} 
                color={isFocused ? styles.focusedIcon.color : styles.unfocusedIcon.color} 
                size={24}
              />
              <Text style={[styles.tabText, isFocused && styles.tabTextFocused]}>
                {route.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <Screen>
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        renderTabBar={renderTabBar}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        swipeEnabled={true}
        tabBarPosition="bottom"
      />
    </Screen>
  );
}

const tabStyles = (theme) => ({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.n300,
    paddingBottom: theme.sizes.spacing.xl, 
    paddingTop: theme.sizes.spacing.s,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    ...theme.sizes.typography.caption,
    color: theme.colors.n500,
    marginTop: theme.sizes.spacing.xs,
  },
  tabTextFocused: {
    color: theme.colors.p500,
  },
  focusedIcon: {
    color: theme.colors.p500,
  },
  unfocusedIcon: {
    color: theme.colors.n500,
  }
});
