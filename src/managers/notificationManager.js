import { useState, useMemo, useEffect, useCallback } from 'react';
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

    const getNotifications = useCallback(async () => {
        if (!session?.accessToken) return;
        try {
            // setAppLoading(true); // Notifications can load silently in the background
            const response = await api.get('/notifications');
            setNotifications(response || []);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            // setAppLoading(false);
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
    }, [session]);

    return {
        notifications,
        getNotifications,
        markAsRead,
        markAllAsRead,
    };
}