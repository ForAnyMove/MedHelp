import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { Platform, DeviceEventEmitter } from 'react-native';
import { useSession } from './SessionContext';
import { useChatNotifications } from './ChatNotificationContext';
import { useTranslation } from 'react-i18next';
import Constants from 'expo-constants';

const getSocketUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL.replace('/api', '');
  if (Platform.OS === 'web') return 'http://localhost:3000';
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) return `http://${hostUri.split(':')[0]}:3000`;
  return 'http://10.0.2.2:3000';
};

const SocketContext = createContext(null);

export function useSocket() {
  return useContext(SocketContext);
}

export function SocketProvider({ children }) {
  const { session, refreshSessionToken } = useSession();
  const [socket, setSocket] = useState(null);
  const { addNotification } = useChatNotifications();
  const { t } = useTranslation();

  useEffect(() => {
    const token = session?.accessToken || session?.token;
    if (!token || !session?.userId) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    // Connect to backend
    const backendUrl = getSocketUrl();

    const newSocket = io(backendUrl, {
      auth: {
        token: token || 'mock-token'
      }
    });

    newSocket.on('connect', () => {
      console.log('[Socket.io] Connected with ID:', newSocket.id);
    });

    newSocket.on('connect_error', async (err) => {
      if (err.message.includes('Authentication error')) {
        console.log('[Socket.io] Token expired or invalid, attempting to refresh...');
        if (refreshSessionToken) {
          await refreshSessionToken();
        }
      } else {
        console.error('[Socket.io] Connection error:', err.message);
      }
    });

    // --- System Events Listeners ---

    newSocket.on('booking_created', (data) => {
      console.log('[Socket.io] booking_created', data);
      addNotification({
        title: t('notifications.new_booking'),
        body: session?.role === 'doctor'
          ? t('notifications.booking_created_patient', { name: '' })
          : t('notifications.booking_created_doctor', { name: '' }),
        targetRoute: '/home',
        type: 'system'
      });
      DeviceEventEmitter.emit('reload_notifications');
      DeviceEventEmitter.emit('booking_created');
    });

    newSocket.on('booking_canceled', (data) => {
      console.log('[Socket.io] booking_canceled', data);
      addNotification({
        title: t('notifications.booking_canceled'),
        body: session?.role === 'doctor'
          ? t('notifications.booking_canceled_patient')
          : t('notifications.booking_canceled_doctor'),
        targetRoute: '/home',
        type: 'system'
      });
      DeviceEventEmitter.emit('reload_notifications');
      DeviceEventEmitter.emit('booking_canceled');
    });

    newSocket.on('booking_rescheduled', (data) => {
      console.log('[Socket.io] booking_rescheduled', data);
      addNotification({
        title: t('notifications.booking_rescheduled', 'Перенос консультации'),
        body: session?.role === 'doctor'
          ? t('notifications.booking_rescheduled_patient', 'Пациент перенес дату консультации')
          : t('notifications.booking_rescheduled_doctor', 'Врач перенес дату консультации'),
        targetRoute: '/home',
        type: 'system'
      });
      DeviceEventEmitter.emit('reload_notifications');
      DeviceEventEmitter.emit('booking_rescheduled');
    });

    newSocket.on('consultation_started', (data) => {
      console.log('[Socket.io] consultation_started', data);
      const isResumed = data?.resumed;
      addNotification({ 
        title: isResumed ? t('notifications.consultation_resumed', 'Doctor resumed the consultation') : t('notifications.consultation_started', 'Consultation started'), 
        body: t('notifications.doctor_waiting', 'Doctor is waiting for you in the call'), 
        targetRoute: `/consultation/${data?.consultation_id}`, 
        type: 'system' 
      });
      DeviceEventEmitter.emit('reload_notifications');
      DeviceEventEmitter.emit('consultation_started', data);
    });

    newSocket.on('consultation_sync', (data) => {
      console.log('[Socket.io] consultation_sync', data);
      DeviceEventEmitter.emit('consultation_sync', data);
    });

    newSocket.on('consultation_completed', (data) => {
      console.log('[Socket.io] consultation_completed', data);
      setTimeout(() => DeviceEventEmitter.emit('reload_notifications'), 500);
      DeviceEventEmitter.emit('consultation_completed', { consultationId: data?.consultation_id });
    });

    newSocket.on('patient_ready', (data) => {
      console.log('[Socket.io] patient_ready', data);
      DeviceEventEmitter.emit('patient_ready', { timer_started_at: data.timer_started_at });
    });

    newSocket.on('call_joined', (data) => {
      console.log('[Socket.io] call_joined', data);
      DeviceEventEmitter.emit('call_joined', { userId: data.user_id });
    });

    newSocket.on('call_left', (data) => {
      console.log('[Socket.io] call_left', data);
      DeviceEventEmitter.emit('call_left', { userId: data.user_id });
    });

    newSocket.on('patient_joined', (data) => {
      console.log('[Socket.io] patient_joined', data);
      DeviceEventEmitter.emit('patient_joined', { consultationId: data.consultation_id });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [session?.accessToken, session?.token, session?.userId]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
}
