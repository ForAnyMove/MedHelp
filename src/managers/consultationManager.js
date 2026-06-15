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
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeSession, setActiveSession] = useState({
    bookingId: null,
    status: 'idle',
    startTime: null,
    elapsedSeconds: 0,
  });

  const api        = createApiClient(session, refreshSessionToken);
  const consultApi = createConsultationsApi(api);

  // ── Load consultations on mount / session change ──────────────────────────

  const loadConsultations = useCallback(async () => {
    if (!session?.userId) return;
    try {
      const raw = await consultApi.list();
      const active   = mapConsultationsToBookings(raw ?? [], true);
      const completed = (raw ?? [])
        .filter(c => c.status === 'completed' || c.status === 'canceled');

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
  }, [session?.userId]);

  useEffect(() => {
    loadConsultations();
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
    setActiveSession({ bookingId, status: 'ongoing', startTime: new Date().toISOString(), elapsedSeconds: 0 });
  }, []);

  const endConsultation = useCallback(() => {
    setActiveSession(prev => ({ ...prev, status: 'finished' }));
  }, []);

  const resetSession = useCallback(() => {
    setActiveSession({ bookingId: null, status: 'idle', startTime: null, elapsedSeconds: 0 });
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

  return {
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
    getPreviousResult,
    setActiveSession,
  };
}
