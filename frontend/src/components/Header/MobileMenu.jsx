import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { LogOut } from "lucide-react";

export default function MobileMenu({
  menuOpen,
  setMenuOpen,
  navLinks,
}) {
  const location = useLocation();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  if (!menuOpen) return null;

  return (
    <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
      <nav className="flex flex-col p-3 space-y-2">
        {isAuthenticated &&
          navLinks.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-medium ${
                location.pathname === item.path
                  ? "bg-indigo-100 dark:bg-gray-800 text-indigo-600 dark:text-indigo-400"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-800/50"
              }`}
            >
              {item.icon} {item.name}
            </Link>
          ))}

        {!isAuthenticated && (
          <>
            <Link
              to="/login"
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-800/50 rounded"
            >
              Login
            </Link>
            <Link
              to="/signup"
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Sign Up
            </Link>
          </>
        )}

      </nav>
    </div>
  );
}
