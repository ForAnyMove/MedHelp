import { useState, useEffect, useCallback } from 'react';
import { createApiClient } from '../api/apiClient';
import { createConsultationsApi } from '../api/consultationsApi';
import {
  mapConsultationToHistory,
  mapConsultationToDoctorHistory,
} from '../utils/consultationMapper';

/**
 * Manager for Health History (patient + doctor side).
 * pastConsultations and doctorPastConsultations loaded from API.
 * Metrics, vitamins, and timeline remain static until a separate health-data API is built.
 */
export default function historyManager(setAppLoading, session) {
  // ── Static health metrics (no API yet) ───────────────────────────────────
  const [metrics] = useState({
    hemoglobin: { value: 132, label: 'history.metrics.hemoglobin', color: '#F05252' },
    ferritin:   { value: 18,  label: 'history.metrics.ferritin',   color: '#FFD789' },
    cholesterol:{ value: 6.1, label: 'history.metrics.cholesterol', color: '#54DACC' },
  });

  const [analysisSummary] = useState({
    lastOverview: '2025-12-22T00:00:00Z',
    analysesCount: 5,
    consultationsCount: 3,
  });

  const [vitamins] = useState([
    { id: 'v1', name: 'history.vitamins.vitamin_a', percentage: 90, color: '#3F83F8' },
    { id: 'v2', name: 'history.vitamins.vitamin_b', percentage: 40, color: '#F05252' },
    { id: 'v3', name: 'history.vitamins.vitamin_d', percentage: 60, color: '#0E9F6E' },
    { id: 'v4', name: 'history.vitamins.vitamin_c', percentage: 50, color: '#FFBB38' },
  ]);

  const [timeline] = useState([
    { id: 'h1', date: '2025-12-21T00:00:00Z', type: 'history.types.blood_test',   category: 'history.categories.thyroid', statusColor: '#F05252', icon: 'Activity' },
    { id: 'h2', date: '2025-12-18T00:00:00Z', type: 'history.types.consultation',  category: 'history.categories.thyroid', statusColor: '#54DACC', icon: 'Stethoscope' },
    { id: 'h3', date: '2025-12-15T00:00:00Z', type: 'history.types.consultation',  category: 'history.categories.thyroid', statusColor: '#FFD789', icon: 'User' },
  ]);

  // ── Past consultations (from API) ─────────────────────────────────────────
  const [pastConsultations,       setPastConsultations]       = useState([]);
  const [doctorPastConsultations, setDoctorPastConsultations] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadHistory = useCallback(async () => {
    if (!session?.userId) return;
    try {
      const api        = createApiClient(session);
      const consultApi = createConsultationsApi(api);

      const raw = await consultApi.list({ status: 'completed' });
      const completed = raw ?? [];

      // Role check: if session says doctor, map doctor-side; else patient-side
      if (session?.role === 'doctor') {
        setDoctorPastConsultations(completed.map(mapConsultationToDoctorHistory));
      } else {
        setPastConsultations(completed.map(mapConsultationToHistory));
      }
    } catch (err) {
      console.error('[historyManager] loadHistory error:', err.message);
    } finally {
      setIsLoaded(true);
    }
  }, [session?.userId, session?.role]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return {
    metrics,
    analysisSummary,
    vitamins,
    timeline,
    pastConsultations,
    doctorPastConsultations,
    isLoaded,
    loadHistory,
  };
}
