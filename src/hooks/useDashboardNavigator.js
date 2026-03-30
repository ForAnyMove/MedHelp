import { useState, useRef } from 'react';
import { LayoutAnimation, Platform, UIManager } from 'react-native';

// Enable LayoutAnimation on Android (safe to call multiple times)
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ANIM = LayoutAnimation.Presets.easeInEaseOut;

/**
 * Shared navigation logic for dashboard tab views.
 *
 * Provides a unified API for managing:
 *   - currentView (sub-screen within a tab)
 *   - tabIndex (active tab)
 *   - scrollViewRef (to scroll-to-top on tab re-press)
 *   - animated transitions via LayoutAnimation
 *
 * Both DoctorDashboardContext and PatientDashboardContext delegate
 * their common navigation logic here.
 *
 * @param {string} defaultView - Initial value for currentView (default: 'dashboard')
 */
export function useDashboardNavigator(defaultView = 'dashboard', initialTabIndex = 0) {
  const [currentView, setCurrentView] = useState(defaultView);
  const [tabIndex, setTabIndex] = useState(initialTabIndex);
  const scrollViewRef = useRef(null);

  /** Navigate to a named sub-view with animation */
  const navigateTo = (view) => {
    LayoutAnimation.configureNext(ANIM);
    setCurrentView(view);
  };

  /** Go back to 'dashboard' view with animation */
  const resetToMain = () => {
    LayoutAnimation.configureNext(ANIM);
    setCurrentView(defaultView);
  };

  /** Switch to a tab by index */
  const switchTab = (index) => {
    setTabIndex(index);
  };

  /** Scroll back to top of the current tab's ScrollView */
  const scrollToTop = () => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  return {
    currentView,
    setCurrentView,
    tabIndex,
    setTabIndex,
    scrollViewRef,
    navigateTo,
    resetToMain,
    switchTab,
    scrollToTop,
  };
}
