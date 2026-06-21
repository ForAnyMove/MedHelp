import { useState, useEffect, useCallback, useMemo } from 'react';
import { createApiClient } from '../api/apiClient';
import { createConsultationsApi } from '../api/consultationsApi';
import { createDoctorsApi } from '../api/doctorsApi';
import { createSlotsApi } from '../api/slotsApi';
import { mapConsultationForDoctor, mapConsultationToDoctorHistory } from '../utils/consultationMapper';
import { getIsoDateWithOffset } from '../utils/dateUtils';

/**
 * Manager for a doctor's own profile and consultation list.
 * Converted from class-based singleton to a hook, matching other manager patterns.
 * Receives `session` for authenticated API calls.
 */
export default function myDoctorProfileManager(setAppLoading, session, refreshSessionToken) {
  const [profile, setProfile] = useState(null);
  const [consultations, setConsultations] = useState([]);
  const [pastConsultations, setPast] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const load = useCallback(async () => {
    if (!session?.userId) return;

    // Initial identity from session
    setProfile({
      id: session.userId,
      firstName: session.firstName || '',
      lastName: session?.lastName || '',
      fullName: `${session?.firstName || ''} ${session?.lastName || ''}`.trim(),
      email: session?.email || '',
      avatarUrl: session?.avatarUrl || null,
      role: session?.role || 'doctor',
      phone: session?.phone || '',
      dob: session?.dateOfBirth || '',
      gender: session?.gender || null,
      professionCodes: session?.professionCodes || [],
      professionNames: session?.professionNames || [],
      experience: session?.experience || 0,
      education: session?.education || '',
      workplace: session?.workplace || '',
      docVerificationStatus: session?.docVerificationStatus || 'none',
      about: session?.about || '',
      preferences: session?.preferences || {},
      privacy: {
        faceId: true,
      }
    });

    setAppLoading(true);
    try {
      const api = createApiClient(session, refreshSessionToken);

      // Explicitly fetch latest profile data from auth to ensure name/lastName are fresh
      const freshProfile = await api.get('/auth/profile').catch(() => null);
      if (freshProfile) {
        setProfile(prev => ({
          ...prev,
          firstName: freshProfile.firstName || prev.firstName,
          lastName: freshProfile.lastName || prev.lastName,
          avatarUrl: freshProfile.avatarUrl || prev.avatarUrl,
          experience: freshProfile.experience ?? prev.experience,
          education: freshProfile.education || prev.education,
          workplace: freshProfile.workplace || prev.workplace,
          docVerificationStatus: freshProfile.docVerificationStatus || prev.docVerificationStatus,
          about: freshProfile.about !== undefined ? freshProfile.about : prev.about,
        }));
      }

      const consultApi = createConsultationsApi(api);
      const doctorsApi = createDoctorsApi(api);

      // Try fetching doctor specific details
      const response = await doctorsApi.listAll().catch(() => ({ data: [] }));
      const rawAllDoctors = response.data || [];
      const doctorData = rawAllDoctors.find(d => d.profileId === session.userId) || null;
      console.log('[DEBUG] myDoctorProfileManager found doctorData:', doctorData);

      if (doctorData) {
        setProfile(prev => {
          const fName = doctorData.firstName || prev.firstName;
          const lName = doctorData.lastName || prev.lastName;
          return {
            ...prev,
            ...doctorData,
            id: doctorData.id,
            firstName: fName,
            lastName: lName,
            specialization: doctorData.specialization,
            fullName: doctorData.fullName || `${fName} ${lName}`.trim(),
            experience: doctorData.experience ?? prev.experience,
            education: doctorData.education || prev.education,
            workplace: doctorData.workplace || prev.workplace,
          };
        });
      }

      const consultResp = await consultApi.list().catch(() => []);
      const rawAll = Array.isArray(consultResp) ? consultResp : (consultResp?.data || []);

      const upcoming = rawAll.filter(
        c => c.status !== 'completed' && c.status !== 'canceled'
      );
      setConsultations(upcoming.map(mapConsultationForDoctor).sort((a, b) => new Date(a.date) - new Date(b.date)));

      const completedResp = await consultApi.list({ status: 'completed' }).catch(() => []);
      const rawCompleted = Array.isArray(completedResp) ? completedResp : (completedResp?.data || []);
      setPast(rawCompleted.map(mapConsultationToDoctorHistory));

    } catch (err) {
      console.error('[myDoctorProfileManager] load error:', err.message);
    } finally {
      setAppLoading(false);
      setIsLoaded(true);
    }
  }, [session?.userId, session?.firstName, session?.lastName]);

  useEffect(() => {
    load();
  }, [load]);

  const reloadProfile = useCallback(async () => {
    await load();
  }, [load]);

  // ── Derived helpers ───────────────────────────────────────────────────────

  const getDashboardData = useCallback(() => {
    const todayStr = getIsoDateWithOffset(0).split('T')[0];
    const consultationsToday = consultations.filter(c =>
      (c.date ?? '').startsWith(todayStr)
    );
    return {
      profile,
      nextConsultation: consultations[0] ?? null,
      consultationsTodayCount: consultationsToday.length,
    };
  }, [profile, consultations]);

  const getGroupedConsultations = useCallback(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const groupsMap = {};

    // Always ensure Today and Tomorrow exist
    groupsMap[todayStr] = [];
    groupsMap[tomorrowStr] = [];

    consultations.forEach(c => {
      const datePart = (c.date ?? '').split('T')[0];
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
        data: groupsMap[dateKey]
      };
    });
  }, [consultations]);

  const getConsultationById = useCallback(
    (id) => consultations.find(c => c.id === id) ?? null,
    [consultations]
  );

  const slotsApi = useMemo(() => {
    if (!session) return null;
    return createSlotsApi(createApiClient(session, refreshSessionToken));
  }, [session, refreshSessionToken]);

  return {
    profile,
    consultations,
    pastConsultations,
    isLoaded,
    loadData: load,
    reloadProfile,
    getDashboardData,
    getGroupedConsultations,
    getConsultationById,
    slotsApi
  };
}
