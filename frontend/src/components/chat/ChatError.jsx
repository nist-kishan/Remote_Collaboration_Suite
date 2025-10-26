import React from "react";
import { RefreshCw, AlertTriangle } from "lucide-react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

export default function ChatError({ error, onRetry, className = "" }) {
  return (
    <div
      className={`flex-1 flex flex-col items-center justify-center px-4 ${className}`}
    >
      {/* Animated Icon */}
      <motion.div
        initial={{ rotate: -10, opacity: 0, scale: 0.8 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, type: "spring" }}
        className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-4"
      >
        <AlertTriangle className="w-8 h-8 text-red-500 dark:text-red-400" />
      </motion.div>

      {/* Error Message */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center"
      >
        <p className="text-lg font-semibold text-red-600 dark:text-red-400">
          Failed to load messages
        </p>
        <p className="text-gray-600 dark:text-gray-400 text-sm mt-2 max-w-xs mx-auto">
          {error || "Something went wrong. Please try again."}
        </p>
      </motion.div>

      {/* Retry Button */}
      {onRetry && (
        <motion.button
          onClick={onRetry}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="mt-5 flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 text-white font-medium shadow-md hover:shadow-lg transition"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </motion.button>
      )}
    </div>
  );
}
