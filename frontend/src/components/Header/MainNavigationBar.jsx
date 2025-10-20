import React, { memo } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

const Navbar = memo(({ navLinks }) => {
  const location = useLocation();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  if (!isAuthenticated) return null;

  return (
    <nav className="hidden md:flex items-center gap-6">
      {navLinks.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`flex items-center gap-1 text-sm font-medium transition-colors duration-200 px-2 py-1 rounded-md ${
            location.pathname === item.path
              ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20"
              : "text-gray-700 dark:text-gray-300 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
        >
          {item.icon}
          {item.name}
        </Link>
      ))}
    </nav>
  );
});

Navbar.displayName = 'Navbar';

export default Navbar;
