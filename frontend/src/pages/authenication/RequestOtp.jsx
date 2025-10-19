/* eslint-disable no-unused-vars */
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useSendOtp } from "../../hook/useAuth";
import { useSelector } from "react-redux";
import { useState } from "react";

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 transition-colors duration-500">
      <motion.form
        onSubmit={handleSendOtp}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-xl w-full max-w-sm border border-gray-200 dark:border-gray-800"
      >
        <h1 className="text-2xl font-bold text-center mb-5 text-indigo-700 dark:text-indigo-400">
          Confirm Email
        </h1>

        {error && (
          <div className="mb-3 p-2 text-sm rounded-md bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-700">
            {error}
          </div>
        )}

        <p className="text-center mb-5 text-gray-800 dark:text-gray-200">
          We will send an OTP to: <span className="font-semibold">{email}</span>
        </p>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white py-2.5 rounded-md font-semibold text-sm transition-transform hover:scale-[1.02] disabled:opacity-60 mb-3"
        >
          {isLoading ? "Sending OTP..." : "Send OTP"}
        </button>

        <button
          type="button"
          onClick={() => navigate("/")}
          className="w-full text-center text-indigo-600 dark:text-indigo-400 font-medium hover:underline text-sm"
        >
          Cancel
        </button>
      </motion.form>
    </div>
  );
}
