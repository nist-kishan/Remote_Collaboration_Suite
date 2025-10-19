import React from "react";
import { motion } from "framer-motion";
import Card from "../ui/Card";
import Button from "../ui/Button";

export default function AuthForm({ 
  title,
  children,
  onSubmit,
  submitText = "Submit",
  loading = false,
  error,
  footer,
  className = ""
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 transition-colors duration-500 p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-sm"
      >
        <Card className={`${className}`}>
          <form onSubmit={onSubmit} className="space-y-4">
            <h1 className="text-2xl font-bold text-center mb-6 text-indigo-700 dark:text-indigo-400">
              {title}
            </h1>

            {error && (
              <div className="p-3 text-sm rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-700">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {children}
            </div>

            <Button
              type="submit"
              loading={loading}
              disabled={loading}
              className="w-full"
              size="md"
            >
              {submitText}
            </Button>

            {footer && (
              <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                {footer}
              </div>
            )}
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
