import { useState, useCallback } from 'react';
import { createApiClient } from '../api/apiClient';
import { createDoctorsApi } from '../api/doctorsApi';
import { createSlotsApi } from '../api/slotsApi';
import { createConsultationsApi } from '../api/consultationsApi';
import { groupSlotsForCalendar, mapDoctor } from '../utils/consultationMapper';

/**
 * Manager for Doctor Profiles and Booking Flow (patient-side).
 * Replaces all mock data with real API calls.
 */
export default function doctorManager(consultationController, setAppLoading, session, refreshSessionToken) {
  const [doctors, setDoctors] = useState([]);
  const [currentDoctorView, setCurrentDoctorView] = useState('list');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [availableSlots, setAvailableSlots] = useState({ dates: [], times: [] });
  const [selectedSlot, setSelectedSlot] = useState({ slotId: null, date: null, time: null });

  const api      = createApiClient(session, refreshSessionToken);
  const doctorsApi = createDoctorsApi(api);
  const slotsApi   = createSlotsApi(api);
  const consultApi = createConsultationsApi(api);

  // ── Fetch all doctors ──────────────────────────────────────────────────────

  const fetchDoctors = useCallback(async () => {
    setAppLoading(true);
    try {
      const data = await doctorsApi.listAll();
      const mapped = (data ?? []).map(d => {
        const doc = mapDoctor(d);
        return {
          ...doc,
          specialization: Array.isArray(doc.specialization) 
            ? doc.specialization.join(', ')
            : String(doc.specialization || ''),
          languages: Array.isArray(doc.languages) 
            ? doc.languages.map(l => (typeof l === 'string' ? l : l?.name)).filter(Boolean).join(', ')
            : String(doc.languages || ''),
        };
      });
      setDoctors(mapped);
    } catch (err) {
      console.error('[doctorManager] fetchDoctors error:', err.message);
    } finally {
      setAppLoading(false);
    }
  }, [session]);

  // ── Fetch available slots for a doctor ────────────────────────────────────

  const getAvailableSlots = useCallback(async (doctorId) => {
    setAppLoading(true);
    try {
      // Fetch slots for the next 30 days
      const from = new Date().toISOString();
      const to   = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const rawSlots = await slotsApi.listAvailable({ doctorId, from, to });
      setAvailableSlots(groupSlotsForCalendar(rawSlots ?? []));
    } catch (err) {
      console.error('[doctorManager] getAvailableSlots error:', err.message);
      setAvailableSlots({ dates: [], times: [] });
    } finally {
      setAppLoading(false);
    }
  }, [session]);

  // ── Navigation ────────────────────────────────────────────────────────────

  const selectDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    setCurrentDoctorView('profile');
    getAvailableSlots(doctor.id);
  };

  /**
   * @param {string|object} date - ISO date string or date object
   * @param {object|string} slot - slot object { id, time } or time string
   */
  const selectSlot = (date, slot) => {
    setSelectedSlot(prev => {
      const newDate = (typeof date === 'string') ? date : (date?.date || prev.date);
      const newTime = (typeof slot === 'string') ? slot : (slot?.time || prev.time);
      const newId   = (slot && typeof slot === 'object') ? slot.id : (newTime === prev.time ? prev.slotId : null);
      
      return {
        slotId: newId,
        date:   newDate,
        time:   newTime
      };
    });
  };

  const navigateToSummary = () => {
    if (selectedSlot.slotId) {
      setCurrentDoctorView('summary');
    }
  };

  const goBack = () => {
    if (currentDoctorView === 'summary') {
      setCurrentDoctorView('profile');
    } else if (currentDoctorView === 'profile') {
      setCurrentDoctorView('list');
      setSelectedDoctor(null);
    }
  };

  // ── Confirm booking ───────────────────────────────────────────────────────

  const confirmBooking = useCallback(async (purpose) => {
    if (!selectedSlot.slotId || !selectedDoctor) return;
    setAppLoading(true);
    try {
      const consultation = await consultApi.create({
        slot_id:   selectedSlot.slotId,
        doctor_id: selectedDoctor.id,
        purpose:   purpose ?? null,
      });

      // Refresh consultations in the consultation manager
      if (consultationController?.loadConsultations) {
        await consultationController.loadConsultations();
      }

      setCurrentDoctorView('list');
      setSelectedDoctor(null);
      setSelectedSlot({ slotId: null, date: null, time: null });

      return consultation;
    } catch (err) {
      console.error('[doctorManager] confirmBooking error:', err.message);
      throw err;
    } finally {
      setAppLoading(false);
    }
  }, [selectedSlot, selectedDoctor, session]);

  return {
    doctors,
    recommendedDoctors: doctors.filter(d => d.isVip),
    regularDoctors:     doctors.filter(d => !d.isVip),
    currentDoctorView,
    selectedDoctor,
    availableSlots,
    selectedSlot,
    fetchDoctors,
    selectDoctor,
    selectSlot,
    navigateToSummary,
    confirmBooking,
    goBack,
  };
}
