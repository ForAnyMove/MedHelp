import React, { createContext, useContext, useState, useRef } from 'react';
import { LayoutAnimation, Platform, UIManager } from 'react-native';

// Enable layout animation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const PatientDashboardContext = createContext();

export function PatientDashboardProvider({ children }) {
  const [currentView, setCurrentView] = useState('dashboard'); // Possible values: 'dashboard', 'upload', 'symptom-checker'
  const scrollViewRef = useRef(null);

  const navigateToUpload = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCurrentView('upload');
  };

  const navigateToDashboard = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCurrentView('dashboard');
  };

  const navigateToSymptomChecker = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCurrentView('symptom-checker');
  };
  
  const scrollToTop = () => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  return (
    <PatientDashboardContext.Provider 
      value={{ 
        currentView, 
        navigateToUpload, 
        navigateToDashboard, 
        navigateToSymptomChecker,
        scrollToTop, 
        scrollViewRef 
      }}
    >
      {children}
    </PatientDashboardContext.Provider>
  );
}

export function usePatientDashboard() {
  return useContext(PatientDashboardContext);
}
