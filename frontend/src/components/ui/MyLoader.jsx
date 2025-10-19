import React from "react";

export default function MyLoader({
  size = "6",
  colorLight = "text-indigo-600",
  colorDark = "dark:text-indigo-400",
}) {
  return (
    <div className="flex justify-center items-center py-2">
      <svg
        className={`animate-spin h-${size} w-${size} ${colorLight} ${colorDark}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
        />
      </svg>
    </div>
  );
}
