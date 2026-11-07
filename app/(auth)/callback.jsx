import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSession } from '../../src/context/SessionContext';
import { useTheme } from '../../src/theme/ThemeContext';

export default function AuthCallback() {
  const router = useRouter();
  const { login } = useSession();
  const { colors } = useTheme();
  const [error, setError] = useState(null);

  useEffect(() => {
    async function processCallback() {
      if (Platform.OS !== 'web' || typeof window === 'undefined') {
        router.replace('/(auth)/login');
        return;
      }

      try {
        const hash = window.location.hash || '';
        const search = window.location.search || '';
        const paramStr = hash.startsWith('#') ? hash.slice(1) : search.startsWith('?') ? search.slice(1) : '';
        const params = new URLSearchParams(paramStr);

        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (!accessToken) {
          router.replace('/(auth)/login');
          return;
        }

        let apiUrl = '/api';
        if (__DEV__) {
          apiUrl = 'http://localhost:3000/api';
        } else if (process.env.EXPO_PUBLIC_API_URL) {
          const raw = process.env.EXPO_PUBLIC_API_URL.replace(/\/+$/, '');
          apiUrl = raw.endsWith('/api') ? raw : `${raw}/api`;
        }
        const res = await fetch(`${apiUrl}/auth/google/session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ access_token: accessToken, refresh_token: refreshToken })
        });

        const json = await res.json();
        if (json.success && json.data?.session) {
          await login(json.data.session);
          router.replace('/');
        } else {
          setError(json.error || 'Authentication failed');
          setTimeout(() => router.replace('/(auth)/login'), 2500);
        }
      } catch (err) {
        setError(err.message || 'Authentication error');
        setTimeout(() => router.replace('/(auth)/login'), 2500);
      }
    }

    processCallback();
  }, [login, router]);

  return (
    <View style={[styles.container, { backgroundColor: colors.n100 }]}>
      <ActivityIndicator size="large" color={colors.p500} />
      <Text style={[styles.text, { color: colors.n900 }]}>
        {error ? error : 'Завершение авторизации...'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
});
