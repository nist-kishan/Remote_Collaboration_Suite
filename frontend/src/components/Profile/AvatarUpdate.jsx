import { Camera } from "lucide-react";
import React from "react";

export default function AvatarUpdate({ avatarPreview, name, setAvatarFile }) {
  return (
    <div className="relative">
      <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-white/40 dark:border-gray-800 shadow-md">
        {avatarPreview ? (
          <img
            src={avatarPreview}
            alt="avatar"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-500">
            <span className="text-4xl font-semibold">
              {(name || "U").charAt(0)}
            </span>
          </div>
        )}
      </div>
      <label className="absolute bottom-0 right-0 bg-white dark:bg-gray-800 rounded-full p-2 -translate-y-2 translate-x-2 shadow-md cursor-pointer border border-white/30 dark:border-gray-700">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) setAvatarFile(e.target.files[0]);
          }}
        />
        <Camera className="w-4 h-4 text-gray-700 dark:text-gray-200" />
      </label>
    </div>
  );
}
