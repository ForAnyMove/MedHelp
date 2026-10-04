import { useSession } from '../context/SessionContext';
import { createApiClient } from './apiClient';

export function useReportsApi() {
  const { session, refreshSessionToken } = useSession();
  const api = createApiClient(session, refreshSessionToken);

  return {
    /**
     * Create a report for a user or review
     * @param {string} targetType - 'avatar' | 'about' | 'review' | 'profile'
     * @param {string} targetId - UUID of the target
     * @param {string} reason - Reason for reporting
     */
    createReport: async (targetType, targetId, reason) => {
      return api.post('/reports', { target_type: targetType, target_id: targetId, reason });
    },
  };
}
