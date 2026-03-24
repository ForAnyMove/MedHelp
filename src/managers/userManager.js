import { useState, useMemo } from 'react';

/**
 * Manager for User Data and Session
 * Placeholder for future API calls
 */
export default function userManager() {
  const [user, setUser] = useState({
    id: 'u1',
    firstName: 'Olga',
    lastName: 'Petrova',
    email: 'olga.p@example.com',
    avatarUrl: null, // Placeholder for URL
    role: 'patient',
  });

  const [session, setSession] = useState({
    token: 'mock-token-123',
    isLoggedIn: true,
  });

  const initials = useMemo(() => {
    if (!user.firstName && !user.lastName) return '?';
    return `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase();
  }, [user]);

  const updateProfile = (newData) => {
    setUser(prev => ({ ...prev, ...newData }));
  };

  const logout = () => {
    setSession({ token: null, isLoggedIn: false });
    setUser(null);
  };

  return {
    user,
    session,
    initials,
    updateProfile,
    logout,
    isLoader: false, // For future global loading state if needed here
  };
}
