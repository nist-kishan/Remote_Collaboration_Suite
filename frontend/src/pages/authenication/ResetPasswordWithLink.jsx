/* eslint-disable no-unused-vars */
import { useState } from "react";
import { motion } from "framer-motion";
import { useParams } from "react-router-dom";
import { useChangePasswordWithLink } from "../../hook/useAuth";

export default function ResetPasswordWithLink() {
  const { token } = useParams();
  const { mutate: changePassword, isLoading } =
    useChangePasswordWithLink(token);

  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");

  const handleReset = (e) => {
    e.preventDefault();
    if (!newPassword) {
      setError("Password is required");
      return;
    }
    setError("");
    changePassword(newPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 transition duration-500 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-lg w-full max-w-md border border-gray-200 dark:border-gray-800"
      >
        <h1 className="text-2xl font-bold text-center text-indigo-700 dark:text-indigo-400 mb-5">
          Reset Your Password
        </h1>

        {error && (
          <div className="mb-3 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-2 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleReset}>
          <input
            type="password"
            placeholder="Enter New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <button
            type="submit"
            disabled={isLoading}
            className="mt-4 w-full py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-semibold rounded-md transition disabled:opacity-60"
          >
            {isLoading ? "Updating..." : "Reset Password"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
