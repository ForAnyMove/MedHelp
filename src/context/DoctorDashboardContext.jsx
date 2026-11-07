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

  const updateUrlParams = (tabName, view, id, filter, returnTabStr, options = {}) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location && window.history) {
      const searchParams = new URLSearchParams();
      if (view && view !== 'dashboard' && view !== 'idle') searchParams.set('view', view);
      if (id) searchParams.set('id', id);
      if (filter) searchParams.set('filter', filter);
      if (returnTabStr) searchParams.set('returnTab', returnTabStr);

      if (historySelectedId && (view === 'patient-profile' || view === 'summary')) {
         searchParams.set('prevId', historySelectedId);
      }
      if (historyPreviousView) {
         searchParams.set('prevView', historyPreviousView);
      }
      
      const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
      const newUrl = `/${tabName}${queryString}`;
      if (Platform.OS === 'web') {
        const currentUrl = (window.location.pathname || '') + (window.location.search || '');
        if (currentUrl === newUrl) return;
        const currentState = (window.history.state && typeof window.history.state === 'object') ? { ...window.history.state } : {};
        const nextState = { ...currentState, customTab: tabName, customView: view || null };
        if (options.replace && typeof window.history?.replaceState === 'function') {
          window.history.replaceState(nextState, '', newUrl);
        } else if (typeof window.history?.pushState === 'function') {
          window.history.pushState(nextState, '', newUrl);
        }
        try {
          window.dispatchEvent(new Event('medhelp:urlchange'));
        } catch (e) {}
      }
    }
  };

  const syncStateFromUrl = React.useCallback((searchParams, tabName) => {
    const view = searchParams.get('view');
    const id = searchParams.get('id');
    const filter = searchParams.get('filter');
    const returnTabStr = searchParams.get('returnTab');
    const prevId = searchParams.get('prevId');
    const prevView = searchParams.get('prevView');

    if (returnTabStr) {
      setReturnToTab(returnTabStr);
    }
    if (prevId) {
      setHistorySelectedId(prevId);
    }
    if (prevView) {
      setHistoryPreviousView(prevView);
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
      const selectById = (targetId) => {
        if (!targetId) return;
        setSelectedConsultation(prev => (prev && String(prev.id) === String(targetId) ? prev : { id: targetId }));
      };
      if (view === 'ongoing') {
        setConsultationStatus('ongoing');
        selectById(id);
      } else if (view === 'patient-card') {
        setConsultationStatus('idle');
        nav.setCurrentView('patient-card');
        selectById(id);
      } else if (view === 'patient-details') {
        setConsultationStatus('idle');
        nav.setCurrentView('patient-details');
        selectById(id);
      } else if (view === 'summary') {
        setConsultationStatus('summary');
        selectById(id);
      } else if (view === 'form') {
        setConsultationStatus('form');
        selectById(id);
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
        if (id) setHistorySelectedId(id);
      } else if (view === 'patient-profile') {
        setHistoryView('patient-profile');
        if (id) setHistoryPatientProfileId(id);
      } else if (view === 'ratings') {
        setHistoryView('ratings');
      } else {
        setHistoryView('dashboard');
        setHistorySelectedId(null);
        setHistoryPatientProfileId(null);
      }
    }
  }, [nav.setCurrentView]);

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
  const [historyPreviousView, setHistoryPreviousView] = useState(null);

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

  const navigateToHistoryDetail = (id, returnTab = null) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (historyView === 'all' || historyView === 'dashboard' || historyView === 'ratings') {
      setHistoryPreviousView(historyView);
    }
    setHistorySelectedId(id);
    setHistoryView('detail');
    const newReturnTab = returnTab || returnToTab;
    if (returnTab) setReturnToTab(returnTab);
    nav.setTabIndex(3);
    updateUrlParams('history', 'detail', id, null, newReturnTab);
  };

  const navigateToHistoryPatientProfile = (patientId, returnTab = null) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (historyView && historyView !== 'patient-profile' && historyView !== 'detail') {
      setHistoryPreviousView(historyView);
    }
    setHistoryPatientProfileId(patientId);
    setHistoryView('patient-profile');
    const newReturnTab = returnTab || returnToTab;
    if (returnTab) setReturnToTab(returnTab);
    nav.setTabIndex(3);
    updateUrlParams('history', 'patient-profile', patientId, null, newReturnTab);
  };

  const navigateToHistoryRatings = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setHistoryView('ratings');
    nav.setTabIndex(3);
    updateUrlParams('history', 'ratings');
  };

  const navigateBack = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const searchParams = (Platform.OS === 'web' && typeof window !== 'undefined' && window.location)
      ? new URLSearchParams(window.location.search)
      : null;
    const webViewParam = searchParams ? searchParams.get('view') : null;
    const webPrevId = searchParams ? searchParams.get('prevId') : null;
    const webPrevView = searchParams ? searchParams.get('prevView') : null;
    const isHistoryPath = Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.pathname?.startsWith('/history');

    if (nav.tabIndex === 1) {
      // Balance tab — pop balance sub-view
      if (balanceView !== 'dashboard') {
        setBalanceView('dashboard');
        updateUrlParams('balance', null, null, null, null, { replace: true });
      }
    } else if (nav.tabIndex === 3 || isHistoryPath) {
      const effectiveHistoryView = (historyView && historyView !== 'dashboard') ? historyView : (webViewParam || 'dashboard');
      const effectiveSelectedId = historySelectedId || webPrevId;
      const effectivePrevView = historyPreviousView || webPrevView;

      if (effectiveHistoryView === 'patient-profile') {
        if (returnToTab) {
          nav.setTabIndex(indexToTab.indexOf(returnToTab));
          setReturnToTab(null);
          updateUrlParams(returnToTab, null, null, null, null, { replace: true });
          setHistoryPreviousView(null);
          return;
        }
        if (effectiveSelectedId) {
          setHistorySelectedId(effectiveSelectedId);
          setHistoryView('detail');
          updateUrlParams('history', 'detail', effectiveSelectedId, null, null, { replace: true });
        } else if (effectivePrevView === 'ratings') {
          setHistoryView('ratings');
          updateUrlParams('history', 'ratings', null, null, null, { replace: true });
        } else if (effectivePrevView === 'all') {
          setHistoryView('all');
          updateUrlParams('history', 'all', null, null, null, { replace: true });
        } else {
          setHistoryView('dashboard');
          updateUrlParams('history', null, null, null, null, { replace: true });
        }
      } else if (effectiveHistoryView === 'detail') {
        if (returnToTab) {
          nav.setTabIndex(indexToTab.indexOf(returnToTab));
          setReturnToTab(null);
          updateUrlParams(returnToTab, null, null, null, null, { replace: true });
          return;
        }
        const targetAfterDetail = (effectivePrevView && effectivePrevView !== 'detail' && effectivePrevView !== 'patient-profile')
          ? effectivePrevView
          : 'all';
        setHistoryView(targetAfterDetail);
        updateUrlParams('history', targetAfterDetail === 'dashboard' ? null : targetAfterDetail, null, null, null, { replace: true });
      } else if (effectiveHistoryView === 'all' || effectiveHistoryView === 'ratings') {
        setHistoryView('dashboard');
        updateUrlParams('history', null, null, null, null, { replace: true });
      }
    } else {
      if (nav.currentView === 'patient-details') {
        nav.setCurrentView('patient-card');
        updateUrlParams('consultation', 'patient-card', selectedConsultation?.id, null, null, { replace: true });
      } else if (nav.currentView !== 'dashboard') {
        nav.resetToMain();
        setSelectedConsultation(null);
        updateUrlParams(indexToTab[nav.tabIndex], null, null, null, null, { replace: true });
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

  const startConsultation = async (consultationArg) => {
    const resolved = consultationArg || selectedConsultation;
    if (consultationArg) {
      setSelectedConsultation(consultationArg);
    }
    setConsultationStatus('ongoing');
    nav.setTabIndex(2);
    const urlId = resolved?.id || (Platform.OS === 'web' && typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('id') : null);
    updateUrlParams('consultation', 'ongoing', urlId);
  };

  const endConsultation = () => {
    setConsultationStatus('form'); // goes to form first
    setIsSummarySaved(false);
    const urlId = selectedConsultation?.id || (Platform.OS === 'web' && typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('id') : null);
    updateUrlParams('consultation', 'form', urlId);
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
      updateUrlParams('history', null, null, null, null, { replace: true });
    } else if (selectedConsultation?.id) {
      nav.setCurrentView('patient-card');
      nav.setTabIndex(2);
      updateUrlParams('consultation', 'patient-card', selectedConsultation?.id, null, null, { replace: true });
    } else {
      resetViews();
      updateUrlParams(indexToTab[nav.tabIndex], null, null, null, null, { replace: true });
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
