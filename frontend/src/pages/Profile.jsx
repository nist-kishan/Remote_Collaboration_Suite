import React, { useEffect, useMemo, useState } from "react";
import {
  useCurrentUser,
  useUpdateProfile,
  useUpdateAvatar,
} from "../hook/useAuth";
import { useSelector } from "react-redux";
import { ShieldCheck, UserCheck, Key, Edit3, Save, X } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import PageLayoutWrapper from "../components/ui/PageLayoutWrapper";
import CustomCard from "../components/ui/CustomCard";
import CustomButton from "../components/ui/CustomButton";
import ProfileAvatarUpdater from "../components/Profile/ProfileAvatarUpdater";
import ProfileAvatarForm from "../components/Profile/ProfileAvatarForm";
import ProfileEditableField from "../components/Profile/ProfileEditableField";

export default function Profile() {
  const { data: userData, isLoading } = useCurrentUser();
  const { user: reduxUser } = useSelector((state) => state.auth);
  
  const user = useMemo(() => {
    // Handle different data structures from API
    if (userData?.user) {
      return userData.user;
    } else if (userData && typeof userData === 'object' && userData._id) {
      return userData;
    } else if (reduxUser) {
      // Fallback to Redux state
      return reduxUser;
    }
    return null;
  }, [userData, reduxUser]);

  const [isEditMode, setIsEditMode] = useState(false);
  const [form, setForm] = useState({
    name: "",
    username: "",
    phone: "",
    countrycode: "",
  });
  const [originalForm, setOriginalForm] = useState({
    name: "",
    username: "",
    phone: "",
    countrycode: "",
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");

  const { mutate: updateProfile, isLoading: updatingProfile } =
    useUpdateProfile();
  const { mutate: updateAvatar, isLoading: updatingAvatar } = useUpdateAvatar();

  useEffect(() => {
    if (!user) return;
    const userForm = {
      name: user.name ?? "",
      username: user.username ?? "",
      phone: user.phone ?? "",
      countrycode: user.countrycode ?? "",
    };
    setForm(userForm);
    setOriginalForm(userForm);
    setAvatarPreview(user.avatar ?? "");
  }, [user]);

  useEffect(() => {
    if (!avatarFile) return;
    const url = URL.createObjectURL(avatarFile);
    setAvatarPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  const handleChange = (field, value) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleEditToggle = () => {
    if (isEditMode) {
      // Cancel edit - restore original values
      setForm(originalForm);
    }
    setIsEditMode(!isEditMode);
  };

  const buildPayload = () => {
    const payload = {};
    if (user?.name !== form.name && form.name.trim() !== "")
      payload.name = form.name.trim();
    if (user?.username !== form.username && form.username.trim() !== "")
      payload.username = form.username.trim();
    return payload;
  };

  const handleSaveField = (field) => {
    const payload = {};
    if (field === "name" && user?.name !== form.name) payload.name = form.name;
    if (field === "username" && user?.username !== form.username)
      payload.username = form.username;

    if (Object.keys(payload).length === 0) {
      setEditMode((s) => ({ ...s, [field]: false }));
      return;
    }

    updateProfile(payload, {
      onSuccess: () => {
        setEditMode((s) => ({ ...s, [field]: false }));
      },
    });
  };

  const handleSaveAll = () => {
    const payload = buildPayload();
    if (Object.keys(payload).length === 0) {
      setIsEditMode(false);
      return;
    }
    updateProfile(payload, {
      onSuccess: () => {
        setOriginalForm(form);
        setIsEditMode(false);
      },
    });
  };

  const handleAvatarSubmit = (e) => {
    e.preventDefault();
    if (!avatarFile) return;
    const fd = new FormData();
    fd.append("avatar", avatarFile);
    updateAvatar(fd, {
      onSuccess: () => {
        setAvatarFile(null);
      },
    });
  };

  if (isLoading) {
    return (
      <PageLayoutWrapper>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-gray-600 dark:text-gray-300">
            Loading profile...
          </div>
        </div>
      </PageLayoutWrapper>
    );
  }

  if (!user) {
    return (
      <PageLayoutWrapper>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-gray-600 dark:text-gray-300 mb-4">
              No user data found
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Debug info: {JSON.stringify({ userData, reduxUser, isLoading })}
            </div>
          </div>
        </div>
      </PageLayoutWrapper>
    );
  }

  return (
    <PageLayoutWrapper title="Your Profile">
      {/* Hero Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 lg:p-8 mb-6 lg:mb-8 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6 w-full lg:w-auto">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden border-4 border-gray-200 dark:border-gray-600 flex-shrink-0">
              <ProfileAvatarUpdater
                avatarPreview={avatarPreview}
                name={user.name}
                setAvatarFile={setAvatarFile}
              />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-900 dark:text-white truncate">{user.name || "User"}</h1>
              <p className="text-gray-600 dark:text-gray-400 mb-1 truncate">@{user.username || "username"}</p>
              <p className="text-gray-600 dark:text-gray-400 truncate">{user.email}</p>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-3">
                {user?.isVerify ? (
                  <span className="inline-flex items-center gap-2 px-2 sm:px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-xs sm:text-sm border border-emerald-200 dark:border-emerald-800">
                    <ShieldCheck className="w-3 h-3 sm:w-4 sm:h-4" /> Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 px-2 sm:px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-xs sm:text-sm border border-yellow-200 dark:border-yellow-800">
                    <UserCheck className="w-3 h-3 sm:w-4 sm:h-4" /> Not Verified
                  </span>
                )}
                <span className="inline-flex items-center gap-2 px-2 sm:px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs sm:text-sm border border-gray-200 dark:border-gray-600">
                  {user.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>
          <div className="w-full sm:w-auto">
            <motion.button
              onClick={handleEditToggle}
              className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-5 py-2 rounded-lg font-medium transition-all duration-200 ${
                isEditMode
                  ? 'bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 border border-red-200 dark:border-red-800'
                  : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
              }`}
              whileHover={{ 
                scale: 1.02,
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
              }}
              whileTap={{ 
                scale: 0.98,
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
              }}
              transition={{ 
                type: "spring", 
                stiffness: 400, 
                damping: 10 
              }}
            >
              <motion.div
                key={isEditMode ? "cancel" : "edit"}
                initial={{ rotate: -180, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ duration: 0.3, type: "spring" }}
              >
                {isEditMode ? (
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <Edit3 className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </motion.div>
              <motion.span
                key={isEditMode ? "cancel-text" : "edit-text"}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: 0.1 }}
              >
                <span className="hidden sm:inline">
                  {isEditMode ? "Cancel Edit" : "Edit Profile"}
                </span>
                <span className="sm:hidden">
                  {isEditMode ? "Cancel" : "Edit"}
                </span>
              </motion.span>
            </motion.button>
          </div>
        </div>
        
        {/* Avatar Upload Form */}
        {avatarFile && (
          <div className="relative z-10 mt-6">
            <ProfileAvatarForm
              handleAvatarSubmit={handleAvatarSubmit}
              updatingAvatar={updatingAvatar}
              setAvatarFile={setAvatarFile}
              setAvatarPreview={setAvatarPreview}
              avatar={user.avatar}
            />
          </div>
        )}
      </div>

      {/* Profile Information Cards */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-6 lg:mb-8">
        {/* Personal Information */}
        <CustomCard className="h-fit">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Personal Information</h2>
          </div>
          
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Full Name
              </label>
              {isEditMode ? (
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 dark:border-gray-700 rounded-lg sm:rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-sm sm:text-base"
                  placeholder="Enter your full name"
                />
              ) : (
                <div className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 dark:bg-gray-800 rounded-lg sm:rounded-xl text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 text-sm sm:text-base">
                  {form.name || "Not provided"}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Username
              </label>
              {isEditMode ? (
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => handleChange("username", e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 dark:border-gray-700 rounded-lg sm:rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-sm sm:text-base"
                  placeholder="Enter your username"
                />
              ) : (
                <div className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 dark:bg-gray-800 rounded-lg sm:rounded-xl text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 text-sm sm:text-base">
                  @{form.username || "Not provided"}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Email Address
              </label>
              <div className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 dark:bg-gray-800 rounded-lg sm:rounded-xl text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 text-sm sm:text-base break-all">
                {user?.email || "Not provided"}
              </div>
            </div>
          </div>
        </CustomCard>

        {/* Contact Information */}
        <CustomCard className="h-fit">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <Key className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Contact Information</h2>
          </div>
          
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Phone Number
              </label>
              {isEditMode ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.countrycode}
                    onChange={(e) => handleChange("countrycode", e.target.value)}
                    placeholder="+91"
                    className="w-20 px-3 py-2 sm:py-3 border border-gray-200 dark:border-gray-700 rounded-lg sm:rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-center text-sm sm:text-base"
                  />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="Enter phone number"
                    className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 dark:border-gray-700 rounded-lg sm:rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-sm sm:text-base"
                  />
                </div>
              ) : (
                <div className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 dark:bg-gray-800 rounded-lg sm:rounded-xl text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 text-sm sm:text-base">
                  {`${form.countrycode || ""} ${form.phone || ""}`.trim() || "Not provided"}
                </div>
              )}
            </div>
          </div>
        </CustomCard>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        {isEditMode ? (
          <>
            <CustomButton
              onClick={handleSaveAll}
              loading={updatingProfile}
              disabled={updatingProfile}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg sm:rounded-xl font-medium transition-all duration-200 border border-indigo-600 hover:border-indigo-700 text-sm sm:text-base"
            >
              <Save className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden xs:inline">Save Changes</span>
              <span className="xs:hidden">Save</span>
            </CustomButton>
            
            <motion.button
              onClick={handleEditToggle}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-5 py-2 bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white rounded-lg font-medium transition-all duration-200 border border-gray-500 hover:border-gray-600 dark:border-gray-600 dark:hover:border-gray-700 text-sm"
              whileHover={{ 
                scale: 1.02,
                boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
              }}
              whileTap={{ 
                scale: 0.98,
                boxShadow: "0 2px 8px rgba(0,0,0,0.3)"
              }}
              transition={{ 
                type: "spring", 
                stiffness: 400, 
                damping: 10 
              }}
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
              Cancel
            </motion.button>
          </>
        ) : (
          <motion.div
            whileHover={{ 
              scale: 1.02,
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
            }}
            whileTap={{ 
              scale: 0.98,
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)"
            }}
            transition={{ 
              type: "spring", 
              stiffness: 400, 
              damping: 10 
            }}
          >
            <Link 
              to="/changepassword"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all duration-200 border border-green-600 hover:border-green-700 text-sm"
            >
              <Key className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden xs:inline">Change Password</span>
              <span className="xs:hidden">Change Password</span>
            </Link>
          </motion.div>
        )}
      </div>
    </PageLayoutWrapper>
  );
}
