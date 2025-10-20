import React, { useState } from "react";
import { 
  File,
  Edit,
  View,
  Plus,
  Type,
  Wrench,
  HelpCircle,
  MoreVertical,
  Settings,
  Download,
  Upload,
  Share,
  Users,
  Eye,
  Printer,
  Search,
  Undo,
  Redo,
  Copy,
  Scissors,
  Clipboard,
  Image,
  Link,
  Table,
  MessageSquare,
  Palette,
  Sun,
  Moon,
  Maximize2,
  Minimize2
} from "lucide-react";
import CustomButton from "../ui/CustomButton";

const DocumentToolbar = ({ 
  onSettings, 
  onShare, 
  onDownload, 
  onPrint, 
  onPreview,
  canEdit = true,
  canShare = false,
  canChangeSettings = false
}) => {
  const [activeMenu, setActiveMenu] = useState(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const menuItems = [
    {
      id: 'file',
      label: 'File',
      icon: File,
      items: [
        { label: 'New document', icon: File, shortcut: 'Ctrl+N' },
        { label: 'Open document', icon: Upload, shortcut: 'Ctrl+O' },
        { label: 'Download', icon: Download, shortcut: 'Ctrl+S', onClick: onDownload },
        { label: 'Print', icon: Printer, shortcut: 'Ctrl+P', onClick: onPrint },
        ...(canChangeSettings ? [{ label: 'Document settings', icon: Settings, onClick: onSettings }] : [])
      ]
    },
    ...(canEdit ? [{
      id: 'edit',
      label: 'Edit',
      icon: Edit,
      items: [
        { label: 'Undo', icon: Undo, shortcut: 'Ctrl+Z' },
        { label: 'Redo', icon: Redo, shortcut: 'Ctrl+Y' },
        { label: 'Cut', icon: Scissors, shortcut: 'Ctrl+X' },
        { label: 'Copy', icon: Copy, shortcut: 'Ctrl+C' },
        { label: 'Paste', icon: Clipboard, shortcut: 'Ctrl+V' },
        { label: 'Find and replace', icon: Search, shortcut: 'Ctrl+H' }
      ]
    }] : []),
    {
      id: 'view',
      label: 'View',
      icon: View,
      items: [
        { label: 'Preview', icon: Eye, shortcut: 'Ctrl+Shift+P', onClick: onPreview },
        { label: 'Print layout', icon: Printer },
        { label: 'Fullscreen', icon: Maximize2, shortcut: 'F11' },
        { label: 'Dark mode', icon: isDarkMode ? Sun : Moon, onClick: () => setIsDarkMode(!isDarkMode) }
      ]
    },
    ...(canEdit ? [{
      id: 'insert',
      label: 'Insert',
      icon: Plus,
      items: [
        { label: 'Image', icon: Image },
        { label: 'Link', icon: Link, shortcut: 'Ctrl+K' },
        { label: 'Table', icon: Table },
        { label: 'Comment', icon: MessageSquare },
        { label: 'Page break', icon: Plus }
      ]
    },
    {
      id: 'format',
      label: 'Format',
      icon: Type,
      items: [
        { label: 'Text formatting', icon: Type },
        { label: 'Paragraph', icon: Type },
        { label: 'Columns', icon: Type },
        { label: 'Page setup', icon: Type },
        { label: 'Clear formatting', icon: Type, shortcut: 'Ctrl+Space' }
      ]
    }] : []),
    {
      id: 'tools',
      label: 'Tools',
      icon: Wrench,
      items: [
        ...(canEdit ? [
          { label: 'Spelling and grammar', icon: Wrench, shortcut: 'F7' },
          { label: 'Word count', icon: Wrench }
        ] : []),
        ...(canShare ? [{ label: 'Share document', icon: Share, onClick: onShare }] : []),
        { label: 'Collaborators', icon: Users },
        ...(canChangeSettings ? [{ label: 'Document settings', icon: Settings, onClick: onSettings }] : [])
      ]
    },
    {
      id: 'help',
      label: 'Help',
      icon: HelpCircle,
      items: [
        { label: 'Help center', icon: HelpCircle },
        { label: 'Keyboard shortcuts', icon: HelpCircle, shortcut: 'Ctrl+/' },
        { label: 'About', icon: HelpCircle }
      ]
    }
  ];

  const MenuDropdown = ({ menu, isActive }) => {
    if (!isActive) return null;

    return (
      <div 
        className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2 min-w-56 z-50"
        onMouseEnter={() => setActiveMenu(menu.id)}
        onMouseLeave={() => setActiveMenu(null)}
      >
        {menu.items.map((item, index) => (
          <button
            key={index}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between group"
            onClick={item.onClick}
          >
            <div className="flex items-center gap-2">
              <item.icon className="w-4 h-4" />
              {item.label}
            </div>
            {item.shortcut && (
              <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                {item.shortcut}
              </span>
            )}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 relative shadow-sm">
      {/* Desktop Menu */}
      <div className="hidden md:flex items-center justify-between px-6 py-3">
        <div className="flex items-center space-x-1">
          {menuItems.map((menu) => (
            <div key={menu.id} className="relative">
              <button
                className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg flex items-center gap-2 transition-all duration-200 hover:shadow-sm"
                onMouseEnter={() => setActiveMenu(menu.id)}
                onMouseLeave={() => setActiveMenu(null)}
              >
                <menu.icon className="w-4 h-4" />
                {menu.label}
              </button>
              <MenuDropdown menu={menu} isActive={activeMenu === menu.id} />
            </div>
          ))}
        </div>
        
        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          {canShare && (
            <CustomButton
              variant="ghost"
              size="sm"
              onClick={onShare}
              className="flex items-center gap-2 px-3 py-2 text-sm"
              title="Share document"
            >
              <Share className="w-4 h-4" />
              <span className="hidden lg:inline">Share</span>
            </Button>
          )}
          <CustomButton
            variant="ghost"
            size="sm"
            onClick={onDownload}
            className="flex items-center gap-2 px-3 py-2 text-sm"
            title="Download document"
          >
            <Download className="w-4 h-4" />
            <span className="hidden lg:inline">Download</span>
          </Button>
          {canChangeSettings && (
            <CustomButton
              variant="ghost"
              size="sm"
              onClick={onSettings}
              className="flex items-center gap-2 px-3 py-2 text-sm"
              title="Document settings"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden lg:inline">Settings</span>
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      <div className="md:hidden flex items-center justify-between px-4 py-3">
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
        >
          <MoreVertical className="w-4 h-4" />
          Menu
        </button>
        <div className="flex items-center gap-2">
          {canChangeSettings && (
            <CustomButton
              variant="ghost"
              size="sm"
              onClick={onSettings}
              className="p-3"
            >
              <Settings className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {showMobileMenu && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="grid grid-cols-2 gap-2 p-4">
            {menuItems.map((menu) => (
              <button
                key={menu.id}
                className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md flex items-center gap-2 transition-colors"
                onClick={() => setShowMobileMenu(false)}
              >
                <menu.icon className="w-4 h-4" />
                {menu.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentToolbar;
