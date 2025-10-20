import { useState } from "react";
import { motion } from "framer-motion";
import { useResetPassword } from "../../hook/useAuth";
import { AuthContainer, AuthInput, AuthButton, AuthLink, AuthAlert } from "../../components/auth";
import { Mail, ArrowRight, Key } from "lucide-react";

export default function ResetPassword() {
  const { mutate: resetPassword, isLoading } = useResetPassword();
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [error, setError] = useState("");

  const validateForm = () => {
    if (!emailOrUsername.trim()) {
      setError("Please enter your email or username");
      return false;
    }
    setError("");
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    resetPassword({ credential: emailOrUsername });
  };

  return (
    <AuthContainer
      title="Reset Password"
      subtitle="Enter your email or username to receive a password reset link"
    >
      {/* Error Alert */}
      {error && (
        <AuthAlert
          type="error"
          message={error}
          onClose={() => setError("")}
        />
      )}

      {/* Info Card */}
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
              Password Reset Instructions
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              We'll send you a secure link to reset your password. Check your email after submitting.
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
        {/* Email/Username Input */}
        <AuthInput
          label="Email or Username"
          type="text"
          placeholder="Enter your email or username"
          value={emailOrUsername}
          onChange={(e) => {
            setEmailOrUsername(e.target.value);
            if (error) setError("");
          }}
          error={error}
          required
          icon={Mail}
          disabled={isLoading}
        />

        {/* Submit Button */}
        <AuthButton
          type="submit"
          loading={isLoading}
          disabled={isLoading || !emailOrUsername.trim()}
          icon={ArrowRight}
          className="w-full"
        >
          {isLoading ? "Sending Reset Link..." : "Send Reset Link"}
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
            Remember your password? Sign in
          </AuthLink>
        </div>
      </motion.div>
    </AuthContainer>
  );
}
