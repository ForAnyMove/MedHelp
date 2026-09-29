import React, { createContext, useContext, useState, useEffect } from 'react';
import { LayoutAnimation, Platform, UIManager } from 'react-native';
import { useDashboardNavigator } from '../hooks/useDashboardNavigator';
import { useLocalSearchParams } from 'expo-router';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const OwnerDashboardContext = createContext();

export function OwnerDashboardProvider({ children, initialTab = 'home' }) {
  const indexToTab = ['home', 'doctors', 'calendar', 'history', 'profile'];
  const tabIndexMap = { home: 0, doctors: 1, calendar: 2, history: 3, profile: 4 };
  const initialIndex = tabIndexMap[initialTab] !== undefined ? tabIndexMap[initialTab] : 0;

  const nav = useDashboardNavigator('dashboard', initialIndex);

  const updateUrlParams = (tabName, view, id) => {
    if (typeof window !== 'undefined' && window.history) {
      const searchParams = new URLSearchParams();
      if (view && view !== 'list' && view !== 'dashboard') {
        searchParams.set('view', view);
      }
      if (id) {
        searchParams.set('id', id);
      }
      const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
      window.history.pushState(window.history.state, '', `/${tabName}${queryString}`);
    }
  };

  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const initialView = searchParams.get('view');
  const initialId = searchParams.get('id');

  // ── Doctors sub-navigation ─────────────────────────────────────────
  const [doctorsView, setDoctorsView] = useState(initialTab === 'doctors' && initialView ? initialView : 'list'); // 'list' | 'requests' | 'doctor-profile'
  const [selectedDoctorId, setSelectedDoctorId] = useState(initialTab === 'doctors' && initialId ? initialId : null);

  // ── Calendar sub-navigation ────────────────────────────────────────
  const [calendarView, setCalendarView] = useState(initialTab === 'calendar' && initialView ? initialView : 'dashboard'); // 'dashboard' | 'consultation-detail'
  const [selectedConsultationId, setSelectedConsultationId] = useState(initialTab === 'calendar' && initialId ? initialId : null);

  // ── History sub-navigation ─────────────────────────────────────────
  const [historyView, setHistoryView] = useState(initialTab === 'history' && initialView ? initialView : 'dashboard'); // 'dashboard' | 'all' | 'detail'
  const [historySelectedId, setHistorySelectedId] = useState(initialTab === 'history' && initialId ? initialId : null);

  const { view: routeView, id: routeId } = useLocalSearchParams();
  
  useEffect(() => {
    if (routeView === 'requests') {
      setDoctorsView('requests');
    } else if (routeView === 'doctor-profile') {
      setDoctorsView('doctor-profile');
      if (routeId) setSelectedDoctorId(routeId);
    } else if (routeView === 'consultation-detail') {
      setCalendarView('consultation-detail');
      if (routeId) setSelectedConsultationId(routeId);
    } else if (routeView === 'detail') {
      setHistoryView('detail');
      if (routeId) setHistorySelectedId(routeId);
    } else if (routeView === 'all') {
      setHistoryView('all');
    }
  }, [routeView, routeId]);

  // ── Swipe lock when in sub-view ────────────────────────────────────
  const isSwipeEnabled =
    (nav.tabIndex === 1 ? doctorsView === 'list' : true) &&
    (nav.tabIndex === 2 ? calendarView === 'dashboard' : true) &&
    (nav.tabIndex === 3 ? historyView === 'dashboard' : true);

  // ── Navigation helpers ─────────────────────────────────────────────

  const navigateToDoctorsList = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setDoctorsView('list');
    setSelectedDoctorId(null);
    nav.setTabIndex(1);
    updateUrlParams('doctors', 'list');
  };

  const navigateToRequests = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setDoctorsView('requests');
    nav.setTabIndex(1);
    updateUrlParams('doctors', 'requests');
  };

  const navigateToDoctorProfile = (doctorId) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedDoctorId(doctorId);
    setDoctorsView('doctor-profile');
    updateUrlParams('doctors', 'doctor-profile', doctorId);
  };

  const navigateToConsultationDetail = (consultationId) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedConsultationId(consultationId);
    setCalendarView('consultation-detail');
    nav.setTabIndex(2);
    updateUrlParams('calendar', 'consultation-detail', consultationId);
  };

  const navigateToHistoryAll = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setHistoryView('all');
    nav.setTabIndex(3);
    updateUrlParams('history', 'all');
  };

  const navigateToHistoryDetail = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setHistorySelectedId(id);
    setHistoryView('detail');
    updateUrlParams('history', 'detail', id);
  };

  const navigateBack = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    // Reset whichever sub-view is active
    if (nav.tabIndex === 1) {
      if (doctorsView === 'doctor-profile') {
        // Go back to requests if we came from there, else list
        setDoctorsView('list');
      } else {
        setDoctorsView('list');
      }
      setSelectedDoctorId(null);
      updateUrlParams('doctors', 'list');
    } else if (nav.tabIndex === 2) {
      setCalendarView('dashboard');
      setSelectedConsultationId(null);
      updateUrlParams('calendar', 'dashboard');
    } else if (nav.tabIndex === 3) {
      setHistoryView('dashboard');
      setHistorySelectedId(null);
      updateUrlParams('history', 'dashboard');
    }
  };

  const value = {
    // nav
    tabIndex: nav.tabIndex,
    setTabIndex: nav.setTabIndex,
    scrollViewRef: nav.scrollViewRef,
    isSwipeEnabled,
    // doctors
    doctorsView,
    selectedDoctorId,
    navigateToDoctorsList,
    navigateToRequests,
    navigateToDoctorProfile,
    // calendar
    calendarView,
    selectedConsultationId,
    navigateToConsultationDetail,
    // history
    historyView,
    historySelectedId,
    navigateToHistoryAll,
    navigateToHistoryDetail,
    // shared
    navigateBack,
    updateUrlParams,
  };

  return (
    <OwnerDashboardContext.Provider value={value}>
      {children}
    </OwnerDashboardContext.Provider>
  );
}

export function useOwnerDashboard() {
  const ctx = useContext(OwnerDashboardContext);
  if (!ctx) throw new Error('useOwnerDashboard must be used within OwnerDashboardProvider');
  return ctx;
}
