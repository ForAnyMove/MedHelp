import { useState, useCallback } from 'react';

/**
 * Manager for Health History, Analyses and Metrics (patient-side).
 *
 * Pattern: Hook (Pattern A) — owns React state directly rendered in components.
 * Future: replace mock arrays with Supabase queries inside useEffect.
 */
export default function historyManager() {
  // ── Health metrics ─────────────────────────────────────────────────
  const [metrics] = useState({
    hemoglobin: { value: 132, label: 'history.metrics.hemoglobin', color: '#F05252' },
    ferritin: { value: 18, label: 'history.metrics.ferritin', color: '#FFD789' },
    cholesterol: { value: 6.1, label: 'history.metrics.cholesterol', color: '#54DACC' },
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
    { id: 'h1', date: '2025-12-21T00:00:00Z', type: 'history.types.blood_test', category: 'history.categories.thyroid', statusColor: '#F05252', icon: 'Activity' },
    { id: 'h2', date: '2025-12-18T00:00:00Z', type: 'history.types.consultation', category: 'history.categories.thyroid', statusColor: '#54DACC', icon: 'Stethoscope' },
    { id: 'h3', date: '2025-12-15T00:00:00Z', type: 'history.types.consultation', category: 'history.categories.thyroid', statusColor: '#FFD789', icon: 'User' },
  ]);

  // ── Past consultations (patient-side) ──────────────────────────────
  const [pastConsultations] = useState([
    {
      id: 'pc1',
      doctorName: 'Dr. Olena Shevchenko',
      specialty: 'General Practitioner',
      avatarUrl: 'https://i.pravatar.cc/150?u=d1',
      date: '2025-12-20T15:00:00Z',
      duration: 45,
      diagnosis: 'Iron deficiency anaemia (mild)',
      status: 'completed',
    },
    {
      id: 'pc2',
      doctorName: 'Dr. Ivan Kovalenko',
      specialty: 'Endocrinologist',
      avatarUrl: 'https://i.pravatar.cc/150?u=d2',
      date: '2025-12-10T12:00:00Z',
      duration: 30,
      diagnosis: 'Subclinical hypothyroidism — monitoring',
      status: 'completed',
    },
    {
      id: 'pc3',
      doctorName: 'Dr. Olena Shevchenko',
      specialty: 'General Practitioner',
      avatarUrl: 'https://i.pravatar.cc/150?u=d1',
      date: '2025-11-28T09:30:00Z',
      duration: 40,
      diagnosis: 'Vitamin D deficiency — supplementation prescribed',
      status: 'completed',
    },
    {
      id: 'pc4',
      doctorName: 'Dr. Marta Petrenko',
      specialty: 'Cardiologist',
      avatarUrl: 'https://i.pravatar.cc/150?u=d3',
      date: '2025-11-14T16:00:00Z',
      duration: 55,
      diagnosis: 'Borderline elevated cholesterol — diet adjustment',
      status: 'completed',
    },
    {
      id: 'pc5',
      doctorName: 'Dr. Ivan Kovalenko',
      specialty: 'Endocrinologist',
      avatarUrl: 'https://i.pravatar.cc/150?u=d2',
      date: '2025-10-30T11:00:00Z',
      duration: 35,
      diagnosis: 'Follow-up thyroid panel — stable',
      status: 'completed',
    },
    {
      id: 'pc6',
      doctorName: 'Dr. Olena Shevchenko',
      specialty: 'General Practitioner',
      avatarUrl: 'https://i.pravatar.cc/150?u=d1',
      date: '2025-10-05T14:30:00Z',
      duration: 25,
      diagnosis: 'Annual check-up — all clear',
      status: 'completed',
    },
    {
      id: 'pc7',
      doctorName: 'Dr. Marta Petrenko',
      specialty: 'Cardiologist',
      avatarUrl: 'https://i.pravatar.cc/150?u=d3',
      date: '2025-09-18T10:00:00Z',
      duration: 50,
      diagnosis: 'ECG — sinus rhythm, no pathology',
      status: 'completed',
    },
    {
      id: 'pc8',
      doctorName: 'Dr. Olena Shevchenko',
      specialty: 'General Practitioner',
      avatarUrl: 'https://i.pravatar.cc/150?u=d1',
      date: '2025-09-02T15:00:00Z',
      duration: 30,
      diagnosis: 'Acute URTI — course of antibiotics',
      status: 'completed',
    },
  ]);

  // ── Past consultations (doctor-side) ──────────────────────────────
  const [doctorPastConsultations] = useState([
    {
      id: 'dp1',
      patientName: 'Olga Golovko',
      avatarUrl: 'https://i.pravatar.cc/150?u=p1',
      date: '2025-12-20T15:00:00Z',
      duration: 45,
      diagnosis: 'Iron deficiency anaemia (mild)',
      earnings: 150,
      status: 'completed',
    },
    {
      id: 'dp2',
      patientName: 'Anna Chernova',
      avatarUrl: 'https://i.pravatar.cc/150?u=p2',
      date: '2025-12-18T18:30:00Z',
      duration: 30,
      diagnosis: 'Subclinical hypothyroidism — monitoring',
      earnings: 85,
      status: 'completed',
    },
    {
      id: 'dp3',
      patientName: 'Petr Dashko',
      avatarUrl: 'https://i.pravatar.cc/150?u=p3',
      date: '2025-12-15T20:00:00Z',
      duration: 40,
      diagnosis: 'Vitamin D deficiency — supplementation',
      earnings: 120,
      status: 'completed',
    },
    {
      id: 'dp4',
      patientName: 'Mark Stenko',
      avatarUrl: 'https://i.pravatar.cc/150?u=p4',
      date: '2025-12-12T10:00:00Z',
      duration: 55,
      diagnosis: 'Borderline elevated cholesterol',
      earnings: 175,
      status: 'completed',
    },
    {
      id: 'dp5',
      patientName: 'Alex Repnov',
      avatarUrl: 'https://i.pravatar.cc/150?u=p5',
      date: '2025-12-08T12:00:00Z',
      duration: 35,
      diagnosis: 'Annual check-up — all clear',
      earnings: 100,
      status: 'completed',
    },
    {
      id: 'dp6',
      patientName: 'Olga Golovko',
      avatarUrl: 'https://i.pravatar.cc/150?u=p1',
      date: '2025-12-01T15:00:00Z',
      duration: 50,
      diagnosis: 'Follow-up: ferritin levels stable',
      earnings: 150,
      status: 'completed',
    },
    {
      id: 'dp7',
      patientName: 'Anna Chernova',
      avatarUrl: 'https://i.pravatar.cc/150?u=p2',
      date: '2025-11-25T09:30:00Z',
      duration: 25,
      diagnosis: 'Thyroid panel — slight improvement',
      earnings: 75,
      status: 'completed',
    },
    {
      id: 'dp8',
      patientName: 'Petr Dashko',
      avatarUrl: 'https://i.pravatar.cc/150?u=p3',
      date: '2025-11-18T16:00:00Z',
      duration: 45,
      diagnosis: 'Acute respiratory infection — treated',
      earnings: 125,
      status: 'completed',
    },
  ]);

  return {
    metrics,
    analysisSummary,
    vitamins,
    timeline,
    pastConsultations,
    doctorPastConsultations,
  };
}
