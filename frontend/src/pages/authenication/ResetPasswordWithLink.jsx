import { useState } from "react";
import { motion } from "framer-motion";
import { useParams } from "react-router-dom";
import { useChangePasswordWithLink } from "../../hook/useAuth";
import { AuthContainer, AuthInput, AuthButton, AuthLink, AuthAlert } from "../../components/auth";
import { Lock, ArrowRight, Shield } from "lucide-react";

export default function ResetPasswordWithLink() {
  const { token } = useParams();
  const { mutate: changePassword, isLoading } = useChangePasswordWithLink(token);

  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const validateForm = () => {
    const errors = {};
    
    if (!formData.newPassword) {
      errors.newPassword = "Password is required";
    } else if (formData.newPassword.length < 6) {
      errors.newPassword = "Password must be at least 6 characters";
    }
    
    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (formData.newPassword !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleReset = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setError("");
    changePassword(formData.newPassword);
  };

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    // Clear field error when user starts typing
    if (fieldErrors[key]) {
      setFieldErrors((prev) => ({ ...prev, [key]: "" }));
    }
  };

  return (
    <AuthContainer
      title="Set New Password"
      subtitle="Enter your new password to complete the reset process"
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
        className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 mb-6"
      >
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-green-800 dark:text-green-200 font-medium mb-1">
              Secure Reset Link
            </p>
            <p className="text-xs text-green-700 dark:text-green-300">
              This is a secure password reset link. Choose a strong password to protect your account.
            </p>
          </div>
        </div>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.5 }}
        onSubmit={handleReset}
        className="space-y-6"
      >
        {/* New Password Input */}
        <AuthInput
          label="New Password"
          type="password"
          placeholder="Enter your new password"
          value={formData.newPassword}
          onChange={(e) => handleChange("newPassword", e.target.value)}
          error={fieldErrors.newPassword}
          required
          icon={Lock}
          showPasswordToggle
          disabled={isLoading}
        />

        {/* Confirm Password Input */}
        <AuthInput
          label="Confirm New Password"
          type="password"
          placeholder="Confirm your new password"
          value={formData.confirmPassword}
          onChange={(e) => handleChange("confirmPassword", e.target.value)}
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
          {isLoading ? "Updating Password..." : "Reset Password"}
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
          <AuthLink to="/login" variant="muted">
            Back to Sign In
          </AuthLink>
        </div>
      </motion.div>
    </AuthContainer>
  );
}
