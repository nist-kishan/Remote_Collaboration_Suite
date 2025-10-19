import React from "react";
import { Link } from "react-router-dom";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

export default function PageNotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 px-4">
      <motion.div
        className="text-center max-w-lg"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* 404 Text */}
        <h1 className="text-8xl font-extrabold text-gray-800 dark:text-gray-200">
          404
        </h1>

        {/* Subtitle */}
        <p className="mt-4 text-xl font-medium text-gray-600 dark:text-gray-400">
          Oops! The page you're looking for doesn’t exist.
        </p>

        {/* Description */}
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          It might have been removed, renamed, or did not exist in the first
          place.
        </p>

        {/* Button */}
        <div className="mt-6">
          <Link
            to="/"
            className="px-6 py-3 text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-2xl shadow-lg transition-all"
          >
            Go Back Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
