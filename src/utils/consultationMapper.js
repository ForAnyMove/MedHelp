/**
 * consultationMapper.js
 * Maps raw API responses → component-ready shapes.
 *
 * API consultation shape (from /api/consultations JOIN):
 * {
 *   id, slot_id, doctor_id, patient_profile_id, status, purpose, call_id, created_at,
 *   slot: { start_at, duration },
 *   doctor: { id, experience, price, rating, reviews_count, is_vip,
 *             profile: { first_name, last_name, avatar_url },
 *             profession: { translations: [{ name, locale }] } },
 *   patient: { first_name, last_name, avatar_url }
 * }
 */

// ── Doctor shape ───────────────────────────────────────────────────────────────

export function mapDoctor(d) {
  if (!d) return null;
  const firstName = d.profile?.first_name ?? d.firstName ?? '';
  const lastName  = d.profile?.last_name ?? d.lastName ?? '';
  return {
    id:           d.id,
    fullName:     d.fullName ?? '',
    firstName,
    lastName,
    specialization: d.profession?.code ?? d.specialization ?? 'General',
    experience:   d.experience  ?? 0,
    price:        d.price       ?? 0,
    rating:       d.rating      ?? 0,
    reviewsCount: d.reviews_count ?? d.reviewsCount ?? 0,
    description:  d.about       ?? d.description ?? '',
    avatarUrl:    d.profile?.avatar_url ?? d.avatarUrl ?? null,
    isVip:        d.is_vip ?? d.isVip ?? false,
    gender:       d.profile?.gender ?? d.gender ?? null,
    dateOfBirth:  d.profile?.date_of_birth ?? d.dateOfBirth ?? null,
  };
}

// ── Duration helper ────────────────────────────────────────────────────────────

function slotDurationMinutes(slot) {
  if (slot?.duration) return slot.duration;
  if (!slot?.start_at || !slot?.end_at) return 30;
  return Math.round((new Date(slot.end_at) - new Date(slot.start_at)) / 60000);
}

// ── Slot label helper (today/tomorrow/null = format date) ─────────────────────

function slotLabel(isoDate) {
  if (!isoDate) return null;
  const d = new Date(isoDate);
  const today    = new Date(); today.setHours(0,0,0,0);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  d.setHours(0,0,0,0);
  if (d.getTime() === today.getTime())    return 'common.today';
  if (d.getTime() === tomorrow.getTime()) return 'common.tomorrow';
  return null;
}

// ── Booking (patient's upcoming / active consultation) ────────────────────────

/**
 * Maps a raw consultation into the "booking" shape used by ConsultationTab.
 */
export function mapConsultationToBooking(c) {
  return {
    id:       c.id,
    doctor:   mapDoctor(c.doctor),
    duration: slotDurationMinutes(c.slot),
    slot: {
      date:  c.slot?.start_at ?? c.created_at,
      label: slotLabel(c.slot?.start_at),
    },
    slotId:    c.slot_id,
    createdAt: c.created_at,
    status:    c.status,   // 'scheduled' | 'occupied' | 'completed' | 'canceled'
    callId:    c.call_id ?? null,
    purpose:   c.purpose ?? null,
    elapsed_seconds: c.elapsed_seconds ?? 0,
    timer_last_started_at: c.timer_last_started_at ?? null,
    is_doctor_joined: c.is_doctor_joined ?? false,
    is_patient_joined: c.is_patient_joined ?? false,
  };
}

/**
 * Maps an array of raw consultations into bookings.
 * Filters to active (non-completed, non-canceled) by default.
 */
export function mapConsultationsToBookings(consultations = [], filterActive = true) {
  const filtered = filterActive
    ? consultations.filter(c => c.status !== 'completed' && c.status !== 'canceled')
    : consultations;
  return filtered.map(mapConsultationToBooking);
}

// ── Past consultation (patient history) ───────────────────────────────────────

export function mapConsultationToHistory(c) {
  const doc = mapDoctor(c.doctor);
  const resultsData = c.results;
  const isArray = Array.isArray(resultsData);
  const resultObj = isArray ? (resultsData.length > 0 ? resultsData[0] : null) : (resultsData || null);
  
  const hasResult = !!resultObj;
  const is_draft = hasResult ? resultObj.is_draft : true;
  const resultId  = resultObj?.id ?? null;
  const diagnosis = hasResult ? (resultObj.diagnosis_name || resultObj.diagnosis || resultObj.overview || resultObj.notes) : null;

  const age = doc?.dateOfBirth
    ? Math.floor((Date.now() - new Date(doc.dateOfBirth).getTime()) / 3.156e10)
    : null;

  const genderMap = { male: 'Male', female: 'Female' };
  const gender = doc?.gender ? (genderMap[doc.gender] || doc.gender) : null;
  const specialty = doc?.specialization ?? '';

  const doctorMeta = [
    age ? `${age} y.o.` : null,
    gender,
    specialty
  ].filter(Boolean).join(' · ');

  return {
    id:          c.id,
    doctorId:    doc?.id ?? null,
    doctorName:  doc ? `Dr. ${doc.firstName} ${doc.lastName}`.trim() : 'Unknown Doctor',
    specialty,
    doctorMeta,
    avatarUrl:   doc?.avatarUrl ?? null,
    date:        c.slot?.start_at ?? c.created_at,
    duration:    slotDurationMinutes(c.slot),
    diagnosis,
    status:      c.status,
    callId:      c.call_id ?? null,
    hasResult,
    is_draft,
    resultId,
    result:      resultObj,
  };
}

// ── Doctor-side consultation (patient list) ───────────────────────────────────

export function mapConsultationForDoctor(c) {
  const patient = c.patient ?? {};
  const time     = c.slot?.start_at
    ? new Date(c.slot.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '--:--';

  const settings = patient.user_profile_settings?.data_visibility ?? {};
  // data_visibility flags represent "hide" toggles. If true, it means hidden.
  const showDob = !settings.date_of_birth;
  const showPhone = !settings.phone;
  const showEmail = !settings.email;

  const age = (showDob && patient.date_of_birth)
    ? Math.floor((Date.now() - new Date(patient.date_of_birth).getTime()) / 3.156e10)
    : null;

  return {
    id:     c.id,
    patient: {
      id:        c.patient_profile_id,
      firstName: patient.first_name ?? '',
      lastName:  patient.last_name ?? '',
      avatarUrl: patient.avatar_url ?? null,
      age:       age,
      email:     showEmail ? (patient.email ?? null) : null,
      phone:     showPhone ? (patient.phone ?? null) : null,
      symptoms:  null,
      analyses:  [],
      keyPoints: [],
    },
    date:    c.slot?.start_at ?? c.created_at,
    time,
    type:    'Online',
    status:  c.status,
    callId:  c.call_id ?? null,
    purpose: c.purpose ?? null,
    elapsed_seconds: c.elapsed_seconds ?? 0,
    timer_last_started_at: c.timer_last_started_at ?? null,
    is_doctor_joined: c.is_doctor_joined ?? false,
    is_patient_joined: c.is_patient_joined ?? false,
  };
}

// ── Doctor past consultation (earnings history) ───────────────────────────────

export function mapConsultationToDoctorHistory(c) {
  const patient  = c.patient ?? {};
  
  const resultsData = c.results;
  const isArray = Array.isArray(resultsData);
  const resultObj = isArray ? (resultsData.length > 0 ? resultsData[0] : null) : (resultsData || null);
  
  const hasResult = !!resultObj;
  const is_draft = hasResult ? resultObj.is_draft : true;
  const resultId  = resultObj?.id ?? null;
  const diagnosis = hasResult ? (resultObj.diagnosis_name || resultObj.diagnosis || resultObj.overview) : null;

  const settings = patient.user_profile_settings?.data_visibility ?? {};
  const showDob = !settings.date_of_birth;

  // Patient meta: "38 y.o. · Male · B+"
  const age = (showDob && patient.date_of_birth)
    ? Math.floor((Date.now() - new Date(patient.date_of_birth).getTime()) / 3.156e10)
    : null;
  
  const genderMap = { male: 'Male', female: 'Female' }; // Basic mapping
  const gender = patient.gender ? (genderMap[patient.gender] || patient.gender) : null;
  
  const bloodType = patient.patient_profiles?.[0]?.blood_type || patient.patient_profiles?.blood_type || null;

  const patientMeta = [
    age ? `${age} y.o.` : null,
    gender,
    bloodType
  ].filter(Boolean).join(' · ');

  return {
    id:          c.id,
    patientId:   c.patient_profile_id,
    doctorId:    c.doctor_id,
    patientName: `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || 'Unknown Patient',
    patientMeta,
    avatarUrl:   patient.avatar_url ?? null,
    date:        c.slot?.start_at ?? c.created_at,
    duration:    slotDurationMinutes(c.slot),
    serverNow:   c.server_now ?? null,
    
    // Result info
    diagnosis,
    hasResult,
    is_draft,
    resultId,
    result: resultObj,
    
    // Cancellation info
    canceledBy:   c.canceled_by ?? null,
    canceledAt:   c.canceled_at ?? null,
    cancelReason: c.cancel_reason ?? null,
    
    purpose:     c.purpose ?? null,
    earnings:    null, // derived from doctor_profiles.price * duration/60 if needed
    status:      c.status,
    format:      'online', // Assuming online default, can be derived if added to DB
  };
}

// ── Available slot (booking flow) ─────────────────────────────────────────────

/**
 * Groups raw doctor_slots into { dates, times } for the booking calendar UI.
 * slots: [{ id, start_at, end_at, ... }]
 */
export function groupSlotsForCalendar(slots = []) {
  const dateMap = {};

  slots.forEach(slot => {
    const d     = new Date(slot.start_at);
    const key   = d.toISOString().split('T')[0]; // 'YYYY-MM-DD'
    const time  = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

    if (!dateMap[key]) {
      dateMap[key] = {
        id:       `date-${key}`,
        date:     slot.start_at,
        fullDate: key,
        label:    slotLabel(slot.start_at),
        slots:    [],
      };
    }
    const bookingStatus = Array.isArray(slot.booking) ? slot.booking[0]?.status : slot.booking?.status;
    
    dateMap[key].slots.push({ 
      id: slot.id, 
      time, 
      start_at: slot.start_at, 
      duration: slot.duration,
      isFree: slot.booking_id === null || bookingStatus === 'canceled'
    });
  });

  const dates = Object.values(dateMap).sort((a, b) => new Date(a.date) - new Date(b.date));
  // Unique times across all dates (for backward compat with time picker)
  const allTimes = [...new Set(dates.flatMap(d => d.slots.map(s => s.time)))].sort();

  return { dates, times: allTimes };
}
