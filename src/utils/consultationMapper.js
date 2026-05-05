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
  const doc     = mapDoctor(c.doctor);
  const results = c.results ?? [];
  const diagnosis = results[0]?.notes ?? null;

  return {
    id:          c.id,
    doctorName:  doc ? `Dr. ${doc.firstName} ${doc.lastName}`.trim() : 'Unknown Doctor',
    specialty:   doc?.specialization ?? '',
    avatarUrl:   doc?.avatarUrl ?? null,
    date:        c.slot?.start_at ?? c.created_at,
    duration:    slotDurationMinutes(c.slot),
    diagnosis,
    status:      c.status,
    callId:      c.call_id ?? null,
  };
}

// ── Doctor-side consultation (patient list) ───────────────────────────────────

export function mapConsultationForDoctor(c) {
  const patient = c.patient ?? {};
  const time     = c.slot?.start_at
    ? new Date(c.slot.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '--:--';

  return {
    id:     c.id,
    patient: {
      id:        c.patient_profile_id,
      firstName: patient.first_name ?? '',
      lastName:  patient.last_name ?? '',
      avatarUrl: patient.avatar_url ?? null,
      age:       null, // requires separate profile query
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
  };
}

// ── Doctor past consultation (earnings history) ───────────────────────────────

export function mapConsultationToDoctorHistory(c) {
  const patient  = c.patient ?? {};
  const results  = c.results ?? [];
  const diagnosis = results[0]?.notes ?? null;

  return {
    id:          c.id,
    patientName: patient.first_name + ' ' + patient.last_name ?? 'Unknown Patient',
    avatarUrl:   patient.avatar_url ?? null,
    date:        c.slot?.start_at ?? c.created_at,
    duration:    slotDurationMinutes(c.slot),
    diagnosis,
    earnings:    null, // derived from doctor_profiles.price * duration/60 if needed
    status:      c.status,
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
    dateMap[key].slots.push({ 
      id: slot.id, 
      time, 
      start_at: slot.start_at, 
      duration: slot.duration,
      isFree: slot.booking_id === null
    });
  });

  const dates = Object.values(dateMap).sort((a, b) => new Date(a.date) - new Date(b.date));
  // Unique times across all dates (for backward compat with time picker)
  const allTimes = [...new Set(dates.flatMap(d => d.slots.map(s => s.time)))].sort();

  return { dates, times: allTimes };
}
