import React, { createContext, useContext, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import themeManager from '../managers/themeManager';
import userManager from '../managers/userManager';
import doctorManager from '../managers/doctorManager';
import consultationManager from '../managers/consultationManager';
import historyManager from '../managers/historyManager';

const ComponentContext = createContext();

export const ComponentProvider = ({ children }) => {
  const themeController = themeManager();
  const userController = userManager();
  
  const [loadingCounter, setLoadingCounter] = useState(0);

  const setAppLoading = (isLoading) => {
    setLoadingCounter(prev => {
      if (isLoading) return prev + 1;
      return Math.max(prev - 1, 0);
    });
  };

  const consultationController = consultationManager(setAppLoading);
  const doctorController = doctorManager(consultationController, setAppLoading);
  const historyController = historyManager(setAppLoading);

  const value = {
    themeController,
    ...userController,
    doctorController,
    consultationController,
    historyController,
    setAppLoading,
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
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
  },
});
