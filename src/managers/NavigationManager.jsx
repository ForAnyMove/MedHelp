import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useSession } from '../context/SessionContext';
import { useTheme } from '../theme/ThemeContext';

// Screens within the onboarding group
const ONBOARDING_SCREENS = ['choose-role', 'onboarding', 'profile-setup', 'doc-upload', 'profile-created'];

export function NavigationManager({ children }) {
  const { session, isLoading, docUploadHandledThisSession } = useSession();
  const segments = useSegments();
  const router = useRouter();
  const { colors } = useTheme();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';
    const currentScreen = segments[segments.length - 1];
    const isRoot = segments.length === 0 || (segments.length === 1 && segments[0] === 'index');

    // ──── NOT LOGGED IN ────
    if (!session) {
      if (!inAuthGroup) {
        router.replace('/(auth)/welcome');
        return;
      }

    // ──── LOGGED IN, NO ROLE ────
    } else if (!session.role) {
      // Must be on choose-role (or auth/welcome if just logged in)
      if (currentScreen !== 'choose-role') {
        router.replace('/(onboarding)/choose-role');
        return;
      }

    // ──── HAS ROLE, NOT REGISTERED ────
    } else if (!session.isRegistered) {
      // Allow navigation within onboarding: choose-role, onboarding, profile-setup
      // Block: doc-upload, profile-created, /home, app screens
      const allowedBeforeRegister = ['choose-role', 'onboarding', 'profile-setup'];
      if (!inOnboardingGroup || !allowedBeforeRegister.includes(currentScreen)) {
        router.replace('/(onboarding)/profile-setup');
        return;
      }

    // ──── FULLY REGISTERED ────
    } else {

      // -- PATIENT: fully registered → only app screens --
      if (session.role === 'patient') {
        if (inAuthGroup || isRoot || inOnboardingGroup) {
          router.replace('/home');
          return;
        }

      // -- DOCTOR: check doc verification status --
      } else if (session.role === 'doctor') {
        const docStatus = session.docVerificationStatus || 'none';

        if (docStatus === 'none') {
          // ── First-time onboarding flow (hasn't reached doc-upload decision yet) ──
          // Allow full back-navigation through onboarding
          // Block /home and app screens
          const allowedForNone = ['choose-role', 'onboarding', 'profile-setup', 'doc-upload'];
          if (inOnboardingGroup && allowedForNone.includes(currentScreen)) {
            // Allowed — stay here
          } else if (!inOnboardingGroup || !allowedForNone.includes(currentScreen)) {
            router.replace('/(onboarding)/doc-upload');
            return;
          }

        } else if (docStatus === 'skipped') {
          if (docUploadHandledThisSession) {
            // ── User already handled doc-upload this session ──
            // Allow profile-created (for first-time skip flow), doc-upload (to let it route itself), and /home
            if (inOnboardingGroup && currentScreen !== 'profile-created' && currentScreen !== 'doc-upload') {
              router.replace('/home');
              return;
            }
            if (inAuthGroup || isRoot) {
              router.replace('/home');
              return;
            }
          } else {
            // ── Return after skip — force doc-upload ONLY ──
            // No other onboarding screens, no /home, no app
            if (currentScreen !== 'doc-upload') {
              router.replace('/(onboarding)/doc-upload');
              return;
            }
          }

        } else if (docStatus === 'pending') {
          if (docUploadHandledThisSession) {
            // ── Just submitted — allow profile-created, doc-upload, then /home ──
            if (inOnboardingGroup && currentScreen !== 'profile-created' && currentScreen !== 'doc-upload') {
              router.replace('/home');
              return;
            }
            if (inAuthGroup || isRoot) {
              router.replace('/home');
              return;
            }
          } else {
            // ── Re-login with pending → straight to app ──
            if (inAuthGroup || isRoot || inOnboardingGroup) {
              router.replace('/home');
              return;
            }
          }

        } else {
          // ── verified → straight to app ──
          if (inAuthGroup || isRoot || inOnboardingGroup) {
            router.replace('/home');
            return;
          }
        }
      }

      // ── RBAC: prevent cross-role access ──
      const inDoctorGroup = segments.includes('(doctor)') || segments.includes('doctor');
      const inPatientGroup = segments.includes('(patient)') || segments.includes('patient');

      if (session.role === 'patient' && inDoctorGroup) {
        router.replace('/home');
        return;
      }
      if (session.role === 'doctor' && inPatientGroup) {
        router.replace('/home');
        return;
      }
    }

    setIsReady(true);
  }, [session, isLoading, segments, docUploadHandledThisSession]);

  if (!isReady || isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors?.bg || '#FFFFFF' }}>
        <ActivityIndicator size="large" color={colors?.p500 || '#23D3C2'} />
      </View>
    );
  }

  return children;
}
