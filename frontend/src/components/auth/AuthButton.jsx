import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useState } from "react";

const AuthButton = ({
  children,
  type = "button",
  onClick,
  loading = false,
  disabled = false,
  variant = "primary",
  size = "md",
  className = "",
  icon: Icon,
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const baseClasses = `
    relative inline-flex items-center justify-center gap-1
    font-medium rounded-md transition-all duration-300
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    transform active:scale-95
    backdrop-blur-sm
    border
  `;

  const variants = {
    primary: `
      bg-indigo-600 hover:bg-indigo-700
      dark:bg-indigo-500 dark:hover:bg-indigo-600
      text-white shadow-lg hover:shadow-xl
      focus:ring-indigo-500 dark:focus:ring-indigo-400
      border border-indigo-600 dark:border-indigo-500
    `,
    secondary: `
      bg-gray-100 dark:bg-gray-700
      hover:bg-gray-200 dark:hover:bg-gray-600
      text-gray-900 dark:text-gray-100
      focus:ring-gray-500 dark:focus:ring-gray-400
    `,
    danger: `
      bg-red-500 hover:bg-red-600
      dark:bg-red-600 dark:hover:bg-red-700
      text-white shadow-lg hover:shadow-xl
      focus:ring-red-500 dark:focus:ring-red-400
    `,
    outline: `
      border-2 border-indigo-600 dark:border-indigo-400
      bg-transparent hover:bg-indigo-50 dark:hover:bg-indigo-900/30
      text-indigo-600 dark:text-indigo-400
      hover:text-indigo-700 dark:hover:text-indigo-300
      focus:ring-indigo-500 dark:focus:ring-indigo-400
    `,
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-sm",
  };

  const buttonClasses = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;

  const handleClick = (e) => {
    if (!disabled && !loading && onClick) {
      setIsPressed(true);
      setTimeout(() => setIsPressed(false), 150);
      onClick(e);
    }
  };

  return (
    <motion.button
      type={type}
      onClick={handleClick}
      disabled={disabled || loading}
      className={`${buttonClasses} auth-button-hover`}
      whileHover={{ 
        scale: disabled || loading ? 1 : 1.02,
        y: disabled || loading ? 0 : -2,
        boxShadow: disabled || loading ? "none" : "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)"
      }}
      whileTap={{ 
        scale: disabled || loading ? 1 : 0.95,
        y: disabled || loading ? 0 : 1,
        boxShadow: disabled || loading ? "none" : "0 5px 15px rgba(0,0,0,0.2)"
      }}
      animate={{
        scale: isPressed ? 0.95 : 1,
        y: isPressed ? 1 : 0,
        boxShadow: isPressed ? "0 5px 15px rgba(0,0,0,0.2)" : "0 4px 6px rgba(0,0,0,0.1)",
        opacity: 1
      }}
      transition={{ 
        type: "spring", 
        stiffness: 400, 
        damping: 10,
        duration: 0.1
      }}
      initial={{ opacity: 0, y: 10 }}
    >
      {/* Loading Spinner */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ 
          opacity: loading ? 1 : 0, 
          scale: loading ? 1 : 0,
          rotate: loading ? 360 : 0 
        }}
        transition={{ 
          duration: 0.3,
          rotate: { duration: 1, repeat: loading ? Infinity : 0, ease: "linear" }
        }}
        className="absolute left-4"
      >
        <Loader2 className="w-5 h-5" />
      </motion.div>

      {/* Icon */}
      {Icon && !loading && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Icon className="w-5 h-5" />
        </motion.div>
      )}

      {/* Button Text */}
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className={loading ? "ml-6" : ""}
      >
        {children}
      </motion.span>

      {/* Loading Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: loading ? 0.8 : 0 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 bg-white/20 dark:bg-black/20 rounded-xl"
      />

      {/* Click Ripple Effect */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: isPressed ? 1 : 0, 
          opacity: isPressed ? 0.3 : 0 
        }}
        transition={{ duration: 0.15 }}
        className="absolute inset-0 bg-white/30 dark:bg-white/20 rounded-xl"
      />
    </motion.button>
  );
};

export default AuthButton;
