import React from "react";
import { Link } from "react-router-dom";

export default function AuthLink({ 
  to, 
  children, 
  className = "" 
}) {
  return (
    <Link
      to={to}
      className={`text-indigo-600 dark:text-indigo-400 hover:underline font-medium transition-colors duration-200 ${className}`}
    >
      {children}
    </Link>
  );
}
