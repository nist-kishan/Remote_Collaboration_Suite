import { motion } from "framer-motion";
import { ReactNode } from "react";
import logo from "../../assets/logo.png";

const AuthContainer = ({ children, title, subtitle, className = "" }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-900 transition duration-500 px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ 
          duration: 0.6, 
          ease: "easeOut",
          type: "spring",
          stiffness: 100,
          damping: 15
        }}
        className={`relative w-full max-w-md ${className}`}
      >
        {/* Background Blur Effect */}
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/50"></div>
        
        {/* Main Container */}
        <div className="relative bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-center mb-4"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3, duration: 0.6, type: "spring", stiffness: 200 }}
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 overflow-hidden bg-indigo-500 shadow-md border border-white dark:border-gray-700 float-animation"
          >
            <img 
              src={logo} 
              alt="Remote Work Collaboration Suite" 
              className="w-full h-full object-contain p-3 filter brightness-0 invert"
            />
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-2xl font-bold text-gray-900 dark:text-white mb-1"
          >
            {title}
          </motion.h1>
          
          {subtitle && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="text-gray-600 dark:text-gray-400"
            >
              {subtitle}
            </motion.p>
          )}
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="space-y-3"
        >
          {children}
        </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthContainer;
