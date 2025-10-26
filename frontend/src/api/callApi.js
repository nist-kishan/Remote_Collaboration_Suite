import ApiClient from "./ApiClient";

export const startCall = async (payload) => {
  try {
    const { data } = await ApiClient.post("/call/start", payload);
    return data;
  } catch (error) {
    throw new Error(error?.response?.data?.message || "Failed to start call");
  }
};

export const joinCall = async (callId) => {
  try {
    const { data } = await ApiClient.post(`/call/${callId}/join`);
    return data;
  } catch (error) {
    throw new Error(error?.response?.data?.message || "Failed to join call");
  }
};

export const endCall = async (callId) => {
  try {
    const { data } = await ApiClient.post(`/call/${callId}/end`);
    return data;
  } catch (error) {
    throw new Error(error?.response?.data?.message || "Error ending call");
  }
};

export const rejectCall = async (callId) => {
  try {
    const { data } = await ApiClient.post(`/call/${callId}/reject`);
    return data;
  } catch (error) {
    throw new Error(error?.response?.data?.message || "Failed to reject call");
  }
};

export const markCallAsMissed = async (callId) => {
  try {
    const { data } = await ApiClient.post(`/call/${callId}/missed`);
    return data;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Error marking missed call"
    );
  }
};

export const cleanupMissedCalls = async () => {
  try {
    const { data } = await ApiClient.post(`/call/cleanup-missed`);
    return data;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Failed to clean up missed calls"
    );
  }
};

export const updateCallSettings = async (callId, settings) => {
  try {
    const { data } = await ApiClient.put(`/call/${callId}/settings`, settings);
    return data;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Error updating call settings"
    );
  }
};

export const getCallById = async (callId) => {
  try {
    const { data } = await ApiClient.get(`/call/${callId}`);
    return data;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Error fetching call details"
    );
  }
};

export const getCallHistory = async (params = {}) => {
  try {
    const { data } = await ApiClient.get(`/call/history`, { params });
    return data;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Failed to load call history"
    );
  }
};

export const deleteCall = async (callId) => {
  try {
    const { data } = await ApiClient.delete(`/call/${callId}`);
    return data;
  } catch (error) {
    throw new Error(error?.response?.data?.message || "Error deleting call");
  }
};

export const clearCallHistory = async () => {
  try {
    const { data } = await ApiClient.delete(`/call/history`);
    return data;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Failed to clear call history"
    );
  }
};
