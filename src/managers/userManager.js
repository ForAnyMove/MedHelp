import { useState, useMemo, useEffect } from 'react';

/**
 * Manager for User Profile Data.
 * Auth (session, login, logout) is owned exclusively by SessionContext.
 * Placeholder for future Supabase API calls.
 */
export default function userManager(session) {
  const [user, setUser] = useState({
    id: session?.userId || 'u1',
    firstName: session?.firstName || '',
    lastName: session?.lastName || '',
    email: session?.email || '',
    avatarUrl: session?.avatarUrl || null,
    role: session?.role || 'patient',
    medicalData: {
      chronicConditions: 'Not detected',
      allergies: 'Ambrosia',
      medications: 'Not detected',
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
        role: session.role || prev.role,
      }));
    }
  }, [session]);

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
    isLoader: false,
  };
}
