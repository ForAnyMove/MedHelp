export function createPatientApi(apiClient) {
  return {
    getMedicalProfile: async (patientId) => {
      return apiClient.get(`/patients/${patientId}/medical-profile`);
    },

    searchDictionary: async (type, query) => {
      return apiClient.get(`/patients/dictionary/${type}`, { q: query });
    },

    addMedicalProfileItem: async (patientId, type, data) => {
      return apiClient.post(`/patients/${patientId}/medical-profile/${type}`, data);
    },

    removeMedicalProfileItem: async (patientId, type, value, isCustom = false) => {
      return apiClient.del(`/patients/${patientId}/medical-profile/${type}/${value}?custom=${isCustom}`);
    }
  };
}
