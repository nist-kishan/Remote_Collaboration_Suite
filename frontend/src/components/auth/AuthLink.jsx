import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const AuthLink = ({
  to,
  children,
  className = "",
  variant = "default",
  icon: Icon,
  onClick,
}) => {
  const baseClasses = `
    inline-flex items-center gap-2 text-sm font-medium
    transition-all duration-300 rounded-lg
    focus:outline-none focus:ring-2 focus:ring-offset-2
  `;

  const variants = {
    default: `
      text-indigo-600 dark:text-indigo-400
      hover:text-indigo-700 dark:hover:text-indigo-300
      hover:underline
      focus:ring-indigo-500
    `,
    muted: `
      text-gray-600 dark:text-gray-400
      hover:text-gray-900 dark:hover:text-gray-200
      hover:underline
      focus:ring-gray-500
    `,
    danger: `
      text-red-600 dark:text-red-400
      hover:text-red-700 dark:hover:text-red-300
      hover:underline
      focus:ring-red-500
    `,
  };

  const linkClasses = `${baseClasses} ${variants[variant]} ${className}`;

  const LinkContent = () => (
    <motion.div
      className="flex items-center gap-2"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      {Icon && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Icon className="w-4 h-4" />
        </motion.div>
      )}
      <span>{children}</span>
    </motion.div>
  );

  if (onClick) {
    return (
      <motion.button
        onClick={onClick}
        className={linkClasses}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <LinkContent />
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Link to={to} className={linkClasses}>
        <LinkContent />
      </Link>
    </motion.div>
  );
};

export default AuthLink;
