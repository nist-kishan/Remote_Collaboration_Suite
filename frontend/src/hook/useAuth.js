import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  changePassword,
  changePasswordWithLink,
  getCurrentUser,
  logout,
  resetPassword,
  sendOtp,
  signin,
  signup,
  toggleTheme,
  updateAvatar,
  updateProfile,
  verifyOtp,
} from "../api/authApi";
import { useDispatch, useSelector } from "react-redux";
import { setUser, clearUser, setLoading } from "../store/slice/authSlice";
import {toast} from "react-hot-toast";
import { useNavigate, useLocation } from "react-router-dom";
import { setLoggedOut } from "../api/ApiClient";

export const useSignUp = () => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (formData) => {
      const response = await signup(formData);
      return response;
    },
    onSuccess: (data) => {
      if (data.data.user) {
        dispatch(setUser({ user: data.data.user }));
        queryClient.invalidateQueries(["user"]);
        toast.success(data.data.message || data.message);
        setTimeout(() => navigate("/request-otp"), 700);
      } else {
        dispatch(clearUser());
        const errorMsg = data.data.message || data.message || "Signup failed. No user data found.";
        toast.error(errorMsg);
      }
    },
    onError: (error) => {
      dispatch(clearUser());
      const message = error?.response?.data?.message;
      if (message) {
        toast.error(message);
      }
    },
  });
};

export const useSignIn = () => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (credentials) => {
      const response = await signin(credentials);
      return response;
    },
    onSuccess: (data) => {
      if (data.data.user) {
        dispatch(setUser({ user: data.data.user }));
        queryClient.invalidateQueries(["user"]);
        toast.success(data.data.message || data.message);
        setTimeout(() => navigate("/"), 700);
      } else {
        dispatch(clearUser());
        const errorMsg = data.data.message || data.message || "Login failed. No user data found.";
        toast.error(errorMsg);
      }
    },
    onError: (error) => {
      dispatch(clearUser());
      
      let message = error?.response?.data?.message || 
                   error?.response?.data?.error || 
                   error?.message || 
                   'Sign in failed';
      
      if (message) {
        toast.error(message);
      }
    },
  });
};

export const useLogout = () => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async () => {
      const response = await logout();
      return response;
    },
    onSuccess: (data) => {
      dispatch(clearUser());
      queryClient.removeQueries({ queryKey: ["currentUser"], exact: true });
      queryClient.removeQueries({ queryKey: ["user"], exact: true });
      
      // Cancel any ongoing queries to prevent them from running after logout
      queryClient.cancelQueries({ queryKey: ["currentUser"] });
      queryClient.cancelQueries({ queryKey: ["user"] });
      
      // Set logout flag to prevent refresh token errors
      setLoggedOut(true);
      
      const message = data?.data?.message || data?.message || "Logged out successfully";
      toast.success(message);

      navigate("/login", { replace: true });
    },
    onError: (error) => {
      const message = error?.response?.data?.message;
      if (message) {
        toast.error(message);
      }
    },
  });
};

export const useCurrentUser = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  
  // Don't run auth check on auth pages
  const isAuthPage = ['/login', '/signup', '/reset-password'].includes(location.pathname) || 
                     location.pathname.startsWith('/reset-password/');
  
  const query = useQuery({
    queryKey: ["currentUser"],
    queryFn: getCurrentUser,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: (failureCount, error) => {
      // Don't retry on rate limit errors (429) or auth errors (401/403)
      if (error?.response?.status === 429 || 
          error?.response?.status === 401 || 
          error?.response?.status === 403) {
        return false;
      }
      // Retry up to 1 time for other errors
      return failureCount < 1;
    },
    retryDelay: 1000,
    enabled: !isAuthPage, // Only run on non-auth pages
  });

  // Update Redux loading state based on query status
  useEffect(() => {
    if (!isAuthPage) {
      if (query.isLoading) {
        dispatch(setLoading(true));
      } else if (query.isSuccess || query.isError) {
        dispatch(setLoading(false));
      }
    } else {
      // On auth pages, ensure loading is false
      dispatch(setLoading(false));
    }
  }, [query.isLoading, query.isSuccess, query.isError, isAuthPage, dispatch]);

  return query;
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profileData) => {
      const response = await updateProfile(profileData);
      return response;
    },
    onSuccess: (data) => {
      const message = data?.data?.message || data?.message;
      if (message) {
        toast.success(message);
      }
      queryClient.invalidateQueries(["user"]);
    },
    onError: (error) => {
      const message = error?.response?.data?.message;
      if (message) {
        toast.error(message);
      }
    },
  });
};

export const useUpdateAvatar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAvatar,
    onSuccess: (data) => {
      const message = data?.message || data?.data?.message;
      if (message) toast.success(message);
      queryClient.invalidateQueries(["user"]);
    },
    onError: (error) => {
      const message = error?.response?.data?.message;
      if (message) toast.error(message);
    },
  });
};

export const useChangePassword = () => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (passwordData) => {
      const response = await changePassword(passwordData);
      return response;
    },
    onSuccess: (data) => {
      const message = data?.message || data?.data?.message;
      if (message) {
        toast.success(message);
      }
      
      setTimeout(() => navigate("/profile"), 800);
    },
    onError: (error) => {
      const message = error?.response?.data?.message || 
                     error?.response?.data?.error || 
                     error?.message || 
                     'Failed to change password';
      
      if (message) {
        toast.error(message);
      }
    },
  });
};

export const useChangePasswordWithLink = (token) => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (newPassword) => changePasswordWithLink(token, newPassword),
    onSuccess: (data) => {
      const message = data?.message || data?.data?.message;
      if (message) toast.success(message);
      setTimeout(() => navigate("/"), 800);
    },
    onError: (error) => {
      const message = error?.response?.data?.message;
      if (message) toast.error(message);
    },
  });
};

export const useResetPassword = () =>
  useMutation({
    mutationFn: async (credentials) => {
      const response = await resetPassword(credentials);
      return response;
    },
    onSuccess: (data) => {
      const message = data?.message || data?.data?.message;
      if (message) {
        toast.success(message);
      }
    },
    onError: (error) => {
      const message = error?.response?.data?.message;
      if (message) {
        toast.error(message);
      }
    },
  });

export const useSendOtp = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  return useMutation({
    mutationFn: async () => {
      const otpData = { identifier: user?.email };
      const response = await sendOtp(otpData);
      return response;
    },
    onSuccess: (data) => {
      const message = data?.message || data?.data?.message;
      if (message) {
        toast.success(message);
      }
      setTimeout(() => navigate("/verification-otp"), 500);
    },
    onError: (error) => {
      const message = error?.response?.data?.message;
      if (message) {
        toast.error(message);
      }
    },
  });
};

export const useVerifyOtp = () => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: verifyOtp, 
    onSuccess: (data) => {
      const message = data?.message || data?.data?.message;
      if (message) toast.success(message);
      navigate("/");
    },
    onError: (err) => {
      const message = err?.response?.data?.message;
      if (message) toast.error(message);
    },
  });
};

export const useToggleTheme = () => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { user } = useSelector((state) => state.auth);

  return useMutation({
    mutationFn: async () => {
      const response = await toggleTheme();
      return response;
    },
    onSuccess: (data) => {
      if (data?.data?.theme !== undefined) {
        // Fix: Ensure user exists and properly merge theme
        if (user) {
          const updatedUser = { ...user, theme: data.data.theme };
          dispatch(setUser({ user: updatedUser }));
        }
        
        const message = data?.data?.message || data?.message;
        if (message) {
          toast.success(message);
        }
        queryClient.invalidateQueries({ queryKey: ["user"] });
      }
    },
    onError: (error) => {
      const message = error?.response?.data?.message;
      if (message) {
        toast.error(message);
      }
    },
  });
};
