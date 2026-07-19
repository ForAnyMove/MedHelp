import React, { createContext, useContext, useState } from 'react';
import { LayoutAnimation, Platform, UIManager } from 'react-native';
import { router } from 'expo-router';
import { useDashboardNavigator } from '../hooks/useDashboardNavigator';

// Enable layout animation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const PatientDashboardContext = createContext();

export function PatientDashboardProvider({ children, initialTab = 'home' }) {
  // ── Shared navigation ──────────────────────────────────────────────
  const indexToTab = ['home', 'doctors', 'consultation', 'history', 'profile'];
  const tabIndexMap = { home: 0, doctors: 1, consultation: 2, history: 3, profile: 4 };
  const initialIndex = tabIndexMap[initialTab] !== undefined ? tabIndexMap[initialTab] : 0;
  
  const nav = useDashboardNavigator('dashboard', initialIndex);

  const updateUrlParams = (tabName, view, id, filter) => {
    if (typeof window !== 'undefined' && window.history) {
      const searchParams = new URLSearchParams();
      if (view) searchParams.set('view', view);
      if (id) searchParams.set('id', id);
      if (filter) searchParams.set('filter', filter);
      
      const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
      const newUrl = `/${tabName}${queryString}`;
      window.history.pushState(window.history.state, '', newUrl);
    }
  };

  const syncStateFromUrl = (searchParams, tabName) => {
    const view = searchParams.get('view');
    const id = searchParams.get('id');
    const filter = searchParams.get('filter');

    if (tabName === 'home') {
      if (view === 'symptom-checker') {
        setSymptomCheckerProps(null);
        nav.setCurrentView('symptom-checker');
      } else if (view === 'upload') {
        nav.setCurrentView('upload');
      } else {
        nav.setCurrentView('dashboard');
      }
    } else if (tabName === 'consultation') {
      if (view === 'summary') {
        setConsultationView('summary');
        if (id) setSelectedSummaryBooking({ id });
      } else if (view === 'detail') {
        setConsultationView('detail');
        if (id) setSelectedSummaryBooking({ id });
      } else if (view === 'active') {
        setConsultationView('active');
        if (id) setSelectedSummaryBooking({ id });
      } else if (view === 'rate') {
        setConsultationView('rate');
        if (id) setSelectedSummaryBooking({ id });
      } else if (view === 'completed') {
        setConsultationView('completed');
        if (id) setSelectedSummaryBooking({ id });
      } else {
        setConsultationView('main');
        setSelectedSummaryBooking(null);
      }
    } else if (tabName === 'history') {
      if (view === 'all') {
        setHistoryView('all');
        // We do not set the local state for filter here as the component might handle it, 
        // but we ensure the view is active.
      } else if (view === 'detail') {
        setHistoryView('detail');
        setHistorySelectedId(id);
      } else if (view === 'summary') {
        setHistoryView('summary');
        setHistorySelectedId(id);
      } else if (view === 'doctor-profile') {
        setHistoryView('doctor-profile');
        setHistoryDoctorProfileId(id);
      } else {
        setHistoryView('dashboard');
        setHistorySelectedId(null);
        setHistoryDoctorProfileId(null);
      }
    }
  };

  // ── Patient-specific state ─────────────────────────────────────────
  const [consultationView, setConsultationView] = useState('main'); // 'main' | 'summary'
  const [selectedSummaryBooking, setSelectedSummaryBooking] = useState(null);
  const [isConsultationDetailsVisible, setIsConsultationDetailsVisible] = useState(false);
  const [historyView, setHistoryView] = useState('dashboard'); // 'dashboard' | 'all' | 'detail' | 'doctor-profile'
  const [historySelectedId, setHistorySelectedId] = useState(null);
  const [historyDoctorProfileId, setHistoryDoctorProfileId] = useState(null);
  const [symptomCheckerProps, setSymptomCheckerProps] = useState(null);

  // ── Derived ────────────────────────────────────────────────────────
  /**
   * Swipe is allowed only when no sub-view or detail overlay is open.
   * Exposed via context so (patient)/index.jsx reads it from here.
   * Note: doctorController.currentDoctorView check stays in the tab
   *       wrapper since it comes from GlobalContext (different tree).
   */
  const isSwipeEnabled =
    nav.currentView === 'dashboard' &&
    (nav.tabIndex === 2 ? (consultationView === 'main' && !isConsultationDetailsVisible) : true) &&
    (nav.tabIndex === 3 ? historyView === 'dashboard' : true);

  // ── Navigation helpers ─────────────────────────────────────────────

  const navigateToUpload = () => {
    nav.navigateTo('upload');
    updateUrlParams('home', 'upload');
  };
  const navigateToDashboard = () => {
    setHistoryView('dashboard');
    setConsultationView('main');
    nav.resetToMain();
    nav.setTabIndex(0);
    updateUrlParams('home');
  };
  const navigateToSymptomChecker = () => {
    setSymptomCheckerProps(null);
    nav.navigateTo('symptom-checker');
    updateUrlParams('home', 'symptom-checker');
  };
  const navigateToSymptomCheckerResult = (checkupData) => {
    setSymptomCheckerProps({ step: 6, resultData: checkupData });
    nav.navigateTo('symptom-checker');
    updateUrlParams('home', 'symptom-checker');
  };
  const navigateToDoctors = () => {
    nav.setTabIndex(1);
    updateUrlParams('doctors');
  };
  const navigateToConsultation = () => {
    nav.setTabIndex(2);
    updateUrlParams('consultation');
  };
  const navigateToHistory = () => {
    setHistoryView('dashboard');
    nav.setTabIndex(3);
    updateUrlParams('history');
  };

  const navigateToConsultationSummary = (booking) => {
    setSelectedSummaryBooking(booking);
    setConsultationView('summary');
    nav.setTabIndex(2);
    updateUrlParams('consultation', 'summary', booking?.id);
  };

  const navigateToConsultationDetail = (booking) => {
    setSelectedSummaryBooking(booking);
    setConsultationView('detail');
    nav.setTabIndex(2);
    updateUrlParams('consultation', 'detail', booking?.id);
  };

  const navigateToActiveConsultation = (booking) => {
    setSelectedSummaryBooking(booking);
    setConsultationView('active');
    nav.setTabIndex(2);
    updateUrlParams('consultation', 'active', booking?.id);
  };

  const navigateToConsultationRate = (booking) => {
    setSelectedSummaryBooking(booking);
    setConsultationView('rate');
    nav.setTabIndex(2);
    updateUrlParams('consultation', 'rate', booking?.id);
  };

  const navigateToConsultationCompleted = (booking) => {
    setSelectedSummaryBooking(booking);
    setConsultationView('completed');
    nav.setTabIndex(2);
    updateUrlParams('consultation', 'completed', booking?.id);
  };

  const navigateToConsultationMain = () => {
    setConsultationView('main');
    setSelectedSummaryBooking(null);
    updateUrlParams('consultation', 'main');
  };

  const navigateToHistoryAll = (filterParam) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setHistoryView('all');
    nav.setTabIndex(3);
    updateUrlParams('history', 'all', '', filterParam || 'All');
  };

  const navigateToHistoryDetail = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setHistorySelectedId(id);
    setHistoryView('detail');
    nav.setTabIndex(3);
    updateUrlParams('history', 'detail', id);
  };

  const navigateToHistorySummary = (id) => {
    setHistorySelectedId(id);
    setHistoryView('summary');
    nav.setTabIndex(3);
    updateUrlParams('history', 'summary', id);
  };

  const navigateToHistoryDoctorProfile = (doctorId) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setHistoryDoctorProfileId(doctorId);
    setHistoryView('doctor-profile');
    nav.setTabIndex(3);
    updateUrlParams('history', 'doctor-profile', doctorId);
  };

  const navigateBack = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (nav.tabIndex === 3) {
      if (historyView === 'doctor-profile') {
        if (historySelectedId) {
          setHistoryView('detail');
          updateUrlParams('history', 'detail', historySelectedId);
        } else {
          setHistoryView('dashboard');
          updateUrlParams('history');
        }
      } else if (historyView === 'detail') {
        setHistoryView('all');
        updateUrlParams('history', 'all');
      } else if (historyView === 'all' || historyView === 'summary') {
        setHistoryView('dashboard');
        updateUrlParams('history');
      }
    } else {
      if (nav.currentView !== 'dashboard') {
        nav.resetToMain();
        updateUrlParams(indexToTab[nav.tabIndex]);
      } else if (consultationView !== 'main') {
        setConsultationView('main');
        updateUrlParams('consultation');
      }
    }
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
        historyView,
        historySelectedId,
        historyDoctorProfileId,
        symptomCheckerProps,
        setSymptomCheckerProps,
        // Navigation actions
        navigateToUpload,
        navigateToDashboard,
        navigateToSymptomChecker,
        navigateToSymptomCheckerResult,
        navigateToDoctors,
        navigateToConsultation,
        navigateToConsultationSummary,
        navigateToConsultationMain,
        navigateToConsultationDetail,
        navigateToActiveConsultation,
        navigateToConsultationRate,
        navigateToConsultationCompleted,
        navigateToHistory,
        navigateToHistoryAll,
        navigateToHistoryDetail,
        navigateToHistorySummary,
        navigateToHistoryDoctorProfile,
        navigateBack,
        syncStateFromUrl,
        updateUrlParams,
      }}
    >
      {children}
    </PatientDashboardContext.Provider>
  );
}

export function usePatientDashboard() {
  return useContext(PatientDashboardContext);
}
