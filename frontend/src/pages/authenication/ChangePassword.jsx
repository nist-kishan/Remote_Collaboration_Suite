import { useState } from "react";
import { motion } from "framer-motion";
import { useChangePassword } from "../../hook/useAuth";
import { AuthContainer, AuthInput, AuthButton, AuthLink, AuthAlert } from "../../components/auth";
import { Lock, ArrowRight, Key } from "lucide-react";

export default function ChangePassword() {
  const { mutate: changePassword, isLoading } = useChangePassword();

  const [formData, setFormData] = useState({
    password: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const validateForm = () => {
    const errors = {};
    
    if (!formData.password) {
      errors.password = "Current password is required";
    }
    
    if (!formData.newPassword) {
      errors.newPassword = "New password is required";
    } else if (formData.newPassword.length < 6) {
      errors.newPassword = "New password must be at least 6 characters";
    }
    
    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (formData.newPassword !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }
    
    if (formData.password === formData.newPassword) {
      errors.newPassword = "New password must be different from current password";
    }
    
    setFieldErrors(errors);
    setError("");
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    changePassword({
      password: formData.password,
      newPassword: formData.newPassword,
    });
  };

  return (
    <AuthContainer
      title="Change Password"
      subtitle="Update your password to keep your account secure"
    >
      {/* Error Alert */}
      {error && (
        <AuthAlert
          type="error"
          message={error}
          onClose={() => setError("")}
        />
      )}

      {/* Security Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-6"
      >
        <div className="flex items-start gap-3">
          <Key className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-1">
              Password Security
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Choose a strong password with at least 6 characters for better security.
            </p>
          </div>
        </div>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.5 }}
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {/* Current Password */}
        <AuthInput
          label="Current Password"
          type="password"
          placeholder="Enter your current password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          error={fieldErrors.password}
          required
          icon={Lock}
          showPasswordToggle
          disabled={isLoading}
        />

        {/* New Password */}
        <AuthInput
          label="New Password"
          type="password"
          placeholder="Enter your new password"
          value={formData.newPassword}
          onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
          error={fieldErrors.newPassword}
          required
          icon={Lock}
          showPasswordToggle
          disabled={isLoading}
        />

        {/* Confirm Password */}
        <AuthInput
          label="Confirm New Password"
          type="password"
          placeholder="Confirm your new password"
          value={formData.confirmPassword}
          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          error={fieldErrors.confirmPassword}
          required
          icon={Lock}
          showPasswordToggle
          disabled={isLoading}
        />

        {/* Submit Button */}
        <AuthButton
          type="submit"
          loading={isLoading}
          disabled={isLoading}
          icon={ArrowRight}
          className="w-full"
        >
          {isLoading ? "Updating Password..." : "Update Password"}
        </AuthButton>
      </motion.form>

      {/* Footer Links */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1, duration: 0.5 }}
        className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700"
      >
        <div className="text-center">
          <AuthLink to="/profile" variant="muted">
            ← Back to Profile
          </AuthLink>
        </div>
      </motion.div>
    </AuthContainer>
  );
}
