import React from 'react';
import { useDoctorDashboard } from '../../../context/DoctorDashboardContext';
import { BalanceDashboard } from './extra-screens/BalanceDashboard';
import { RequestPayout } from './extra-screens/RequestPayout';
import { TransactionHistory } from './extra-screens/TransactionHistory';

export function DoctorBalanceTab() {
  const { balanceView } = useDoctorDashboard();

  if (balanceView === 'request-payout') {
    return <RequestPayout />;
  }

  if (balanceView === 'full-history') {
    return <TransactionHistory />;
  }

  return <BalanceDashboard />;
}
