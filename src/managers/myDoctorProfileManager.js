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
      pendingAvatarUrl: session?.pendingAvatarUrl || null,
      avatarModerationStatus: session?.avatarModerationStatus || null,
      role: session?.role || 'doctor',
      phone: session?.phone || '',
      dob: session?.dateOfBirth || '',
      gender: session?.gender || null,
      professionCodes: session?.professionCodes || [],
      professionNames: session?.professionNames || [],
      experience: session?.experience || 0,
      education: session?.education || '',
      workplace: session?.workplace || '',
      workplaceConfirmed: session?.workplaceConfirmed || false,
      docVerificationStatus: session?.docVerificationStatus || 'none',
      about: session?.about || '',
      pendingAbout: session?.pendingAbout || null,
      aboutModerationStatus: session?.aboutModerationStatus || null,
      preferences: session?.preferences || {},
      privacy: {
        faceId: true,
      }
    });

    setAppLoading(true);
    try {
      const api = createApiClient(session, refreshSessionToken);

      // Explicitly fetch latest profile data from auth to ensure name/lastName are fresh
      const freshProfileRaw = await api.get('/auth/profile').catch(() => null);
      const freshProfile = freshProfileRaw?.session || freshProfileRaw;
      
      if (freshProfile) {
        setProfile(prev => ({
          ...prev,
          firstName: freshProfile.firstName || prev.firstName,
          lastName: freshProfile.lastName || prev.lastName,
          avatarUrl: freshProfile.avatarUrl || prev.avatarUrl,
          pendingAvatarUrl: freshProfile.pendingAvatarUrl !== undefined ? freshProfile.pendingAvatarUrl : prev.pendingAvatarUrl,
          avatarModerationStatus: freshProfile.avatarModerationStatus !== undefined ? freshProfile.avatarModerationStatus : prev.avatarModerationStatus,
          avatarModerationComment: freshProfile.avatarModerationComment !== undefined ? freshProfile.avatarModerationComment : prev.avatarModerationComment,
          experience: freshProfile.experience ?? prev.experience,
          education: freshProfile.education || prev.education,
          workplace: freshProfile.workplace || prev.workplace,
          workplaceConfirmed: freshProfile.workplaceConfirmed !== undefined ? freshProfile.workplaceConfirmed : prev.workplaceConfirmed,
          docVerificationStatus: freshProfile.docVerificationStatus || prev.docVerificationStatus,
          about: freshProfile.about !== undefined ? freshProfile.about : prev.about,
          pendingAbout: freshProfile.pendingAbout !== undefined ? freshProfile.pendingAbout : prev.pendingAbout,
          aboutModerationStatus: freshProfile.aboutModerationStatus !== undefined ? freshProfile.aboutModerationStatus : prev.aboutModerationStatus,
          aboutModerationComment: freshProfile.aboutModerationComment !== undefined ? freshProfile.aboutModerationComment : prev.aboutModerationComment,
        }));
      }

      const consultApi = createConsultationsApi(api);
      const doctorsApi = createDoctorsApi(api);

      // Try fetching doctor specific details
      const response = await doctorsApi.listAll().catch(() => []);
      const rawAllDoctors = Array.isArray(response) ? response : (response?.data || []);
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
            workplaceConfirmed: doctorData.workplaceConfirmed !== undefined ? doctorData.workplaceConfirmed : prev.workplaceConfirmed,
          };
        });
      }

      const consultResp = await consultApi.list().catch(() => []);
      const rawAll = Array.isArray(consultResp) ? consultResp : (consultResp?.data || []);

      const upcoming = rawAll.filter(
        c => c.status !== 'completed' && c.status !== 'canceled'
      );
      console.log(`[myDoctorProfileManager] upcoming length after filter: ${upcoming.length}`);
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
  }, [session, session?.userId, refreshSessionToken]);

  useEffect(() => {
    load();

    const { DeviceEventEmitter } = require('react-native');
    const sub1 = DeviceEventEmitter.addListener('booking_created', () => {
       console.log('[myDoctorProfileManager] booking_created event received, waiting 500ms then calling load()');
       setTimeout(load, 500);
    });
    const sub2 = DeviceEventEmitter.addListener('booking_canceled', () => {
       console.log('[myDoctorProfileManager] booking_canceled event received, waiting 500ms then calling load()');
       setTimeout(load, 500);
    });
    const sub3 = DeviceEventEmitter.addListener('consultation_completed', () => {
       console.log('[myDoctorProfileManager] consultation_completed event received, waiting 500ms then calling load()');
       setTimeout(load, 500);
    });
    const sub4 = DeviceEventEmitter.addListener('booking_rescheduled', () => {
       console.log('[myDoctorProfileManager] booking_rescheduled event received, waiting 500ms then calling load()');
       setTimeout(load, 500);
    });
    const sub5 = DeviceEventEmitter.addListener('notification_received', () => {
       console.log('[myDoctorProfileManager] notification_received event received, waiting 500ms then calling load()');
       setTimeout(load, 500);
    });

    return () => {
      sub1.remove();
      sub2.remove();
      sub3.remove();
      sub4.remove();
      sub5.remove();
    };
  }, [load]);

  const reloadProfile = useCallback(async () => {
    await load();
  }, [load]);

  // ── Derived helpers ───────────────────────────────────────────────────────

  const getDashboardData = useCallback(() => {
    const toLocalDateString = (d) => {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };
    const todayStr = toLocalDateString(new Date());
    
    const consultationsToday = consultations.filter(c => {
      if (!c.date) return false;
      return toLocalDateString(new Date(c.date)) === todayStr;
    });

    return {
      profile,
      nextConsultation: consultations[0] ?? null,
      consultationsTodayCount: consultationsToday.length,
    };
  }, [profile, consultations]);

  const getGroupedConsultations = useCallback(() => {
    const toLocalDateString = (d) => {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const today = new Date();
    const todayStr = toLocalDateString(today);
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = toLocalDateString(tomorrow);

    const groupsMap = {};

    // Always ensure Today and Tomorrow exist
    groupsMap[todayStr] = [];
    groupsMap[tomorrowStr] = [];

    consultations.forEach(c => {
      if (!c.date) return;
      const datePart = toLocalDateString(new Date(c.date));
      if (!groupsMap[datePart]) groupsMap[datePart] = [];
      groupsMap[datePart].push(c);
    });

    const sortedDates = Object.keys(groupsMap).sort();

    return sortedDates.map(dateKey => {
      let title = '';
      if (dateKey === todayStr) title = 'common.today';
      else if (dateKey === tomorrowStr) title = 'common.tomorrow';
      else {
        // Parse dateKey as local date
        const [y, m, d] = dateKey.split('-');
        const dateObj = new Date(y, m - 1, d);
        title = dateObj.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
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
