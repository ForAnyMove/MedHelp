import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import { TabView, SceneMap } from 'react-native-tab-view';
import { useTranslation } from 'react-i18next';
import { Screen } from '../../src/components/ui/Screen';
import { Icon } from '../../src/components/ui/Icon';
import { useStyles } from '../../src/theme/useStyles';
import { NotificationBadge } from '../../src/components/common/NotificationBadge';
import { HomeTab } from '../../src/screens/patient/home/HomeTab';
import { PatientDashboardProvider, usePatientDashboard } from '../../src/context/PatientDashboardContext';
import { useComponentContext } from '../../src/context/GlobalContext';
import { DoctorsTab } from '../../src/screens/patient/doctors/DoctorsTab';
import { ConsultationTab } from '../../src/screens/patient/consultation/ConsultationTab';
import { HistoryTab } from '../../src/screens/patient/history/HistoryTab';
import { ProfileTab } from '../../src/screens/universal/profile/ProfileTab';

const HomeRouteWrapper = () => {
  return <HomeTab />;
};

const DoctorsRoute = () => <DoctorsTab />;
const ConsultationRoute = () => <ConsultationTab />;
const HistoryRoute = () => <HistoryTab />;
const ProfileRoute = () => <ProfileTab role="patient" />;

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
  const { 
    currentView,
    isSwipeEnabled: baseSwipeEnabled,
    consultationView,
    isConsultationDetailsVisible,
    navigateToDashboard, 
    scrollToTop, 
    tabIndex: index, 
    setTabIndex: setIndex,
    navigateToConsultationMain 
  } = usePatientDashboard();

  const { doctorController } = useComponentContext();

  // Also block swipe if the doctor-search inner view is active (GlobalContext)
  const isSwipeEnabled = baseSwipeEnabled && doctorController.currentDoctorView === 'main';
  
  const routes = useMemo(() => [
    { key: 'home', title: t('patient_tabs.home'), icon: 'Home' },
    { key: 'doctors', title: t('patient_tabs.doctors'), icon: 'Briefcase' },
    { key: 'consultation', title: t('patient_tabs.consultation'), icon: 'Stethoscope' },
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
                   } else if (route.key === 'consultation') {
                     navigateToConsultationMain();
                   }
                } else {
                   // When switching tabs, reset sub-views if any
                   if (currentView !== 'dashboard') {
                     navigateToDashboard();
                   }
                   navigateToConsultationMain();
                   setIndex(i);
                }
              }}
            >
              <View>
                <Icon 
                  name={route.icon} 
                  color={isFocused ? styles.focusedIcon.color : styles.unfocusedIcon.color} 
                  size={24}
                />
                {route.key === 'history' && <NotificationBadge count={2} />}
                {route.key === 'consultation' && <NotificationBadge count={1} />}
              </View>
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
        swipeEnabled={isSwipeEnabled}
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
