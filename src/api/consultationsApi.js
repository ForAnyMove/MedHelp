/**
 * Thin API layer for /api/consultations
 */
export function createConsultationsApi(apiClient) {
  return {
    /** List consultations (role detected server-side). Optional status filter. */
    list: (params = {}) => apiClient.get('/consultations', params),

    /** Get single consultation by id */
    getById: (id) => apiClient.get(`/consultations/${id}`),

    /** Patient books a consultation */
    create: ({ slot_id, doctor_id, purpose }) =>
      apiClient.post('/consultations', { slot_id, doctor_id, purpose }),

    /** Update status, purpose, or reschedule (new slot_id) */
    update: (id, fields) => apiClient.patch(`/consultations/${id}`, fields),

    /** Cancel / delete a consultation */
    cancel: (id) => apiClient.del(`/consultations/${id}`),

    /** Get or create a Stream Video call for the consultation */
    getOrCreateCall: (id) => apiClient.post(`/consultations/${id}/call`),

    /** List results for a consultation */
    getResults: (id) => apiClient.get(`/consultations/${id}/results`),

    /** Doctor creates a result for a consultation */
    createResult: (id, { notes, recommendations, result_link }) =>
      apiClient.post(`/consultations/${id}/results`, { notes, recommendations, result_link }),
  };
}
