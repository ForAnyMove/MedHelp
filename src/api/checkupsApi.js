export function createCheckupsApi(apiClient) {
  return {
    save: async (payload) => {
      const data = await apiClient.post('/checkups', payload);
      return data;
    },
    
    getLatest: async () => {
      const data = await apiClient.get('/checkups/latest');
      return data;
    },
  };
}
