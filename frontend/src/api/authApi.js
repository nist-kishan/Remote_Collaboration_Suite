import ApiClient from "./ApiClient";

// Test function to verify backend connection
export const testBackendConnection = async () => {
  try {
    console.log('🔍 Testing backend connection...');
    const response = await ApiClient.get("/health");
    console.log('✅ Backend connection successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Backend connection failed:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      url: error.config?.url,
      baseURL: error.config?.baseURL
    });
    throw error;
  }
};

export const signup = async (formData) => {
  try {
    const response = await ApiClient.post("/auth/signup", formData);
    return response.data;
  } catch (error) {
    throw error.response || error;
  }
};

export const signin = async (data) => {
  try {
    const response = await ApiClient.post("/auth/signin", data);
    return response.data;
  } catch (error) {
    throw error.response || error;
  }
};

export const resetPassword = async (data) => {
  try {
    console.log('🔍 Reset Password API Call:', {
      url: '/auth/reset_password',
      data: data,
      baseURL: ApiClient.defaults.baseURL
    });
    const response = await ApiClient.post("/auth/reset_password", data);
    console.log('✅ Reset Password Success:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Reset Password Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      url: error.config?.url,
      baseURL: error.config?.baseURL
    });
    throw error.response || error;
  }
};

export const changePasswordWithLink = async (token, newPassword) => {
  try {
    const response = await ApiClient.post(
      `/auth/password_change_link/${token}`,
      { newPassword } 
    );
    return response.data;
  } catch (error) {
    throw error.response || error;
  }
};

export const logout = async () => {
  try {
    const response = await ApiClient.post("/auth/logout");
    return response.data;
  } catch (error) {
    throw error.response || error;
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await ApiClient.get("/auth/me");
    return response.data;
  } catch (error) {
    throw error.response || error;
  }
};

export const refreshToken = async () => {
  try {
    const response = await ApiClient.get("/auth/refresh_token");
    return response.data;
  } catch (error) {
    throw error.response || error;
  }
};

export const updateProfile = async (data) => {
  try {
    const response = await ApiClient.put("/auth/update-profile", data);
    return response.data; 
  } catch (error) {
    throw error.response || error; 
  }
};

export const updateAvatar = async (formData) => {
  try {
    const response = await ApiClient.post("/auth/update_avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    throw error.response || error;
  }
};

export const changePassword = async ({ password, newPassword }) => {
  try {
    const response = await ApiClient.post("/auth/password_change", {
      password,
      newPassword,
    });
    return response.data;
  } catch (error) {
    throw error.response || error;
  }
};


export const sendOtp = async () => {
  try {
    const response = await ApiClient.post("/auth/send_otp");
    return response.data;
  } catch (error) {
    throw error.response || error;
  }
};

export const verifyOtp = async (otp) => {
  try {
    const response = await ApiClient.post("/auth/otp_verification", { otp });
    return response.data;
  } catch (error) {
    throw error.response || error;
  }
};

export const toggleTheme = async () => {
  try {
    const response = await ApiClient.put("/auth/theme");
    return response.data;
  } catch (error) {
    throw error.response || error;
  }
};
