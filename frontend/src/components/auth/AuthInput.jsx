import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, AlertCircle } from "lucide-react";

const AuthInput = ({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  required = false,
  icon: Icon,
  className = "",
  disabled = false,
  showPasswordToggle = false,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const inputType = showPasswordToggle && type === "password" 
    ? (showPassword ? "text" : "password") 
    : type;

  const hasValue = value && value.length > 0;
  const hasError = error && error.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`relative auth-input ${className}`}
    >
      {/* Label */}
      <motion.label
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </motion.label>

      {/* Input Container */}
      <motion.div
        className={`relative group ${hasError ? 'animate-shake' : ''}`}
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
      >
        {/* Input */}
        <motion.input
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`
            w-full py-2.5 rounded-lg border transition-all duration-300 px-3
            text-gray-900 dark:text-gray-100
            placeholder-gray-500 dark:placeholder-gray-400
            bg-gray-50 dark:bg-gray-800/50
            backdrop-blur-sm
            auth-input-focus
            ${hasError 
              ? 'border-red-500 bg-red-50 dark:bg-red-900/20 shadow-red-200 dark:shadow-red-900/20' 
              : isFocused 
                ? 'border-indigo-500 bg-white dark:bg-gray-700 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20' 
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-md'
            }
            ${Icon ? 'pl-10' : ''}
            ${(showPasswordToggle && type === "password" && !hasError) || hasError ? 'pr-10' : ''}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-text'}
            focus:outline-none focus:ring-2 focus:ring-indigo-500/20
            dark:focus:ring-indigo-400/20
            text-sm
          `}
          style={{
            transform: hasError ? "translateX(-2px)" : "translateX(0)",
          }}
        />

        {/* Icon */}
        {Icon && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className={`absolute left-4 top-1/2 transform -translate-y-1/2 ${
              hasError ? 'text-red-500' : 'text-gray-400 group-hover:text-indigo-500'
            } transition-colors duration-200 z-10`}
          >
            <Icon className="w-4 h-4" />
          </motion.div>
        )}

        {/* Password Toggle - Only show when no error */}
        {showPasswordToggle && type === "password" && !hasError && (
          <motion.button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors duration-200 z-10"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </motion.button>
        )}

        {/* Error Icon - Only show when there's an error */}
        {hasError && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-red-500 dark:text-red-400 z-10"
          >
            <AlertCircle className="w-4 h-4" />
          </motion.div>
        )}
      </motion.div>

      {/* Error Message */}
      <AnimatePresence>
        {hasError && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2 mt-2 text-sm text-red-600 dark:text-red-400"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AuthInput;