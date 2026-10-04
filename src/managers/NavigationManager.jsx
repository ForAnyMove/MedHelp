import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useSession } from '../context/SessionContext';
import { useTheme } from '../theme/ThemeContext';
import { useNotification } from '../context/NotificationContext';

// Screens within the onboarding group
const ONBOARDING_SCREENS = ['choose-role', 'onboarding', 'profile-setup', 'doc-upload', 'profile-created'];

export function NavigationManager({ children }) {
  const { session, isLoading, docUploadHandledThisSession } = useSession();
  const { isHandlingNotification } = useNotification();
  const segments = useSegments();
  const router = useRouter();
  const { colors, sizes } = useTheme();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (isLoading || isHandlingNotification) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';
    const currentScreen = segments[segments.length - 1];
    const isRoot = segments.length === 0 || (segments.length === 1 && segments[0] === 'index');

    const safeReplace = (path) => setTimeout(() => router.replace(path), 0);

    // ──── NOT LOGGED IN ────
    if (!session) {
      if (!inAuthGroup) {
        safeReplace('/(auth)/welcome');
        return;
      }

    // ──── LOGGED IN, NO ROLE ────
    } else if (!session.role) {
      // Must be on choose-role (or auth/welcome if just logged in)
      if (currentScreen !== 'choose-role') {
        safeReplace('/(onboarding)/choose-role');
        return;
      }

    // ──── HAS ROLE, NOT REGISTERED ────
    } else if (!session.isRegistered) {
      // Allow navigation within onboarding: choose-role, onboarding, profile-setup
      // Block: doc-upload, profile-created, /home, app screens
      const allowedBeforeRegister = ['choose-role', 'onboarding', 'profile-setup'];
      if (!inOnboardingGroup || !allowedBeforeRegister.includes(currentScreen)) {
        safeReplace('/(onboarding)/profile-setup');
        return;
      }

    // ──── FULLY REGISTERED ────
    } else {

      // -- PATIENT: fully registered → only app screens --
      if (session.role === 'patient') {
        if (inAuthGroup || isRoot || inOnboardingGroup) {
          safeReplace('/home');
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
            safeReplace('/(onboarding)/doc-upload');
            return;
          }

        } else if (docStatus === 'skipped') {
          if (docUploadHandledThisSession) {
            // ── User already handled doc-upload this session ──
            // Allow profile-created (for first-time skip flow), doc-upload (to let it route itself), and /home
            if (inOnboardingGroup && currentScreen !== 'profile-created' && currentScreen !== 'doc-upload') {
              safeReplace('/home');
              return;
            }
            if (inAuthGroup || isRoot) {
              safeReplace('/home');
              return;
            }
          } else {
            // ── Return after skip — force doc-upload ONLY ──
            // No other onboarding screens, no /home, no app
            if (currentScreen !== 'doc-upload') {
              safeReplace('/(onboarding)/doc-upload');
              return;
            }
          }

        } else if (docStatus === 'pending') {
          if (docUploadHandledThisSession) {
            // ── Just submitted — allow profile-created, doc-upload, then /home ──
            if (inOnboardingGroup && currentScreen !== 'profile-created' && currentScreen !== 'doc-upload') {
              safeReplace('/home');
              return;
            }
            if (inAuthGroup || isRoot) {
              safeReplace('/home');
              return;
            }
          } else {
            // ── Re-login with pending → straight to app ──
            if (inAuthGroup || isRoot || inOnboardingGroup) {
              safeReplace('/home');
              return;
            }
          }

        } else {
          // ── verified → straight to app ──
          if (inAuthGroup || isRoot || inOnboardingGroup) {
            safeReplace('/home');
            return;
          }
        }

      // -- OWNER: same doc-upload flow as doctor --
      } else if (session.role === 'owner') {
        const docStatus = session.docVerificationStatus || 'none';

        if (docStatus === 'none') {
          const allowedForNone = ['choose-role', 'onboarding', 'profile-setup', 'doc-upload'];
          if (inOnboardingGroup && allowedForNone.includes(currentScreen)) {
            // Allowed
          } else if (!inOnboardingGroup || !allowedForNone.includes(currentScreen)) {
            safeReplace('/(onboarding)/doc-upload');
            return;
          }
        } else if (docStatus === 'skipped') {
          if (docUploadHandledThisSession) {
            if (inOnboardingGroup && currentScreen !== 'profile-created' && currentScreen !== 'doc-upload') {
              safeReplace('/home');
              return;
            }
            if (inAuthGroup || isRoot) {
              safeReplace('/home');
              return;
            }
          } else {
            if (currentScreen !== 'doc-upload') {
              safeReplace('/(onboarding)/doc-upload');
              return;
            }
          }
        } else {
          // pending or verified → straight to app
          if (inAuthGroup || isRoot || inOnboardingGroup) {
            safeReplace('/home');
            return;
          }
        }
      }

      // ── RBAC: prevent cross-role access ──
      const inDoctorGroup = segments.includes('(doctor)') || segments.includes('doctor');
      const inPatientGroup = segments.includes('(patient)') || segments.includes('patient');
      const inOwnerGroup = segments.includes('(owner)') || segments.includes('owner');

      if (session.role === 'patient' && (inDoctorGroup || inOwnerGroup)) {
        safeReplace('/home');
        return;
      }
      if (session.role === 'doctor' && (inPatientGroup || inOwnerGroup)) {
        safeReplace('/home');
        return;
      }
      if (session.role === 'owner' && (inDoctorGroup || inPatientGroup)) {
        safeReplace('/home');
        return;
      }
    }

    setIsReady(true);
  }, [session, isLoading, segments, docUploadHandledThisSession, isHandlingNotification]);

  if (!isReady || isLoading || isHandlingNotification) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors?.bg || colors.white }}>
        <ActivityIndicator size="large" color={colors?.p500 || colors.p500} />
      </View>
    );
  }

  return children;
}
