import React, { useState, useEffect } from 'react';
import { useDoctorDashboard } from '../../../context/DoctorDashboardContext';
import { BalanceDashboard } from './extra-screens/BalanceDashboard';
import { RequestPayout } from './extra-screens/RequestPayout';
import { TransactionHistory } from './extra-screens/TransactionHistory';
import { useLocalSearchParams } from 'expo-router';
import { Platform } from 'react-native';

export function DoctorBalanceTab() {
  const { balanceView } = useDoctorDashboard();
  const searchParams = useLocalSearchParams();
  const routeView = typeof searchParams?.view === 'string' ? searchParams.view : searchParams?.view?.[0];

  const getWebParam = (key) => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.location) return null;
    try {
      if (!window.location.pathname.startsWith('/balance')) return null;
      const sp = new URLSearchParams(window.location.search);
      return sp.get(key);
    } catch (e) {
      return null;
    }
  };

  const [, setPopstateTick] = useState(0);
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.addEventListener) return;
    const handlePop = () => setPopstateTick((t) => t + 1);
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  const urlView = getWebParam('view');
  const isWeb = Platform.OS === 'web' && typeof window !== 'undefined' && window.location;
  const isWebBalanceBase = isWeb && window.location.pathname.startsWith('/balance') && (!window.location.search || window.location.search === '?');
  const effectiveView = isWebBalanceBase ? 'dashboard' : (urlView || (isWeb ? balanceView : (routeView || balanceView)) || 'dashboard');

  if (effectiveView === 'request-payout') {
    return <RequestPayout />;
  }

  if (effectiveView === 'full-history') {
    return <TransactionHistory />;
  }

  return <BalanceDashboard />;
}
