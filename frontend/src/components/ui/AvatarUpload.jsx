import React, { useState } from "react";

export default function AvatarUpload({
  onFileSelect,
  initialImage = null,
  labelText = "Upload Avatar",
  className = "",
  previewSize = 96,
  accept = "image/*",
  onError,
}) {
  const [preview, setPreview] = useState(initialImage);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      if (onError) {
        onError("Please select a valid image file");
      }
      return;
    }

    setPreview(URL.createObjectURL(file));

    if (onFileSelect) onFileSelect(file);
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <label className="flex flex-col items-center px-4 py-6 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-300 rounded-lg shadow-lg tracking-wide uppercase border border-gray-300 dark:border-gray-600 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition">
        {preview ? (
          <img
            src={preview}
            alt="Preview"
            className="mb-2"
            style={{
              width: previewSize,
              height: previewSize,
              borderRadius: "50%",
              objectFit: "cover",
            }}
          />
        ) : (
          <>
            <svg
              className="w-8 h-8 mb-2"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
            >
              <path d="M16.88 9.1a4 4 0 00-7.76-1.1H7a4 4 0 000 8h9a3 3 0 00.88-6z" />
            </svg>
            <span className="text-sm">{labelText}</span>
          </>
        )}
        <input
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleFileChange}
        />
      </label>
    </div>
  );
}
