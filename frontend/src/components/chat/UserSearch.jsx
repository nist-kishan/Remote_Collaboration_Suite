import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchUsers } from '../../api/userApi';
import { Search, User, Mail, Phone, MessageCircle } from 'lucide-react';
import Button from '../ui/Button';

const UserSearch = ({ onSelectUser, onStartChat, placeholder = "Search users..." }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const resultsRef = useRef(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['userSearch', searchTerm],
    queryFn: () => searchUsers(searchTerm),
    enabled: searchTerm.length >= 2,
    staleTime: 30000, // Cache for 30 seconds
  });

  const users = data?.data?.users || [];

  // Handle click outside to close results
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Show results when search term changes
  useEffect(() => {
    if (searchTerm.length >= 2) {
      setShowResults(true);
    } else {
      setShowResults(false);
    }
  }, [searchTerm]);

  const handleUserSelect = (user) => {

    if (onSelectUser) {
      onSelectUser(user);
    }
    if (onStartChat) {
      onStartChat(user);
    }
    setSearchTerm('');
    setShowResults(false);
  };

  const getDisplayInfo = (user) => {
    const info = [];
    const searchLower = searchTerm.toLowerCase().trim();
    
    // Determine what type of search this is
    const isEmailSearch = searchLower.includes('@');
    const isPhoneSearch = /^\d+$/.test(searchLower) || searchLower.match(/[\d\s\-\(\)\+]/);
    const isUsernameSearch = searchLower.startsWith('@') || searchLower.match(/^[a-zA-Z0-9_]+$/);
    
    // Priority-based display based on search type
    if (isEmailSearch && user.email) {
      // Email search - show email first
      info.push({ icon: Mail, text: user.email });
      if (user.phone) info.push({ icon: Phone, text: user.phone });
    } else if (isPhoneSearch && user.phone) {
      // Phone search - show phone first
      info.push({ icon: Phone, text: user.phone });
      if (user.email) info.push({ icon: Mail, text: user.email });
    } else if (isUsernameSearch && user.username) {
      // Username search - show username first
      info.push({ icon: User, text: `@${user.username}` });
      if (user.email) info.push({ icon: Mail, text: user.email });
    } else {
      // Name search or general search - show most relevant info
      if (user.email) info.push({ icon: Mail, text: user.email });
      if (user.phone) info.push({ icon: Phone, text: user.phone });
      if (user.username && info.length < 2) info.push({ icon: User, text: `@${user.username}` });
    }
    
    // Limit to 2 items to keep it clean
    return info.slice(0, 2);
  };

  return (
    <div className="relative" ref={searchRef}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder={placeholder || "Search by name, email, username, or phone..."}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
          </div>
        )}
      </div>

      {/* Search Results */}
      {showResults && (
        <div 
          ref={resultsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
        >
          {searchTerm.length < 2 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Type at least 2 characters to search</p>
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-500">
              <p>Failed to search users</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No users found</p>
            </div>
          ) : (
            <div className="py-2">
              {users.map((user) => (
                <div
                  key={user._id}
                  onClick={() => handleUserSelect(user)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                >
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                        <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {user.name}
                    </h3>
                    <div className="flex items-center gap-4 mt-1">
                      {getDisplayInfo(user).map((info, index) => (
                        <div key={index} className="flex items-center gap-1">
                          <info.icon className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {info.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Chat Icon Indicator */}
                  <div className="flex-shrink-0">
                    <MessageCircle className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserSearch;
