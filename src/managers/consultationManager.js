import { useState, useEffect, useMemo, useCallback } from 'react';

/**
 * Manager for Consultations and Active Sessions
 */
export default function consultationManager(setAppLoading) {
  // Mock doctor for initial data
  const mockDoctor = {
    id: 'd2',
    firstName: 'Olena',
    lastName: 'Shevchenko',
    specialization: 'specializations.general_practitioner',
    rating: 4.8,
    reviewsCount: 120,
    experience: 10,
    price: 25,
    avatarUrl: null,
  };

  const [bookings, setBookings] = useState([
    {
      id: 'mock-booking-1',
      doctor: mockDoctor,
      slot: { 
        date: new Date().toISOString(), 
        label: 'common.today', 
        time: '09:00' 
      },
      createdAt: new Date().toISOString(),
      status: 'upcoming'
    }
  ]);

  const [results, setResults] = useState([
    {
      id: 'mock-result-1',
      doctorId: 'd2',
      doctor: mockDoctor,
      date: '2026-02-10T10:00:00Z',
      duration: '45 min',
      summary: 'During the consultation we discussed your test results.',
      findings: [
        'Low ferritin (iron stores) — this may indicate iron deficiency.',
        'Elevated cholesterol level — which increases cardiovascular risk over time.',
        'The condition is not critical, but requires correction and monitoring.'
      ],
      recommendations: [
        { id: 1, text: 'Consider taking iron supplements', icon: 'check', color: '#FF7D7D' },
        { id: 2, text: 'Assess the possible causes of the deficiency', icon: 'check', color: '#54DACC' },
        { id: 3, text: 'Repeat tests in 4-6 weeks', icon: 'check', color: '#FFD789' },
        { id: 4, text: 'See a doctor as soon as possible', icon: 'check', color: '#FFD789' },
      ],
      nextSteps: [
        { id: 5, text: 'Consider taking iron supplements', icon: 'check', color: '#FF7D7D' },
        { id: 6, text: 'Assess the possible causes of the deficiency', icon: 'check', color: '#54DACC' },
      ]
    }
  ]);

  const [activeSession, setActiveSession] = useState({
    bookingId: null,
    status: 'idle', // 'idle', 'ongoing', 'finished'
    startTime: null,
    elapsedSeconds: 0,
  });

  // Timer logic for ongoing consultation
  useEffect(() => {
    let interval;
    if (activeSession.status === 'ongoing') {
      interval = setInterval(() => {
        setActiveSession(prev => ({
          ...prev,
          elapsedSeconds: prev.elapsedSeconds + 1
        }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeSession.status]);

  const addBooking = useCallback((booking) => {
    setBookings(prev => [...prev, booking]);
  }, []);

  const cancelBooking = useCallback((bookingId) => {
    setBookings(prev => prev.filter(b => b.id !== bookingId));
  }, []);

  const startConsultation = useCallback((bookingId) => {
    setActiveSession({
      bookingId,
      status: 'ongoing',
      startTime: new Date().toISOString(),
      elapsedSeconds: 0,
    });
  }, []);

  const endConsultation = useCallback(() => {
    setActiveSession(prev => ({
      ...prev,
      status: 'finished'
    }));
  }, []);

  const resetSession = useCallback(() => {
    setActiveSession({
      bookingId: null,
      status: 'idle',
      startTime: null,
      elapsedSeconds: 0,
    });
  }, []);

  const upcomingBooking = useMemo(() => {
    if (bookings.length === 0) return null;
    // For now, just return the first one as "upcoming"
    // In a real app, we would sort by date/time
    return bookings[0];
  }, [bookings]);

  const getPreviousResult = useCallback((doctorId) => {
    return results.find(r => r.doctorId === doctorId);
  }, [results]);

  return {
    bookings,
    results,
    activeSession,
    upcomingBooking,
    addBooking,
    cancelBooking,
    startConsultation,
    endConsultation,
    resetSession,
    getPreviousResult,
    setActiveSession,
  };
}
