import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import { TabView, SceneMap } from 'react-native-tab-view';
import { useTranslation } from 'react-i18next';
import { Screen } from '../../src/components/ui/Screen';
import { Icon } from '../../src/components/ui/Icon';
import { useStyles } from '../../src/theme/useStyles';
import { HomeDashboard } from '../../src/screens/patient/HomeDashboard';
import { UploadAnalysis } from '../../src/screens/patient/UploadAnalysis';
import { PatientDashboardProvider, usePatientDashboard } from '../../src/context/PatientDashboardContext';

const HomeRouteWrapper = () => {
  return <HomeDashboard />;
};

const DoctorsRoute = () => <Screen><Text>Doctors</Text></Screen>;
const ConsultationRoute = () => <Screen><Text>Consultation</Text></Screen>;
const HistoryRoute = () => <Screen><Text>History</Text></Screen>;
const ProfileRoute = () => <Screen><Text>Profile</Text></Screen>;

const renderScene = SceneMap({
  home: HomeRouteWrapper,
  doctors: DoctorsRoute,
  consultation: ConsultationRoute,
  history: HistoryRoute,
  profile: ProfileRoute,
});

function PatientTabs() {
  const layout = useWindowDimensions();
  const styles = useStyles(tabStyles);
  const { t } = useTranslation();
  const { currentView, navigateToDashboard, scrollToTop } = usePatientDashboard();
  
  const [index, setIndex] = useState(0);
  
  const routes = useMemo(() => [
    { key: 'home', title: t('patient_tabs.home'), icon: 'Home' },
    { key: 'doctors', title: t('patient_tabs.doctors'), icon: 'Briefcase' },
    { key: 'consultation', title: t('patient_tabs.consultation'), icon: 'Video' },
    { key: 'history', title: t('patient_tabs.history'), icon: 'Clock' },
    { key: 'profile', title: t('patient_tabs.profile'), icon: 'User' },
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
              activeOpacity={0.7}
              onPress={() => {
                if (index === i) {
                   if (route.key === 'home') {
                     if (currentView !== 'dashboard') {
                       navigateToDashboard();
                     } else {
                       scrollToTop();
                     }
                   }
                } else {
                   if (currentView !== 'dashboard') {
                     navigateToDashboard();
                   }
                   setIndex(i);
                }
              }}
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
    <Screen style={styles.container}>
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        renderTabBar={renderTabBar}
        onIndexChange={(i) => {
           if (currentView !== 'dashboard') {
             navigateToDashboard();
           }
           setIndex(i);
        }}
        initialLayout={{ width: layout.width }}
        swipeEnabled={currentView === 'dashboard'}
        tabBarPosition="bottom"
      />
    </Screen>
  );
}

export default function PatientTabsWithProvider() {
  return (
    <PatientDashboardProvider>
      <PatientTabs />
    </PatientDashboardProvider>
  );
}

const tabStyles = (theme) => ({
  container: {
    paddingHorizontal: 0, 
  },
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
