export function createLabResultsApi(apiClient) {
  return {
    getPatientLabResults: async (patientId, filters = {}) => {
      const query = new URLSearchParams(filters).toString();
      return apiClient.get(`/patients/${patientId}/lab-results${query ? `?${query}` : ''}`);
    },
    getLabResultDetails: async (id) => {
      return apiClient.get(`/lab-results/${id}`);
    }
  };
}
