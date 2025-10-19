/* eslint-disable no-unused-vars */
import { useState } from "react";
import { motion } from "framer-motion";
import { useChangePassword } from "../../hook/useAuth";

export default function ChangePassword() {
  const { mutate: changePassword, isLoading } = useChangePassword();

  const [formData, setFormData] = useState({
    password: "",
    newPassword: "",
  });

  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!formData.password || !formData.newPassword) {
      setError("All fields are required.");
      return;
    }
    if (formData.newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }
    changePassword(formData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-indigo-50 to-indigo-100 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 transition duration-500 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white dark:bg-gray-900 w-full max-w-md p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800"
      >
        <h2 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 text-center mb-6">
          Change Password
        </h2>

        {error && (
          <div className="mb-4 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-2 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Current Password
          </label>
          <input
            type="password"
            placeholder="Enter current password"
            className="w-full p-2 mb-4 border rounded-md bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-200 focus:ring-indigo-500"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
          />

          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            New Password
          </label>
          <input
            type="password"
            placeholder="Enter new password"
            className="w-full p-2 mb-4 border rounded-md bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-200 focus:ring-indigo-500"
            value={formData.newPassword}
            onChange={(e) =>
              setFormData({ ...formData, newPassword: e.target.value })
            }
          />

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-md font-semibold transition disabled:opacity-60"
          >
            {isLoading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
