import React, { createContext, useContext, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import themeManager from '../managers/themeManager';
import userManager from '../managers/userManager';
import doctorManager from '../managers/doctorManager';
import consultationManager from '../managers/consultationManager';
import historyManager from '../managers/historyManager';
import myDoctorProfileManager from '../managers/myDoctorProfileManager';
import { useSession } from './SessionContext';
import { useServerTimeSync } from '../hooks/useServerTime';
import notificationManager from '../managers/notificationManager';
import doctorHistoryManager from '../managers/doctorHistoryManager';
import settingsManager from '../managers/settingsManager';
import { useLegalManager } from '../managers/legalManager';
import ownerManager from '../managers/ownerManager';

const ComponentContext = createContext();

export const ComponentProvider = ({ children }) => {
  const { session, refreshSessionToken } = useSession();
  useServerTimeSync(session, refreshSessionToken);

  const themeController = themeManager();
  const userController = userManager(session, refreshSessionToken);

  const [loadingCounter, setLoadingCounter] = useState(0);
  const [chatButtonConfig, setChatButtonConfig] = useState({ visible: true, animated: false });

  const setAppLoading = (isLoading) => {
    setLoadingCounter(prev => {
      if (isLoading) return prev + 1;
      return Math.max(prev - 1, 0);
    });
  };

  // Pass session and refreshSessionToken to every manager that makes API calls
  const consultationController = consultationManager(setAppLoading, session, refreshSessionToken);
  const doctorController = doctorManager(consultationController, setAppLoading, session, refreshSessionToken);
  const historyController = historyManager(setAppLoading, session, refreshSessionToken);
  const doctorHistoryController = doctorHistoryManager(setAppLoading, session, refreshSessionToken);
  const doctorProfileController = myDoctorProfileManager(setAppLoading, session, refreshSessionToken);
  const notificationController = notificationManager(setAppLoading, session, refreshSessionToken);
  const settingsController = settingsManager(setAppLoading, session, refreshSessionToken);
  const legalController = useLegalManager(setAppLoading, session, refreshSessionToken);
  const ownerController = ownerManager(setAppLoading, session, refreshSessionToken);

  const value = {
    themeController,
    ...userController,
    doctorController,
    consultationController,
    historyController,
    doctorHistoryController,
    doctorProfileController,
    notificationController,
    settingsController,
    legalController,
    setAppLoading,
    ownerController,
    chatButtonConfig,
    setChatButtonConfig,
    session,
    refreshSessionToken,
  };

  return (
    <ComponentContext.Provider value={value}>
      {children}
      {loadingCounter > 0 && (
        <View style={styles.loaderContainer} pointerEvents="auto">
          <ActivityIndicator size="large" color={themeController.colors.p500} />
        </View>
      )}
    </ComponentContext.Provider>
  );
};

export const useComponentContext = () => {
  const context = useContext(ComponentContext);
  if (!context) {
    throw new Error('useComponentContext must be used within a ComponentProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  loaderContainer: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: /* TODO: color */ 'rgba(255, 255, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
  },
});
