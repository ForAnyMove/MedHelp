import { useState, useEffect, useMemo, useCallback } from 'react';
import { getIsoDateWithOffset } from '../utils/dateUtils';

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
      duration: 60,
      slot: { 
        date: getIsoDateWithOffset(0, 9, 0), 
        label: 'common.today', 
      },
      createdAt: new Date().toISOString(),
      status: 'upcoming'
    },
    {
      id: 'mock-booking-2',
      doctor: mockDoctor,
      duration: 30,
      slot: { 
        date: getIsoDateWithOffset(3, 14, 30), 
        label: 'common.later', 
      },
      createdAt: new Date().toISOString(),
      status: 'upcoming'
    },
    {
      id: 'mock-booking-3',
      doctor: mockDoctor,
      duration: 45,
      slot: { 
        date: getIsoDateWithOffset(7, 11, 0), 
        label: 'common.later', 
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

  const upcomingBookings = useMemo(() => {
    if (bookings.length === 0) return [];
    
    const now = new Date();
    now.setHours(0, 0, 0, 0); // start of today
    
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    return bookings
      .filter(b => {
        const bookingDate = new Date(b.slot.date);
        return bookingDate >= now && bookingDate <= thirtyDaysFromNow;
      })
      .sort((a, b) => new Date(a.slot.date).getTime() - new Date(b.slot.date).getTime());
  }, [bookings]);

  const upcomingBooking = useMemo(() => {
    return upcomingBookings.length > 0 ? upcomingBookings[0] : null;
  }, [upcomingBookings]);

  const getPreviousResult = useCallback((doctorId) => {
    return results.find(r => r.doctorId === doctorId);
  }, [results]);

  return {
    bookings,
    results,
    activeSession,
    upcomingBookings,
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
