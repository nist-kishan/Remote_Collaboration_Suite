import { useState, useCallback, useMemo, memo } from "react";
import {
  MessageSquare,
  Video,
  FileText,
  PenTool,
  FolderOpen,
  Menu,
  X,
} from "lucide-react";
import ApplicationBrandName from "./Header/ApplicationBrandName";
import MainNavigationBar from "./Header/MainNavigationBar";
import UserAuthSection from "./Header/UserAuthSection";
import MobileNavigationMenu from "./Header/MobileNavigationMenu";
import DarkLightModeToggle from "./Header/DarkLightModeToggle";
import { useLogout } from "../hook/useAuth";
import { useSelector } from "react-redux";

const Header = memo(() => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useSelector((state) => state.auth);
  const { mutate: logoutMutation } = useLogout();

  const navLinks = useMemo(
    () => [
      { name: "Chat", path: "/chat", icon: <MessageSquare size={18} /> },
      { name: "Video Call", path: "/video-call", icon: <Video size={18} /> },
      { name: "Documents", path: "/documents", icon: <FileText size={18} /> },
      { name: "Whiteboards", path: "/boards", icon: <PenTool size={18} /> },
      { name: "Projects", path: "/projects", icon: <FolderOpen size={18} /> },
    ],
    []
  );

  const handleLogout = useCallback(() => logoutMutation(), [logoutMutation]);
  const toggleMenu = useCallback(() => setMenuOpen((prev) => !prev), []);

  return (
    <header className="fixed top-0 left-0 w-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <ApplicationBrandName />
        <MainNavigationBar navLinks={navLinks} />

        <div className="flex items-center gap-4">
          <DarkLightModeToggle />

          <UserAuthSection handleLogout={handleLogout} />

          <button
            onClick={toggleMenu}
            className="md:hidden p-2 rounded hover:bg-gray-200/30 dark:hover:bg-gray-700/30 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            aria-label="Toggle mobile menu"
          >
            {menuOpen ? (
              <X size={20} className="text-gray-800 dark:text-white" />
            ) : (
              <Menu size={20} className="text-gray-800 dark:text-white" />
            )}
          </button>
        </div>
      </div>

      <MobileNavigationMenu
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        navLinks={navLinks}
      />
    </header>
  );
});

Header.displayName = 'Header';

export default Header;
