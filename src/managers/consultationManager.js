import { useState, useEffect, useMemo, useCallback } from 'react';
import { createApiClient } from '../api/apiClient';
import { createConsultationsApi } from '../api/consultationsApi';
import { mapConsultationsToBookings, mapConsultationToBooking } from '../utils/consultationMapper';

/**
 * Manager for Consultations and Active Sessions.
 * Replaces mock data with real API calls.
 * Active session (timer) remains local state.
 */
export default function consultationManager(setAppLoading, session, refreshSessionToken) {
  const [bookings, setBookings] = useState([]);
  const [results,  setResults]  = useState([]);
  const [allConsultations, setAllConsultations] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeSession, setActiveSession] = useState({
    bookingId: null,
    status: 'idle',
    startTime: null,
    elapsedSeconds: 0,
    localNotes: [],
  });

  const api = useMemo(() => createApiClient(session, refreshSessionToken), [session, refreshSessionToken]);
  const consultApi = useMemo(() => createConsultationsApi(api), [api]);

  // ── Load consultations on mount / session change ──────────────────────────

  const loadConsultations = useCallback(async () => {
    if (!session?.userId) return;
    try {
      const raw = await consultApi.list();
      const rawData = raw ?? [];
      const active   = mapConsultationsToBookings(rawData, true);
      const completed = rawData.filter(c => c.status === 'completed' || c.status === 'canceled');

      setAllConsultations(rawData);
      setBookings(active);
      setResults(completed.map(c => ({
        id:          c.id,
        doctorId:    c.doctor?.id,
        doctor:      mapConsultationToBooking(c).doctor,
        date:        c.slot?.start_at ?? c.created_at,
        duration:    c.slot
          ? `${Math.round((new Date(c.slot.end_at) - new Date(c.slot.start_at)) / 60000)} min`
          : '—',
        summary:     c.purpose ?? '',
        findings:    [],
        recommendations: [],
        nextSteps:   [],
        callId:      c.call_id ?? null,
      })));
    } catch (err) {
      console.error('[consultationManager] loadConsultations error:', err.message);
    } finally {
      setIsLoaded(true);
    }
  }, [session?.userId, consultApi]);

  useEffect(() => {
    loadConsultations();
    
    const { DeviceEventEmitter } = require('react-native');
    const sub1 = DeviceEventEmitter.addListener('booking_canceled', loadConsultations);
    const sub2 = DeviceEventEmitter.addListener('booking_created', loadConsultations);
    const sub3 = DeviceEventEmitter.addListener('consultation_updated', loadConsultations);
    const sub4 = DeviceEventEmitter.addListener('consultation_completed', loadConsultations);
    const sub5 = DeviceEventEmitter.addListener('booking_rescheduled', loadConsultations);

    return () => {
      sub1.remove();
      sub2.remove();
      sub3.remove();
      sub4.remove();
      sub5.remove();
    };
  }, [loadConsultations]);

  // ── Timer for ongoing session ─────────────────────────────────────────────

  useEffect(() => {
    let interval;
    if (activeSession.status === 'ongoing') {
      interval = setInterval(() => {
        setActiveSession(prev => ({ ...prev, elapsedSeconds: prev.elapsedSeconds + 1 }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeSession.status]);

  // ── Local-only session actions (timer management) ─────────────────────────

  const startConsultation = useCallback((bookingId) => {
    setActiveSession({ bookingId, status: 'ongoing', startTime: new Date().toISOString(), elapsedSeconds: 0, localNotes: [] });
  }, []);

  const endConsultation = useCallback(() => {
    setActiveSession(prev => ({ ...prev, status: 'finished' }));
  }, []);

  const resetSession = useCallback(() => {
    setActiveSession({ bookingId: null, status: 'idle', startTime: null, elapsedSeconds: 0, localNotes: [] });
  }, []);

  const addNote = useCallback((noteText) => {
    setActiveSession(prev => ({
      ...prev,
      localNotes: [...(prev.localNotes || []), { text: noteText, timestamp: new Date().toISOString() }]
    }));
  }, []);

  // ── API-backed actions ────────────────────────────────────────────────────

  /** Called by doctorManager.confirmBooking after successful POST, adds booking to state */
  const addBooking = useCallback((rawConsultation) => {
    const booking = mapConsultationToBooking(rawConsultation);
    setBookings(prev => [booking, ...prev]);
  }, []);

  const cancelBooking = useCallback(async (bookingId) => {
    setAppLoading(true);
    try {
      await consultApi.cancel(bookingId);
      setBookings(prev => prev.filter(b => b.id !== bookingId));
      const { DeviceEventEmitter } = require('react-native');
      DeviceEventEmitter.emit('booking_canceled', { bookingId });
    } catch (err) {
      console.error('[consultationManager] cancelBooking error:', err.message);
      throw err;
    } finally {
      setAppLoading(false);
    }
  }, [session]);

  // ── Derived state ─────────────────────────────────────────────────────────

  const upcomingBookings = useMemo(() => {
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const limit = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return bookings
      .filter(b => {
        const d = new Date(b.slot?.date);
        return d >= now && d <= limit;
      })
      .sort((a, b) => new Date(a.slot?.date) - new Date(b.slot?.date));
  }, [bookings]);

  const upcomingBooking = useMemo(() => upcomingBookings[0] ?? null, [upcomingBookings]);

  const getPreviousResult = useCallback((doctorId) =>
    results.find(r => r.doctorId === doctorId), [results]);

  const getGroupedConsultations = useCallback(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const groupsMap = {};
    groupsMap[todayStr] = [];
    groupsMap[tomorrowStr] = [];

    bookings.forEach(c => {
      const datePart = (c.slot?.date ?? c.date ?? '').split('T')[0];
      if (!datePart) return;
      if (!groupsMap[datePart]) groupsMap[datePart] = [];
      groupsMap[datePart].push(c);
    });

    const sortedDates = Object.keys(groupsMap).sort();

    return sortedDates.map(dateKey => {
      let title = '';
      if (dateKey === todayStr) title = 'common.today';
      else if (dateKey === tomorrowStr) title = 'common.tomorrow';
      else {
        const d = new Date(dateKey);
        title = d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
      }

      return {
        title,
        data: groupsMap[dateKey].sort((a, b) => new Date(a.slot?.date) - new Date(b.slot?.date))
      };
    });
  }, [bookings]);

  return {
    allConsultations,
    bookings,
    results,
    isLoaded,
    activeSession,
    upcomingBookings,
    upcomingBooking,
    loadConsultations,
    addBooking,
    cancelBooking,
    startConsultation,
    endConsultation,
    resetSession,
    addNote,
    getPreviousResult,
    setActiveSession,
    getGroupedConsultations,
  };
}
