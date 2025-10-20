import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertCircle, Info, X, AlertTriangle } from "lucide-react";

const AuthAlert = ({
  type = "info",
  title,
  message,
  onClose,
  show = true,
  className = "",
}) => {
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const colors = {
    success: {
      bg: "bg-green-50 dark:bg-green-900/30",
      border: "border-green-200 dark:border-green-700",
      text: "text-green-800 dark:text-green-200",
      icon: "text-green-600 dark:text-green-400",
    },
    error: {
      bg: "bg-red-50 dark:bg-red-900/30",
      border: "border-red-200 dark:border-red-700",
      text: "text-red-800 dark:text-red-200",
      icon: "text-red-600 dark:text-red-400",
    },
    warning: {
      bg: "bg-yellow-50 dark:bg-yellow-900/30",
      border: "border-yellow-200 dark:border-yellow-700",
      text: "text-yellow-800 dark:text-yellow-200",
      icon: "text-yellow-600 dark:text-yellow-400",
    },
    info: {
      bg: "bg-blue-50 dark:bg-blue-900/30",
      border: "border-blue-200 dark:border-blue-700",
      text: "text-blue-800 dark:text-blue-200",
      icon: "text-blue-600 dark:text-blue-400",
    },
  };

  const Icon = icons[type];
  const colorScheme = colors[type];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0, y: -20 }}
          animate={{ opacity: 1, height: "auto", y: 0 }}
          exit={{ opacity: 0, height: 0, y: -20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={`
            rounded-xl border-2 p-4 mb-4
            ${colorScheme.bg} ${colorScheme.border}
            ${className}
          `}
        >
          <div className="flex items-start gap-3">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.1, duration: 0.4, type: "spring", stiffness: 200 }}
              className={`flex-shrink-0 ${colorScheme.icon}`}
            >
              <Icon className="w-5 h-5" />
            </motion.div>

            <div className="flex-1 min-w-0">
              {title && (
                <motion.h4
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className={`text-sm font-semibold ${colorScheme.text} mb-1`}
                >
                  {title}
                </motion.h4>
              )}
              
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className={`text-sm ${colorScheme.text}`}
              >
                {message}
              </motion.p>
            </div>

            {onClose && (
              <motion.button
                onClick={onClose}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className={`
                  flex-shrink-0 p-1 rounded-full
                  ${colorScheme.icon} hover:bg-black/10 dark:hover:bg-white/10
                  transition-colors duration-200
                `}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-4 h-4" />
              </motion.button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuthAlert;
