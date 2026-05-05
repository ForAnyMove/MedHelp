/**
 * Thin API layer for /api/doctors
 */
export function createDoctorsApi(apiClient) {
  return {
    /** Returns all doctors with profile & specialization */
    listAll: () => apiClient.get('/doctors'),
    /** Returns a single doctor by id */
    getById: (id) => apiClient.get(`/doctors/${id}`),
  };
}
