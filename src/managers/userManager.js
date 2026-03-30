import { useState, useMemo } from 'react';

/**
 * Manager for User Profile Data.
 * Auth (session, login, logout) is owned exclusively by SessionContext.
 * Placeholder for future Supabase API calls.
 */
export default function userManager() {
  const [user, setUser] = useState({
    id: 'u1',
    firstName: 'Olga',
    lastName: 'Golovko',
    email: 'oksana@gmail.com',
    avatarUrl: 'https://i.pravatar.cc/300?u=olga',
    role: 'patient',
    phone: '+380987654321',
    dob: '07.10.1995',
    gender: 'Female',
    height: '165 cm',
    weight: '60 kg',
    bloodType: 'A+',
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

  const initials = useMemo(() => {
    if (!user?.firstName && !user?.lastName) return '?';
    return `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase();
  }, [user]);

  const updateProfile = (newData) => {
    setUser(prev => ({ ...prev, ...newData }));
  };

  const addBooking = (booking) => {
    setUser(prev => ({
      ...prev,
      bookings: [...(prev.bookings || []), booking]
    }));
  };

  return {
    user,
    initials,
    updateProfile,
    addBooking,
    isLoader: false,
  };
}
