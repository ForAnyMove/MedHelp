import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useStreamContext } from './Stream';
import { useSession } from './SessionContext';
import { useTranslation } from 'react-i18next';

const ChatNotificationContext = createContext(null);

let notificationIdCounter = 0;

export function ChatNotificationProvider({ children }) {
  const { chatClient } = useStreamContext();
  const { session } = useSession();
  const { t } = useTranslation();

  // Stack of active toast notifications
  const [notifications, setNotifications] = useState([]);
  // Map of channelId -> unread count
  const [unreadMap, setUnreadMap] = useState({});
  // channelId to pre-select when navigating to /list
  const [pendingChannelId, setPendingChannelId] = useState(null);

  const timersRef = useRef({});

  // Compute total conversations with unread messages
  const totalUnreadConversations = Object.values(unreadMap).filter(count => count > 0).length;

  // Add a new toast notification
  const addNotification = useCallback(({ title, body, channelId, senderId, targetRoute, type }) => {
    const id = ++notificationIdCounter;
    const newNotif = { id, title, body, channelId, senderId, targetRoute, type };

    setNotifications(prev => [...prev, newNotif]);

    // Auto-dismiss after 5 seconds
    timersRef.current[id] = setTimeout(() => dismissNotification(id), 5000);

    return id;
  }, []);

  // Remove a toast notification by id
  const dismissNotification = useCallback((id) => {
    clearTimeout(timersRef.current[id]);
    delete timersRef.current[id];
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Dismiss all
  const dismissAll = useCallback(() => {
    Object.values(timersRef.current).forEach(clearTimeout);
    timersRef.current = {};
    setNotifications([]);
  }, []);

  // Refresh unread counts from all channels
  const refreshUnreadCounts = useCallback(async () => {
    if (!chatClient?.userID) return;
    try {
      const channels = await chatClient.queryChannels(
        { members: { $in: [chatClient.userID] } },
        [],
        { state: true, watch: false, limit: 50 }
      );
      const map = {};
      channels.forEach(ch => {
        map[ch.id] = ch.countUnread();
      });
      setUnreadMap(map);
    } catch (e) {
      // silently fail
    }
  }, [chatClient]);

  // Listen to new messages and update unread counts + fire notifications
  useEffect(() => {
    if (!chatClient || !session?.userId) return;

    // Initial load of unread counts
    refreshUnreadCounts();

    const handleEvent = (event) => {
      // New message in any channel
      if (event.type === 'message.new' || event.type === 'notification.message_new') {
        const senderId = event.message?.user?.id || event.user?.id;
        const isOwnMessage = senderId === session.userId;
        if (isOwnMessage) return;

        // Regular chat message
        const senderName = event.message?.user?.name || t('notifications.new_message');
        const text = event.message?.text || '';
        const channelId = event.channel_id || event.cid?.split(':')[1];

        // Show in-app toast
        addNotification({ title: senderName, body: text, channelId, senderId, type: 'message' });
        refreshUnreadCounts();
      }

      // Custom events for bookings & consultations
      if (event.type === 'notification.added_to_channel') {
        const isSelf = event.user?.id === session?.userId;
        const creatorName = event.user?.name || (session?.role === 'doctor' ? t('notifications.patient') : t('notifications.doctor'));
        let title, body, targetRoute;

        const channelId = event.channel?.id || event.channel_id;
        if (isSelf) {
          title = t('notifications.success');
          body = t('notifications.booking_created_self');
          targetRoute = `/${session?.role === 'doctor' ? '(doctor)' : '(patient)'}?tab=history&openHistoryId=${channelId}`;
        } else {
          title = t('notifications.new_booking');
          body = session?.role === 'doctor' 
            ? t('notifications.booking_created_patient', { name: creatorName }) 
            : t('notifications.booking_created_doctor', { name: creatorName });
          targetRoute = `/${session?.role === 'doctor' ? '(doctor)' : '(patient)'}?tab=history&openHistoryId=${channelId}`;
        }
        addNotification({ title, body, targetRoute, type: 'system' });
        refreshUnreadCounts();
        
        const { DeviceEventEmitter } = require('react-native');
        DeviceEventEmitter.emit('reload_notifications');
        // We do not rely solely on added_to_channel to emit booking_created anymore since we send custom messages
        // But we still emit it here just in case.
        if (!isSelf) {
          DeviceEventEmitter.emit('booking_created');
        }
      }

      if (event.type === 'consultation_notify') {
        const title = t('notifications.consultation_started'); // Or a generic title
        const body = event.message_type === 'started' 
          ? t('notifications.consultation_notify_started') 
          : t('notifications.consultation_notify_remind');
        const role = session?.role === 'doctor' ? '(doctor)' : '(patient)';
        addNotification({
          title,
          body,
          targetRoute: `/${role}?tab=history&openHistoryId=${event.consultation_id}`,
          type: 'system'
        });
      }

      if (event.type === 'consultation_completed') {
        const { DeviceEventEmitter } = require('react-native');
        DeviceEventEmitter.emit('reload_notifications');
        DeviceEventEmitter.emit('consultation_updated');
        
        // Optionally show toast for patient
        if (session?.role !== 'doctor') {
           addNotification({
             title: t('notifications.consultation_completed', 'Консультация завершена'),
             body: t('notifications.consultation_completed_body', 'Доктор завершил консультацию'),
             targetRoute: `/(patient)?tab=history&openHistoryId=${event.consultation_id || event.channel_id}`,
             type: 'system'
           });
        }
      }

      // Mark read event
      if (event.type === 'message.read') {
        refreshUnreadCounts();
      }
    };

    const listener = chatClient.on(handleEvent);
    return () => listener.unsubscribe();
  }, [chatClient, session?.userId, addNotification, refreshUnreadCounts, t, session?.role]);

  return (
    <ChatNotificationContext.Provider value={{
      notifications,
      addNotification,
      dismissNotification,
      dismissAll,
      unreadMap,
      totalUnreadConversations,
      pendingChannelId,
      setPendingChannelId,
      refreshUnreadCounts,
    }}>
      {children}
    </ChatNotificationContext.Provider>
  );
}

export function useChatNotifications() {
  const ctx = useContext(ChatNotificationContext);
  if (!ctx) throw new Error('useChatNotifications must be used within ChatNotificationProvider');
  return ctx;
}
