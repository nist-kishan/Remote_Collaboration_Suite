import ApiClient from "./ApiClient";

export const startCall = (data) => ApiClient.post('/call/start', data);
export const joinCall = (callId) => ApiClient.post(`/call/${callId}/join`);
export const endCall = (callId) => ApiClient.post(`/call/${callId}/end`);
export const getCallHistory = async (params = {}) => {
  const response = await ApiClient.get('/call/history', { params });
  return response;
};
  
export const updateCallSettings = (callId, settings) => 
  ApiClient.put(`/call/${callId}/settings`, settings);
export const rejectCall = (callId) => 
  ApiClient.post(`/call/${callId}/reject`);
export const getCallById = (callId) => 
  ApiClient.get(`/call/${callId}`);
export const deleteCallHistory = (callId) => 
  ApiClient.delete(`/call/${callId}`);
export const clearCallHistory = () => 
  ApiClient.delete('/call/history');

