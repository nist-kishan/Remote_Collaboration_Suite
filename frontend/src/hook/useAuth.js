import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { setUser, clearUser } from "../store/slice/authSlice";
import {toast} from "react-hot-toast";
import { useNavigate } from "react-router-dom";

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
        toast.success(`Welcome, ${data.data.user.name || "User"}! 🎉`);
        setTimeout(() => navigate("/request-otp"), 700);
      } else {
        dispatch(clearUser());
        toast.error("Signup failed. No user data found.");
      }
    },
    onError: (error) => {
      dispatch(clearUser());
      const message =
        error?.data?.message || "Signup failed. Please try again.";
      toast.error(message);
    },
  });
};

export const useSignIn = () => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: signin,
    onSuccess: (data) => {
      if (data.data.user) {
        dispatch(setUser({ user: data.data.user }));
        queryClient.invalidateQueries(["user"]);
        toast.success(`Welcome back, ${data.data.user.name || "User"} 👋`);
        setTimeout(() => navigate("/"), 700);
      } else {
        dispatch(clearUser());
        toast.error("Login failed. No user data found.");
      }
    },
    onError: (error) => {
      dispatch(clearUser());
      const message =
        error?.data?.message || "Invalid credentials or server error.";
      toast.error(message);
    },
  });
};

export const useLogout = () => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      dispatch(clearUser());
      queryClient.removeQueries({ queryKey: ["user"], exact: true });
      toast.success("Logged out successfully");

      navigate("/login", { replace: true });
    },
    onError: (error) => {
      const message =
        error?.response?.data?.message || "Logout failed. Please try again.";
      toast.error(message);
    },
  });
};

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: getCurrentUser,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: (failureCount, error) => {
      // Don't retry on rate limit errors (429) or auth errors (401/403)
      if (error?.response?.status === 429 || 
          error?.response?.status === 401 || 
          error?.response?.status === 403) {
        return false;
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: true, // Always enabled, let the API handle auth
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      // Ensure we only pass strings to toast
      const message = typeof data?.message === 'string' ? data.message : "Profile updated successfully ✅";
      toast.success(message);
      queryClient.invalidateQueries(["user"]);
    },
    onError: (error) => {
      const errorMessage = error?.response?.data?.message || "Failed to update profile ❌";
      toast.error(errorMessage);
    },
  });
};

export const useUpdateAvatar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAvatar,
    onSuccess: (data) => {
      // Ensure we only pass strings to toast
      const message = typeof data?.message === 'string' ? data.message : "Profile picture updated ✅";
      toast.success(message);
      queryClient.invalidateQueries(["user"]);
    },
    onError: (error) => {
      const errorMessage = error?.data?.message || "Failed to update profile picture ❌";
      toast.error(errorMessage);
    },
  });
};

export const useChangePassword = () => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: changePassword,
    onSuccess: (data) => {
      toast.success(data?.message || "Password updated successfully ✅");
      setTimeout(() => navigate("/profile"), 800);
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message || "Failed to update password ❌"
      );
    },
  });
};

export const useChangePasswordWithLink = (token) => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (newPassword) => changePasswordWithLink(token, newPassword),
    onSuccess: (data) => {
      toast.success(data?.message || "Password reset successful!");
      setTimeout(() => navigate("/"), 800);
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message || "Failed to reset password."
      );
    },
  });
};

export const useResetPassword = () =>
  useMutation({
    mutationFn: resetPassword,
    onSuccess: (data) => {
      toast.success(data?.message || "Password reset request successful!");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Password reset failed.");
    },
  });

export const useSendOtp = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  return useMutation({
    mutationFn: () => sendOtp({ identifier: user?.email }), // auto attach email
    onSuccess: (data) => {
      toast.success(data?.message || "OTP sent successfully!");
      setTimeout(() => navigate("/verification-otp"), 500);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to send OTP.");
    },
  });
};

export const useVerifyOtp = () => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: verifyOtp, 
    onSuccess: (data) => {
      toast.success(data?.message || "OTP verified successfully!");
      navigate("/");
    },
    onError: (err) => {
      const message =
        err?.data?.message;
      toast.error(message);
    },
  });
};

export const useToggleTheme = () => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { user } = useSelector((state) => state.auth);

  return useMutation({
    mutationFn: toggleTheme,
    onSuccess: (data) => {
      if (data?.data?.theme !== undefined) {
        dispatch(setUser({ ...user, theme: data.data.theme }));
        toast.success("Theme updated successfully");
        queryClient.invalidateQueries({ queryKey: ["user"] });
      }
    },
    onError: (error) => {
      const message =
        error?.response?.data?.message;
      toast.error(message);
    },
  });
};
