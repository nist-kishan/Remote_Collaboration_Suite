import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useSendOtp } from "../../hook/useAuth";
import { useSelector } from "react-redux";
import { AuthContainer, AuthButton, AuthLink, AuthAlert } from "../../components/auth";
import { Mail, ArrowRight, Shield } from "lucide-react";

export default function RequestOtp() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const email = user?.email || "";

  const { mutate: sendOtp, isLoading } = useSendOtp();
  const [error, setError] = useState("");

  const handleSendOtp = (e) => {
    e.preventDefault();

    if (!email) {
      setError("No email found. Please login first.");
      return;
    }

    setError("");
    sendOtp();
  };

  return (
    <AuthContainer
      title="Verify Your Email"
      subtitle="We'll send you a verification code to confirm your email address"
    >
      {/* Error Alert */}
      {error && (
        <AuthAlert
          type="error"
          message={error}
          onClose={() => setError("")}
        />
      )}

      {/* Email Display */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-6"
      >
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.8, duration: 0.4, type: "spring", stiffness: 200 }}
            className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center"
          >
            <Mail className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </motion.div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">We'll send the OTP to:</p>
            <p className="font-semibold text-gray-900 dark:text-gray-100">{email}</p>
          </div>
        </div>
      </motion.div>

      {/* Security Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.5 }}
        className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-6"
      >
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-1">
              Secure Verification
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              The OTP will expire in 5 minutes for your security.
            </p>
          </div>
        </div>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0, duration: 0.5 }}
        onSubmit={handleSendOtp}
        className="space-y-6"
      >
        {/* Send OTP Button */}
        <AuthButton
          type="submit"
          loading={isLoading}
          disabled={isLoading || !email}
          icon={ArrowRight}
          className="w-full"
        >
          {isLoading ? "Sending OTP..." : "Send Verification Code"}
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
          <AuthLink 
            onClick={() => navigate("/")} 
            variant="muted"
          >
            Back to Dashboard
          </AuthLink>
        </div>
      </motion.div>
    </AuthContainer>
  );
}
