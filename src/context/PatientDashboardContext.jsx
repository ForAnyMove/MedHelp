import React, { createContext, useContext, useState } from 'react';
import { LayoutAnimation, Platform, UIManager } from 'react-native';
import { useDashboardNavigator } from '../hooks/useDashboardNavigator';

// Enable layout animation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const PatientDashboardContext = createContext();

export function PatientDashboardProvider({ children, initialTab = 'home' }) {
  // ── Shared navigation ──────────────────────────────────────────────
  const tabIndexMap = { home: 0, doctors: 1, consultation: 2, history: 3, profile: 4 };
  const initialIndex = tabIndexMap[initialTab] !== undefined ? tabIndexMap[initialTab] : 0;
  
  const nav = useDashboardNavigator('dashboard', initialIndex);

  // ── Patient-specific state ─────────────────────────────────────────
  const [consultationView, setConsultationView] = useState('main'); // 'main' | 'summary'
  const [selectedSummaryBooking, setSelectedSummaryBooking] = useState(null);
  const [isConsultationDetailsVisible, setIsConsultationDetailsVisible] = useState(false);

  // ── Derived ────────────────────────────────────────────────────────
  /**
   * Swipe is allowed only when no sub-view or detail overlay is open.
   * Exposed via context so (patient)/index.jsx reads it from here.
   * Note: doctorController.currentDoctorView check stays in the tab
   *       wrapper since it comes from GlobalContext (different tree).
   */
  const isSwipeEnabled =
    nav.currentView === 'dashboard' &&
    consultationView === 'main' &&
    !isConsultationDetailsVisible;

  // ── Navigation helpers ─────────────────────────────────────────────

  const navigateToUpload = () => nav.navigateTo('upload');
  const navigateToDashboard = () => nav.resetToMain();
  const navigateToSymptomChecker = () => nav.navigateTo('symptom-checker');
  const navigateToDoctors = () => nav.setTabIndex(1);

  const navigateToConsultationSummary = (booking) => {
    setSelectedSummaryBooking(booking);
    setConsultationView('summary');
    nav.setTabIndex(2);
  };

  const navigateToConsultationMain = () => {
    setConsultationView('main');
    setSelectedSummaryBooking(null);
  };

  return (
    <PatientDashboardContext.Provider
      value={{
        // Navigation (from shared hook)
        currentView: nav.currentView,
        tabIndex: nav.tabIndex,
        setTabIndex: nav.setTabIndex,
        scrollViewRef: nav.scrollViewRef,
        scrollToTop: nav.scrollToTop,
        // Patient-specific
        consultationView,
        selectedSummaryBooking,
        isConsultationDetailsVisible,
        setIsConsultationDetailsVisible,
        isSwipeEnabled,
        // Navigation actions
        navigateToUpload,
        navigateToDashboard,
        navigateToSymptomChecker,
        navigateToDoctors,
        navigateToConsultationSummary,
        navigateToConsultationMain,
      }}
    >
      {children}
    </PatientDashboardContext.Provider>
  );
}

export function usePatientDashboard() {
  return useContext(PatientDashboardContext);
}
