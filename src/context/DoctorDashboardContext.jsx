import React, { createContext, useContext, useState } from 'react';
import { LayoutAnimation, Platform, UIManager } from 'react-native';
import { router } from 'expo-router';
import { useDashboardNavigator } from '../hooks/useDashboardNavigator';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const DoctorDashboardContext = createContext();

export function DoctorDashboardProvider({ children, initialTab = 'home' }) {
  // ── Shared navigation (currentView, tabIndex, scrollViewRef, etc.) ──
  const indexToTab = ['home', 'balance', 'consultation', 'history', 'profile'];
  const tabIndexMap = { home: 0, balance: 1, consultation: 2, history: 3, profile: 4 };
  const initialIndex = tabIndexMap[initialTab] !== undefined ? tabIndexMap[initialTab] : 0;
  
  const nav = useDashboardNavigator('dashboard', initialIndex);

  const updateUrlParams = (tabName, view, id, filter, returnTabStr) => {
    if (typeof window !== 'undefined' && window.history) {
      const searchParams = new URLSearchParams();
      if (view) searchParams.set('view', view);
      if (id) searchParams.set('id', id);
      if (filter) searchParams.set('filter', filter);
      if (returnTabStr) searchParams.set('returnTab', returnTabStr);
      
      const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
      const newUrl = `/${tabName}${queryString}`;
      window.history.pushState(window.history.state, '', newUrl);
    }
  };

  const syncStateFromUrl = (searchParams, tabName) => {
    const view = searchParams.get('view');
    const id = searchParams.get('id');
    const filter = searchParams.get('filter');
    const returnTabStr = searchParams.get('returnTab');

    if (returnTabStr) {
      setReturnToTab(returnTabStr);
    }

    if (tabName === 'balance') {
      if (view === 'request-payout') {
        setBalanceView('request-payout');
      } else if (view === 'full-history') {
        setBalanceView('full-history');
      } else {
        setBalanceView('dashboard');
      }
    } else if (tabName === 'consultation') {
      if (view === 'patient-card') {
        setConsultationStatus('idle');
        nav.setCurrentView('patient-card');
        if (id) setSelectedConsultation({ id });
      } else if (view === 'patient-details') {
        setConsultationStatus('idle');
        nav.setCurrentView('patient-details');
        if (id) setSelectedConsultation({ id });
      } else if (view === 'summary') {
        setConsultationStatus('summary');
        if (id) setSelectedConsultation({ id });
      } else if (view === 'form') {
        setConsultationStatus('form');
        if (id) setSelectedConsultation({ id });
      } else {
        setConsultationStatus('idle');
        nav.setCurrentView('dashboard');
        setSelectedConsultation(null);
      }
    } else if (tabName === 'history') {
      if (view === 'all') {
        setHistoryView('all');
      } else if (view === 'detail') {
        setHistoryView('detail');
        setHistorySelectedId(id);
      } else if (view === 'patient-profile') {
        setHistoryView('patient-profile');
        setHistoryPatientProfileId(id);
      } else if (view === 'ratings') {
        setHistoryView('ratings');
      } else {
        setHistoryView('dashboard');
        setHistorySelectedId(null);
        setHistoryPatientProfileId(null);
      }
    }
  };

  // ── Doctor-specific state ──────────────────────────────────────────
  const [balanceView, setBalanceView] = useState('dashboard'); // 'dashboard' | 'request-payout' | 'full-history'
  const [consultationStatus, setConsultationStatus] = useState('idle'); // 'idle' | 'ongoing' | 'summary'
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [returnToTab, setReturnToTab] = useState(null);

  const [isSummarySaved, setIsSummarySaved] = useState(false);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [pendingTabIndex, setPendingTabIndex] = useState(null);
  const [isAvailabilityModalVisible, setIsAvailabilityModalVisible] = useState(false);

  const [historyView, setHistoryView] = useState('dashboard'); // 'dashboard' | 'all' | 'detail' | 'ratings' | 'patient-profile'
  const [historySelectedId, setHistorySelectedId] = useState(null);
  const [historyPatientProfileId, setHistoryPatientProfileId] = useState(null);

  // ── Derived ───────────────────────────────────────────────────────
  /**
   * Swipe between tabs is allowed only when no sub-view is active.
   * Exposed via context so (doctor)/index.jsx reads it from here.
   */
  const isSwipeEnabled =
    (nav.currentView === 'dashboard' || consultationStatus === 'ongoing') &&
    (nav.tabIndex === 1 ? balanceView === 'dashboard' : true) &&
    (nav.tabIndex === 3 ? historyView === 'dashboard' : true);

  // ── Navigation helpers ────────────────────────────────────────────

  const navigateToPatientCard = (consultation) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedConsultation(consultation);
    nav.setCurrentView('patient-card');
    nav.setTabIndex(2);
    updateUrlParams('consultation', 'patient-card', consultation?.id);
  };

  const navigateToPatientDetails = () => {
    nav.navigateTo('patient-details');
    updateUrlParams('consultation', 'patient-details', selectedConsultation?.id);
  };

  const navigateToRequestPayout = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setBalanceView('request-payout');
    updateUrlParams('balance', 'request-payout');
  };

  const navigateToFullHistory = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setBalanceView('full-history');
    updateUrlParams('balance', 'full-history');
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

  const navigateToHistoryPatientProfile = (patientId) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setHistoryPatientProfileId(patientId);
    setHistoryView('patient-profile');
    nav.setTabIndex(3);
    updateUrlParams('history', 'patient-profile', patientId);
  };

  const navigateToHistoryRatings = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setHistoryView('ratings');
    nav.setTabIndex(3);
    updateUrlParams('history', 'ratings');
  };

  const navigateBack = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (nav.tabIndex === 1) {
      // Balance tab — pop balance sub-view
      if (balanceView !== 'dashboard') {
        setBalanceView('dashboard');
        updateUrlParams('balance');
      }
    } else if (nav.tabIndex === 3) {
      if (historyView === 'patient-profile') {
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
      } else if (historyView === 'all' || historyView === 'ratings') {
        setHistoryView('dashboard');
        updateUrlParams('history');
      }
    } else {
      if (nav.currentView === 'patient-details') {
        nav.setCurrentView('patient-card');
        updateUrlParams('consultation', 'patient-card', selectedConsultation?.id);
      } else if (nav.currentView !== 'dashboard') {
        nav.resetToMain();
        setSelectedConsultation(null);
        updateUrlParams(indexToTab[nav.tabIndex]);
      }
    }
  };

  const resetViews = () => {
    nav.resetToMain();
    setBalanceView('dashboard');
    setHistoryView('dashboard');
    setReturnToTab(null);
    if (consultationStatus !== 'ongoing' && consultationStatus !== 'summary') {
      setSelectedConsultation(null);
    }
  };

  // ── Consultation lifecycle ────────────────────────────────────────

  const startConsultation = async () => {
    setConsultationStatus('ongoing');
    if (selectedConsultation?.id) {
      try {
        const { createApiClient } = require('../api/apiClient');
        const { createConsultationsApi } = require('../api/consultationsApi');
        const { useSession } = require('./SessionContext');
        // This is a little hacky but we don't have global session here easily. 
        // Actually, we can just let consultationManager handle this, or fire and forget
        // but we need session tokens. Let's just do a fetch directly or better use context if available.
        // The cleaner way: we can just have consultationManager do the update if we pass it, but context is decoupled.
        // Let's use the API with null session and hope the interceptor or something handles it if we can't get it, 
        // wait we can't call hooks here. We'll leave the API call to the UI component PatientCard.
      } catch (err) {}
    }
  };

  const endConsultation = () => {
    setConsultationStatus('form'); // goes to form first
    setIsSummarySaved(false);
  };

  const goToSummary = () => {
    setConsultationStatus('summary');
    updateUrlParams('consultation', 'summary', selectedConsultation?.id);
  };

  const goToForm = () => {
    setConsultationStatus('form');
    updateUrlParams('consultation', 'form', selectedConsultation?.id);
  };

  const saveSummary = async () => {
    // API logic should be handled by the component, we just update state
    setIsSummarySaved(true);
  };

  const closeSummary = () => {
    setConsultationStatus('idle');
    setIsSummarySaved(false);
    resetViews();
    updateUrlParams(indexToTab[nav.tabIndex]);
  };

  /**
   * Called when user presses Back/Cancel from the Form or Summary screen.
   * Returns to patient-card if one is selected, otherwise resets to main dashboard.
   */
  const backFromForm = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setConsultationStatus('idle');
    setIsSummarySaved(false);
    
    if (returnToTab === 'history') {
      nav.setTabIndex(3);
      setReturnToTab(null);
      updateUrlParams('history');
    } else if (selectedConsultation?.id) {
      nav.setCurrentView('patient-card');
      nav.setTabIndex(2);
      updateUrlParams('consultation', 'patient-card', selectedConsultation?.id);
    } else {
      resetViews();
      updateUrlParams(indexToTab[nav.tabIndex]);
    }
  };

  const openConsultationById = (id, action, returnTabStr) => {
    setSelectedConsultation({ id });
    if (returnTabStr) setReturnToTab(returnTabStr);
    
    if (action === 'form') {
      setConsultationStatus('form');
      updateUrlParams('consultation', 'form', id, null, returnTabStr);
    } else if (action === 'summary') {
      setConsultationStatus('summary');
      updateUrlParams('consultation', 'summary', id, null, returnTabStr);
    } else {
      setConsultationStatus('idle');
      nav.setCurrentView('patient-card');
      updateUrlParams('consultation', 'patient-card', id, null, returnTabStr);
    }
    nav.setTabIndex(2);
  };

  // ── Tab switch guard (unsaved summary) ───────────────────────────

  const handleTabSwitchRequest = (i) => {
    if (nav.tabIndex === i) {
      if (consultationStatus === 'summary' || consultationStatus === 'form') {
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

    if (consultationStatus === 'summary' || consultationStatus === 'form') {
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
    setIsSummarySaved(false);
    if (pendingTabIndex !== null) {
      // Exiting to another tab — full reset
      setConsultationStatus('idle');
      resetViews();
      nav.setTabIndex(pendingTabIndex);
      setPendingTabIndex(null);
    } else {
      // Exiting within consultation tab — go back to patient-card
      backFromForm();
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
        historyView,
        historySelectedId,
        historyPatientProfileId,
        // Navigation actions
        navigateToPatientCard,
        navigateToPatientDetails,
        navigateToRequestPayout,
        navigateToFullHistory,
        navigateToHistoryAll,
        navigateToHistoryDetail,
        navigateToHistoryRatings,
        navigateToHistoryPatientProfile,
        navigateBack,
        resetViews,
        // Consultation
        startConsultation,
        endConsultation,
        goToSummary,
        goToForm,
        openConsultationById,
        saveSummary,
        closeSummary,
        backFromForm,
        isAvailabilityModalVisible,
        setIsAvailabilityModalVisible,
        // Tab guard
        handleTabSwitchRequest,
        confirmExitSummary,
        cancelExitSummary,
        syncStateFromUrl,
        updateUrlParams,
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
