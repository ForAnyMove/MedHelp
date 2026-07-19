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

    /** Notify patient that doctor is waiting */
    notify: (id) => apiClient.post(`/consultations/${id}/notify`),

    /** Get or create a Stream Video call for the consultation */
    getOrCreateCall: (id) => apiClient.post(`/consultations/${id}/call`),

    /** Leave a Stream Video call for the consultation */
    leaveCall: (id) => apiClient.post(`/consultations/${id}/call/leave`),

    /** Poll video status of the other participant */
    getVideoStatus: (id) => apiClient.get(`/consultations/${id}/video-status`),
    
    // Results for a consultation */
    getResults: (id) => apiClient.get(`/consultations/${id}/results`),

    /** Doctor creates a result for a consultation */
    createResult: (id, payload) =>
      apiClient.post(`/consultations/${id}/results`, payload),

    /** Doctor updates a result for a consultation */
    updateResult: (id, payload) =>
      apiClient.put(`/consultations/${id}/results`, payload),

    /** Get patient history for a specific consultation */
    getPatientHistory: (id) => apiClient.get(`/consultations/${id}/patient-history`),

    /** Get rating for a consultation */
    getRating: (id) => apiClient.get(`/consultations/${id}/rating`),

    /** Submit a rating for a consultation */
    submitRating: (id, { rating, comment }) =>
      apiClient.post(`/consultations/${id}/rating`, { rating, comment }),
  };
}
