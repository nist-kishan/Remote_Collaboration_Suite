import React from 'react'
import { Loader2 } from 'lucide-react'

export default function AvatarForm({
  handleAvatarSubmit,
  updatingAvatar,
  setAvatarFile,
  setAvatarPreview,
  avatar,
}) {
  return (
    <form
      onSubmit={handleAvatarSubmit}
      className="mt-4 w-full flex flex-col items-center gap-2"
    >
      <div className="text-sm text-gray-700 dark:text-gray-200">
        Preview selected image
      </div>
      <div className="flex gap-2 mt-2 w-full justify-center">
        <button
          type="submit"
          disabled={updatingAvatar}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {updatingAvatar && <Loader2 className="w-4 h-4 animate-spin" />}
          {updatingAvatar ? "Uploading..." : "Upload"}
        </button>
        <button
          type="button"
          onClick={() => {
            setAvatarFile(null);
            setAvatarPreview(avatar ?? "");
          }}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
