import { useState, useMemo, useEffect } from 'react';
import { createApiClient } from '../api/apiClient';
import { createPatientApi } from '../api/patientApi';
import { createCheckupsApi } from '../api/checkupsApi';
import { createLabResultsApi } from '../api/labResultsApi';
import { useTranslation } from 'react-i18next';

/**
 * Manager for User Profile Data.
 * Auth (session, login, logout) is owned exclusively by SessionContext.
 * Placeholder for future Supabase API calls.
 */
export default function userManager(session, refreshSessionToken) {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'en';

  const [user, setUser] = useState({
    id: session?.userId || 'u1',
    firstName: session?.firstName || '',
    lastName: session?.lastName || '',
    email: session?.email || '',
    avatarUrl: session?.avatarUrl || null,
    pendingAvatarUrl: session?.pendingAvatarUrl || null,
    avatarModerationStatus: session?.avatarModerationStatus || null,
    role: session?.role || 'patient',
    phone: session?.phone || '',
    dob: session?.dateOfBirth || '',
    gender: session?.gender || null,
    height: session?.height || null,
    weight: session?.weight || null,
    bloodType: session?.bloodType || null,
    professionCodes: session?.professionCodes || [],
    professionNames: session?.professionNames || [],
    about: session?.about || '',
    pendingAbout: session?.pendingAbout || null,
    aboutModerationStatus: session?.aboutModerationStatus || null,
    medicalData: {
      chronicConditions: null,
      allergies: null,
      medications: null,
      pregnancy: false,
    },
    preferences: {
      language: 'English',
      consultationFormat: 'Online (video)',
      preferredGender: 'No preference',
    },
    privacy: {
      faceId: true,
    }
  });

  const [rawMedicalData, setRawMedicalData] = useState(null);

  const apiClient = useMemo(() => createApiClient(session, refreshSessionToken), [session, refreshSessionToken]);
  const patientApi = useMemo(() => createPatientApi(apiClient), [apiClient]);
  const checkupsApi = useMemo(() => createCheckupsApi(apiClient), [apiClient]);
  const labResultsApi = useMemo(() => createLabResultsApi(apiClient), [apiClient]);

  const refreshMedicalProfile = async () => {
    if (!session?.userId) return;
    try {
      const data = await patientApi.getMedicalProfile(session.userId);
      if (data) {
        setRawMedicalData(data);
      }
    } catch (e) {
      console.error('Failed to fetch medical profile for userManager:', e);
    }
  };

  useEffect(() => {
    if (rawMedicalData) {
      const formatItems = (items, type) => {
        if (!items || items.length === 0) return null;
        return items.map(i => {
          if (i.custom_name) return i.custom_name;
          const t = i[`${type}_translations`];
          return t ? (t[currentLang] || t.en || t.ru) : 'Unknown';
        }).join(', ');
      };

      setUser(prev => ({
        ...prev,
        medicalData: {
          ...prev.medicalData,
          chronicConditions: formatItems(rawMedicalData.conditions, 'condition'),
          allergies: formatItems(rawMedicalData.allergies, 'allergy'),
          medications: formatItems(rawMedicalData.medications, 'medication'),
        }
      }));
    }
  }, [rawMedicalData, currentLang]);

  // Sync state when session is loaded or changed
  useEffect(() => {
    if (session) {
      setUser(prev => ({
        ...prev,
        id: session.userId || prev.id,
        firstName: session.firstName || prev.firstName,
        lastName: session.lastName || prev.lastName,
        email: session.email || prev.email,
        avatarUrl: session.avatarUrl || prev.avatarUrl,
        pendingAvatarUrl: session.pendingAvatarUrl !== undefined ? session.pendingAvatarUrl : prev.pendingAvatarUrl,
        avatarModerationStatus: session.avatarModerationStatus || prev.avatarModerationStatus,
        role: session.role || prev.role,
        phone: session.phone !== undefined ? session.phone : prev.phone,
        dob: session.dateOfBirth !== undefined ? session.dateOfBirth : prev.dob,
        gender: session.gender !== undefined ? session.gender : prev.gender,
        height: session.height !== undefined ? session.height : prev.height,
        weight: session.weight !== undefined ? session.weight : prev.weight,
        bloodType: session.bloodType !== undefined ? session.bloodType : prev.bloodType,
        professionCodes: session.professionCodes || prev.professionCodes,
        professionNames: session.professionNames || prev.professionNames,
        about: session.about !== undefined ? session.about : prev.about,
        pendingAbout: session.pendingAbout !== undefined ? session.pendingAbout : prev.pendingAbout,
        aboutModerationStatus: session.aboutModerationStatus || prev.aboutModerationStatus,
      }));
      refreshMedicalProfile();
    }
  }, [session?.userId]); // depend on userId to refetch profile

  const initials = useMemo(() => {
    if (!user?.firstName && !user?.lastName) {
      if (!session?.firstName && !session?.lastName) return '?';
      return `${session.firstName?.charAt(0) || ''}${session.lastName?.charAt(0) || ''}`.toUpperCase();
    }
    return `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase();
  }, [user, session]);
  // ... keep updateProfile and rest
  const updateProfile = (newData) => {
    setUser(prev => ({ ...prev, ...newData }));
  };

  return {
    user,
    initials,
    updateProfile,
    refreshMedicalProfile,
    patientApi,
    checkupsApi,
    labResultsApi,
    isLoader: false,
  };
}
