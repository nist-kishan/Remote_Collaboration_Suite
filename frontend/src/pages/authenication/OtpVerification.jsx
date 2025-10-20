import { useState } from "react";
import { motion } from "framer-motion";
import { useVerifyOtp, useSendOtp } from "../../hook/useAuth";
import { useSelector } from "react-redux";
import { AuthContainer, AuthInput, AuthButton, AuthLink, AuthAlert } from "../../components/auth";
import { Shield, Mail, ArrowRight, RefreshCw } from "lucide-react";

export default function VerificationOtp() {
  const { user } = useSelector((state) => state.auth);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  const { mutate: verifyOtp, isLoading: isVerifying } = useVerifyOtp();
  const { mutate: resendOtp, isLoading: isResending } = useSendOtp();

  const validateOtp = () => {
    if (!otp.trim()) {
      setError("Please enter the OTP");
      return false;
    }
    if (otp.length !== 6) {
      setError("OTP must be 6 digits");
      return false;
    }
    setError("");
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateOtp()) {
      return;
    }

    verifyOtp({ otp });
  };

  const handleResend = () => {
    if (!user?.email) {
      setError("No email found. Please try again.");
      return;
    }
    setError("");
    resendOtp();
  };

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
    if (error) setError("");
  };

  return (
    <AuthContainer
      title="Enter Verification Code"
      subtitle="Please enter the 6-digit code sent to your email"
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
            <p className="text-sm text-gray-600 dark:text-gray-400">Code sent to:</p>
            <p className="font-semibold text-gray-900 dark:text-gray-100">{user?.email}</p>
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
        {/* OTP Input */}
        <AuthInput
          label="Verification Code"
          type="text"
          placeholder="Enter 6-digit code"
          value={otp}
          onChange={handleOtpChange}
          error={error}
          required
          icon={Shield}
          disabled={isVerifying}
          className="[&>div>div>input]:text-center [&>div>div>input]:text-2xl [&>div>div>input]:tracking-widest [&>div>div>input]:font-mono [&>div>div>input]:text-center"
        />

        {/* Verify Button */}
        <AuthButton
          type="submit"
          loading={isVerifying}
          disabled={isVerifying || !otp || otp.length !== 6}
          icon={ArrowRight}
          className="w-full"
        >
          {isVerifying ? "Verifying..." : "Verify Code"}
        </AuthButton>
      </motion.form>

      {/* Resend Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1, duration: 0.5 }}
        className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700"
      >
        <div className="text-center space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Didn't receive the code?
          </p>
          
          <AuthButton
            type="button"
            onClick={handleResend}
            loading={isResending}
            disabled={isResending}
            variant="outline"
            icon={RefreshCw}
            className="w-full"
          >
            {isResending ? "Resending..." : "Resend Code"}
          </AuthButton>
          
          <AuthLink to="/request-otp" variant="muted">
            Change email address
          </AuthLink>
        </div>
      </motion.div>
    </AuthContainer>
  );
}
