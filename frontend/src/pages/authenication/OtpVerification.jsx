/* eslint-disable no-unused-vars */
import { useState } from "react";
import { motion } from "framer-motion";
import { useVerifyOtp, useSendOtp } from "../../hook/useAuth";
import { useSelector } from "react-redux";

export default function VerificationOtp() {
  const { user } = useSelector((state) => state.auth);
  const [otp, setOtp] = useState("");

  const { mutate: verifyOtp, isLoading: isVerifying } = useVerifyOtp();
  const { mutate: resendOtp, isLoading: isResending } = useSendOtp();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!otp) return;

    verifyOtp({ otp });
  };

  const handleResend = () => {
    if (!user?.email) return;
    resendOtp({ identifier: user.email });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 transition-colors duration-500">
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-xl w-full max-w-sm border border-gray-200 dark:border-gray-800 text-center"
      >
        <h1 className="text-2xl font-bold text-indigo-700 dark:text-indigo-400 mb-5">
          Verify OTP
        </h1>

        <p className="mb-4 text-gray-700 dark:text-gray-300 text-sm">
          Enter the OTP sent to:{" "}
          <span className="font-semibold">{user?.email}</span>
        </p>

        <input
          type="text"
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          disabled={isVerifying}
          className="w-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-2.5 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
        />

        <button
          type="submit"
          disabled={isVerifying}
          className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white py-2.5 rounded-md font-semibold text-sm transition-transform hover:scale-[1.02] disabled:opacity-60 mb-3"
        >
          {isVerifying ? "Verifying..." : "Verify OTP"}
        </button>

        <button
          type="button"
          onClick={handleResend}
          disabled={isResending}
          className="w-full text-center text-indigo-600 dark:text-indigo-400 font-medium hover:underline text-sm"
        >
          {isResending ? "Resending..." : "Resend OTP"}
        </button>
      </motion.form>
    </div>
  );
}
