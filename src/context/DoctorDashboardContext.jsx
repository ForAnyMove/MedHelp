import React, { createContext, useContext, useState } from 'react';
import { LayoutAnimation, Platform, UIManager } from 'react-native';
import { useDashboardNavigator } from '../hooks/useDashboardNavigator';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const DoctorDashboardContext = createContext();

export function DoctorDashboardProvider({ children, initialTab = 'home' }) {
  // ── Shared navigation (currentView, tabIndex, scrollViewRef, etc.) ──
  const tabIndexMap = { home: 0, balance: 1, consultation: 2, history: 3, profile: 4 };
  const initialIndex = tabIndexMap[initialTab] !== undefined ? tabIndexMap[initialTab] : 0;
  
  const nav = useDashboardNavigator('dashboard', initialIndex);

  // ── Doctor-specific state ──────────────────────────────────────────
  const [balanceView, setBalanceView] = useState('dashboard'); // 'dashboard' | 'request-payout' | 'full-history'
  const [consultationStatus, setConsultationStatus] = useState('idle'); // 'idle' | 'ongoing' | 'summary'
  const [selectedConsultation, setSelectedConsultation] = useState(null);

  const [isSummarySaved, setIsSummarySaved] = useState(false);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [pendingTabIndex, setPendingTabIndex] = useState(null);

  // ── Derived ───────────────────────────────────────────────────────
  /**
   * Swipe between tabs is allowed only when no sub-view is active.
   * Exposed via context so (doctor)/index.jsx reads it from here.
   */
  const isSwipeEnabled =
    (nav.currentView === 'dashboard' || consultationStatus === 'ongoing') &&
    balanceView === 'dashboard';

  // ── Navigation helpers ────────────────────────────────────────────

  const navigateToPatientCard = (consultation) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedConsultation(consultation);
    nav.setCurrentView('patient-card');
    nav.setTabIndex(2); // Consultation tab
  };

  const navigateToPatientDetails = () => {
    nav.navigateTo('patient-details');
  };

  const navigateToRequestPayout = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setBalanceView('request-payout');
  };

  const navigateToFullHistory = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setBalanceView('full-history');
  };

  const navigateBack = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (nav.tabIndex === 1) {
      // Balance tab — pop balance sub-view
      if (balanceView !== 'dashboard') {
        setBalanceView('dashboard');
      }
    } else {
      if (nav.currentView === 'patient-details') {
        nav.setCurrentView('patient-card');
      } else {
        nav.resetToMain();
        setSelectedConsultation(null);
      }
    }
  };

  const resetViews = () => {
    nav.resetToMain();
    setBalanceView('dashboard');
    if (consultationStatus !== 'ongoing' && consultationStatus !== 'summary') {
      setSelectedConsultation(null);
    }
  };

  // ── Consultation lifecycle ────────────────────────────────────────

  const startConsultation = () => setConsultationStatus('ongoing');

  const endConsultation = () => {
    setConsultationStatus('summary');
    setIsSummarySaved(false);
  };

  const saveSummary = async () => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSummarySaved(true);
  };

  const closeSummary = () => {
    setConsultationStatus('idle');
    setIsSummarySaved(false);
    resetViews();
  };

  // ── Tab switch guard (unsaved summary) ───────────────────────────

  const handleTabSwitchRequest = (i) => {
    if (nav.tabIndex === i) {
      if (consultationStatus === 'summary') {
        if (!isSummarySaved) {
          setPendingTabIndex(i);
          setShowExitConfirmation(true);
          return;
        } else {
          setConsultationStatus('idle');
          setIsSummarySaved(false);
          setSelectedConsultation(null);
        }
      }
      resetViews();
      return;
    }

    if (consultationStatus === 'summary') {
      if (!isSummarySaved) {
        setPendingTabIndex(i);
        setShowExitConfirmation(true);
        return;
      } else {
        setConsultationStatus('idle');
        setIsSummarySaved(false);
        setSelectedConsultation(null);
      }
    }

    resetViews();
    nav.setTabIndex(i);
  };

  const confirmExitSummary = () => {
    setShowExitConfirmation(false);
    setConsultationStatus('idle');
    setIsSummarySaved(false);
    resetViews();
    if (pendingTabIndex !== null) {
      nav.setTabIndex(pendingTabIndex);
      setPendingTabIndex(null);
    }
  };

  const cancelExitSummary = () => {
    setShowExitConfirmation(false);
    setPendingTabIndex(null);
  };

  return (
    <DoctorDashboardContext.Provider
      value={{
        // Navigation (from shared hook)
        currentView: nav.currentView,
        tabIndex: nav.tabIndex,
        scrollViewRef: nav.scrollViewRef,
        setTabIndex: nav.setTabIndex,
        scrollToTop: nav.scrollToTop,
        // Doctor-specific
        balanceView,
        consultationStatus,
        selectedConsultation,
        isSummarySaved,
        showExitConfirmation,
        isSwipeEnabled,
        // Navigation actions
        navigateToPatientCard,
        navigateToPatientDetails,
        navigateToRequestPayout,
        navigateToFullHistory,
        navigateBack,
        resetViews,
        // Consultation
        startConsultation,
        endConsultation,
        saveSummary,
        closeSummary,
        // Tab guard
        handleTabSwitchRequest,
        confirmExitSummary,
        cancelExitSummary,
      }}
    >
      {children}
    </DoctorDashboardContext.Provider>
  );
}

export function useDoctorDashboard() {
  const context = useContext(DoctorDashboardContext);
  if (!context) {
    throw new Error('useDoctorDashboard must be used within a DoctorDashboardProvider');
  }
  return context;
}
