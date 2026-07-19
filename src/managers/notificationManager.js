import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { createApiClient } from '../api/apiClient';

/** 
 * Manager for Notification Data.
 * @param {object} setAppLoading - Callback to set app loading state
 * @param {object} session - User session object
 * @param {function} refreshSessionToken - Callback to refresh session token
 */
export default function notificationManager(setAppLoading, session, refreshSessionToken) {

    const [notifications, setNotifications] = useState([]);

    const api = useMemo(() => createApiClient(session, refreshSessionToken), [session, refreshSessionToken]);

    const prevIdsRef = useRef(new Set());

    const getNotifications = useCallback(async () => {
        if (!session?.accessToken) return;
        try {
            const response = await api.get('/notifications');
            const data = response || [];
            
            // Trigger local notifications for web if there are new unread ones
            if (Platform.OS === 'web' && prevIdsRef.current.size > 0) {
                const newUnread = data.filter(n => !prevIdsRef.current.has(n.id) && !n.is_read);
                newUnread.forEach(n => {
                    if (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'granted') {
                        new window.Notification(n.title, { body: n.body || n.description });
                    }
                });
            }
            
            prevIdsRef.current = new Set(data.map(n => n.id));
            setNotifications(data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    }, [api, session?.accessToken]);

    const markAsRead = useCallback(async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }, [api]);

    const markAllAsRead = useCallback(async () => {
        try {
            await api.put('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    }, [api]);

    useEffect(() => {
        getNotifications();

        // Poll every 30 seconds so the list refreshes automatically
        const pollInterval = setInterval(() => {
            getNotifications();
        }, 30000);

        // Also listen for explicit reload signals (from Stream Chat events, cancellations, etc.)
        const { DeviceEventEmitter } = require('react-native');
        const sub = DeviceEventEmitter.addListener('reload_notifications', () => {
            getNotifications();
        });

        return () => {
            clearInterval(pollInterval);
            sub.remove();
        };
    }, [getNotifications]);

    return {
        notifications,
        getNotifications,
        markAsRead,
        markAllAsRead,
    };
}