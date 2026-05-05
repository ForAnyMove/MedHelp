/**
 * Thin API layer for /api/consultation-results
 */
export function createResultsApi(apiClient) {
  return {
    update: (id, fields) => apiClient.patch(`/consultation-results/${id}`, fields),
    delete: (id) => apiClient.del(`/consultation-results/${id}`),
  };
}
