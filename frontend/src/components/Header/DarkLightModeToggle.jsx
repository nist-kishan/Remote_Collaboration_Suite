import React, { useState, useEffect, useCallback, memo } from "react";
import { Moon, Sun } from "lucide-react";
import { useToggleTheme } from "../../hook/useAuth";
import { useSelector } from "react-redux";

const ThemeToggle = memo(() => {
  const { user } = useSelector((state) => state.auth);
  const [isDark, setIsDark] = useState(() => {
    // Initialize from user theme in Redux state
    return !!user?.theme;
  });

  const { mutate: toggleThemeMutation, isPending: themeUpdating } = useToggleTheme();

  // Update theme when user theme changes
  useEffect(() => {
    if (user?.theme !== undefined) {
      setIsDark(!!user.theme);
    }
  }, [user?.theme]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", isDark);
  }, [isDark]);

  const handleThemeToggle = useCallback(() => {
    setIsDark((prev) => !prev);
    toggleThemeMutation();
  }, [toggleThemeMutation]);

  return (
    <button
      onClick={handleThemeToggle}
      disabled={themeUpdating}
      className="p-2 rounded hover:bg-gray-200/30 dark:hover:bg-gray-700/30 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <Sun size={20} className="text-yellow-500" />
      ) : (
        <Moon size={20} className="text-gray-600 dark:text-gray-300" />
      )}
    </button>
  );
});

ThemeToggle.displayName = 'ThemeToggle';

export default ThemeToggle;
