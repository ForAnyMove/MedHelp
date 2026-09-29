import { useState, useMemo, useEffect, useCallback } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { createApiClient } from '../api/apiClient';

/**
 * Manager for Owner role data.
 * Loads organization data, doctors list, join requests, and all consultations.
 */
export default function ownerManager(setAppLoading, session, refreshSessionToken) {
  const [organization, setOrganization] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const api = useMemo(
    () => createApiClient(session, refreshSessionToken),
    [session, refreshSessionToken]
  );

  // ── Load organization data ──────────────────────────────────────────
  const loadOrganization = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      const data = await api.get('/organizations/my');
      setOrganization(data);
      return data;
    } catch (e) {
      console.error('ownerManager: loadOrganization error', e);
      return null;
    }
  }, [api, session?.accessToken]);

  // ── Load doctors list (accepted) ──────────────────────────────────
  const loadDoctors = useCallback(async (orgId) => {
    if (!orgId) return;
    try {
      const data = await api.get(`/organizations/${orgId}/doctors`);
      setDoctors(data || []);
    } catch (e) {
      console.error('ownerManager: loadDoctors error', e);
    }
  }, [api]);

  // ── Load pending join requests ─────────────────────────────────────
  const loadJoinRequests = useCallback(async (orgId) => {
    if (!orgId) return;
    try {
      const data = await api.get(`/organizations/${orgId}/join-requests`);
      setJoinRequests(data || []);
    } catch (e) {
      console.error('ownerManager: loadJoinRequests error', e);
    }
  }, [api]);

  // ── Load all org consultations ─────────────────────────────────────
  const loadConsultations = useCallback(async (orgId) => {
    if (!orgId) return;
    try {
      const data = await api.get(`/organizations/${orgId}/consultations`);
      setConsultations(data || []);
    } catch (e) {
      console.error('ownerManager: loadConsultations error', e);
    }
  }, [api]);

  // ── Accept join request ────────────────────────────────────────────
  const acceptRequest = useCallback(async (requestId) => {
    try {
      setAppLoading(true);
      await api.put(`/organizations/join-requests/${requestId}/accept`);
      // Optimistic update
      const acceptedReq = joinRequests.find(r => r.requestId === requestId);
      if (acceptedReq) {
        setJoinRequests(prev => prev.filter(r => r.requestId !== requestId));
        
        // Map the join request structure to the doctor list structure
        const newDoctor = {
          ...acceptedReq,
          id: acceptedReq.doctorId,
        };
        setDoctors(prev => [...prev, newDoctor]);
        
        setOrganization(prev => prev ? { ...prev, doctorsCount: (prev.doctorsCount || 0) + 1, pendingRequestsCount: Math.max((prev.pendingRequestsCount || 0) - 1, 0) } : prev);
      }
      return { success: true };
    } catch (e) {
      console.error('ownerManager: acceptRequest error', e);
      return { success: false, error: e.message };
    } finally {
      setAppLoading(false);
    }
  }, [api, joinRequests, setAppLoading]);

  // ── Reject join request ────────────────────────────────────────────
  const rejectRequest = useCallback(async (requestId) => {
    try {
      setAppLoading(true);
      await api.put(`/organizations/join-requests/${requestId}/reject`);
      setJoinRequests(prev => prev.filter(r => r.requestId !== requestId));
      setOrganization(prev => prev ? { ...prev, pendingRequestsCount: Math.max((prev.pendingRequestsCount || 0) - 1, 0) } : prev);
      return { success: true };
    } catch (e) {
      console.error('ownerManager: rejectRequest error', e);
      return { success: false, error: e.message };
    } finally {
      setAppLoading(false);
    }
  }, [api, setAppLoading]);

  const removeDoctor = useCallback(async (doctorId) => {
    if (!organization?.id) return { success: false, error: 'No organization' };
    try {
      setAppLoading(true);
      await api.del(`/organizations/${organization.id}/doctors/${doctorId}`);
      setDoctors(prev => prev.filter(d => d.id !== doctorId));
      return { success: true };
    } catch (e) {
      console.error('ownerManager: removeDoctor error', e);
      return { success: false, error: e.message };
    } finally {
      setAppLoading(false);
    }
  }, [api, organization?.id, setAppLoading]);

  // ── Initial load ───────────────────────────────────────────────────
  useEffect(() => {
    if (!session?.accessToken || session?.role !== 'owner') return;

    let cancelled = false;
    const init = async () => {
      setIsLoading(true);
      const org = await loadOrganization();
      if (cancelled || !org?.id) {
        setIsLoading(false);
        return;
      }
      await Promise.all([
        loadDoctors(org.id),
        loadJoinRequests(org.id),
        loadConsultations(org.id),
      ]);
      if (!cancelled) setIsLoading(false);
    };
    init();
    return () => { cancelled = true; };
  }, [session?.accessToken, session?.role]);

  // ── Listen for socket events ─────────────────────────────────────────
  useEffect(() => {
    const sub1 = DeviceEventEmitter.addListener('join_request_cancelled', (data) => {
      const requestId = data?.requestId;
      if (requestId) {
        setJoinRequests(prev => prev.filter(r => r.requestId !== requestId));
        setOrganization(prev => prev ? { ...prev, pendingRequestsCount: Math.max((prev.pendingRequestsCount || 0) - 1, 0) } : prev);
      }
    });
    
    const sub2 = DeviceEventEmitter.addListener('new_join_request', () => {
      if (organization?.id) {
        loadJoinRequests(organization.id);
      }
    });
    
    return () => {
      sub1.remove();
      sub2.remove();
    };
  }, [organization?.id, loadJoinRequests]);

  return {
    organization,
    doctors,
    joinRequests,
    consultations,
    isLoading,
    loadOrganization,
    loadDoctors,
    loadJoinRequests,
    loadConsultations,
    acceptRequest,
    rejectRequest,
    removeDoctor,
    // Computed
    pendingRequestsCount: joinRequests.length,
  };
}
