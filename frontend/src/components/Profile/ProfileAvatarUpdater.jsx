import { Camera } from "lucide-react";
import React from "react";

export default function AvatarUpdate({ avatarPreview, name, setAvatarFile }) {
  return (
    <div className="relative w-full h-full">
      <div className="w-full h-full rounded-full overflow-hidden">
        {avatarPreview ? (
          <img
            src={avatarPreview}
            alt="avatar"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-500">
            <span className="text-lg sm:text-2xl font-semibold">
              {(name || "U").charAt(0)}
            </span>
          </div>
        )}
      </div>
      <label className="absolute bottom-0 right-0 bg-white dark:bg-gray-800 rounded-full p-1.5 sm:p-2 shadow-lg cursor-pointer border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) setAvatarFile(e.target.files[0]);
          }}
        />
        <Camera className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600 dark:text-gray-300" />
      </label>
    </div>
  );
}
