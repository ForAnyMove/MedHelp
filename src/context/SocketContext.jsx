import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { Platform, DeviceEventEmitter } from 'react-native';
import { useSession } from './SessionContext';
import { useChatNotifications } from './ChatNotificationContext';
import { useTranslation } from 'react-i18next';
import Constants from 'expo-constants';

const getSocketUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL.replace('/api', '');
  if (__DEV__) {
    if (Platform.OS === 'web') return 'http://localhost:3000';
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) return `http://${hostUri.split(':')[0]}:3000`;
    return 'http://10.0.2.2:3000';
  }
  return ''; // fallback for production web
};

const SocketContext = createContext(null);

export function useSocket() {
  return useContext(SocketContext);
}

export function SocketProvider({ children }) {
  const { session, refreshSessionToken, updateSession } = useSession();
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

    newSocket.on('join_request_cancelled', (data) => {
      console.log('[Socket.io] join_request_cancelled', data);
      addNotification({
        title: t('notifications.join_request_cancelled', 'Request cancelled'),
        body: t('notifications.join_request_cancelled_desc', 'A doctor has cancelled their join request.'),
        targetRoute: '/home',
        type: 'system'
      });
      DeviceEventEmitter.emit('reload_notifications');
      DeviceEventEmitter.emit('join_request_cancelled', data);
    });

    newSocket.on('join_request_accepted', (data) => {
      console.log('[Socket.io] join_request_accepted', data);
      if (updateSession) updateSession({ workplaceConfirmed: true, workplace: data.orgName });
      addNotification({
        title: t('notifications.doctor_join_accepted', 'Request accepted'),
        body: t('notifications.doctor_join_accepted_desc', 'Your request to join "{{orgName}}" has been accepted.', { orgName: data.orgName }),
        targetRoute: '/profile',
        type: 'system'
      });
      DeviceEventEmitter.emit('reload_notifications');
      DeviceEventEmitter.emit('join_request_accepted', data);
    });

    newSocket.on('join_request_rejected', (data) => {
      console.log('[Socket.io] join_request_rejected', data);
      addNotification({
        title: t('notifications.doctor_join_rejected', 'Request rejected'),
        body: t('notifications.doctor_join_rejected_desc', 'Your request to join "{{orgName}}" has been rejected.', { orgName: data.orgName }),
        targetRoute: '/profile',
        type: 'system'
      });
      DeviceEventEmitter.emit('reload_notifications');
      DeviceEventEmitter.emit('join_request_rejected', data);
    });

    newSocket.on('org_removed', (data) => {
      console.log('[Socket.io] org_removed', data);
      if (updateSession) updateSession({ workplaceConfirmed: false });
      addNotification({
        title: t('notifications.org_removed', 'Removed from organization'),
        body: t('notifications.org_removed_desc', 'You have been removed from the organization {{orgName}}.', { orgName: data.orgName || 'organization' }),
        targetRoute: '/profile',
        type: 'system'
      });
      DeviceEventEmitter.emit('reload_notifications');
      DeviceEventEmitter.emit('org_removed', data);
    });

    newSocket.on('new_join_request', (data) => {
      console.log('[Socket.io] new_join_request', data);
      addNotification({
        title: t('notifications.owner_join_request', 'New join request'),
        body: t('notifications.owner_join_request_desc', 'Dr. {{doctorName}} has requested to join your organization.', { doctorName: data.doctorName }),
        targetRoute: '/home', // Or '/home/requests' depending on router
        type: 'system'
      });
      DeviceEventEmitter.emit('reload_notifications');
      DeviceEventEmitter.emit('new_join_request', data);
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
