/**
 * Thin API layer for /api/doctor-slots
 */
export function createSlotsApi(apiClient) {
  return {
    /** Patient: list available slots (booking_id IS NULL) */
    listAvailable: (params = {}) => apiClient.get('/doctor-slots', params),

    /** Doctor: list own slots (all including booked) */
    listMine: (params = {}) => apiClient.get('/doctor-slots/mine', params),

    /** Doctor: create a single slot */
    create: (start_at, duration) => apiClient.post('/doctor-slots', { start_at, duration }),

    /** Doctor: create multiple slots at once */
    createBulk: (slots) => apiClient.post('/doctor-slots/bulk', { slots }),

    /** Doctor: delete a slot by id */
    delete: (id) => apiClient.del(`/doctor-slots/${id}`),
  };
}
