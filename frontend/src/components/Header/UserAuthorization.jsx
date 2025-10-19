import React, { useState, useRef, useEffect, memo, useCallback } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { LogOut, User as UserIcon } from "lucide-react";

const UserAuthorization = memo(({ handleLogout }) => {
  const user = useSelector((state) => state.auth.user);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const toggleMenu = useCallback(() => {
    setMenuOpen((prev) => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
  }, []);

  const handleLogoutClick = useCallback(() => {
    handleLogout();
    closeMenu();
  }, [handleLogout, closeMenu]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      {isAuthenticated && user ? (
        <div className="relative" ref={menuRef}>
          <div
            className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md p-1 transition-colors duration-200"
            onClick={toggleMenu}
          >
            <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-300 dark:border-gray-600 flex items-center justify-center bg-gray-200 dark:bg-gray-700">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserIcon
                  size={18}
                  className="text-gray-600 dark:text-gray-300"
                />
              )}
            </div>
          </div>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 overflow-hidden">
              {/* Profile Button */}
              <Link
                to="/profile"
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                onClick={closeMenu}
              >
                <UserIcon size={16} /> Profile
              </Link>

              {/* Logout Button */}
              <button
                onClick={handleLogoutClick}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/login"
            className="text-sm text-gray-700 dark:text-gray-300 hover:text-indigo-500 transition-colors duration-200"
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 transition-colors duration-200"
          >
            Sign Up
          </Link>
        </div>
      )}
    </>
  );
});

UserAuthorization.displayName = 'UserAuthorization';

export default UserAuthorization;
