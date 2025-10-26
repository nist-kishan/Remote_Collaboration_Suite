import React from "react";

export default function ChatLoader() {
  return (
    <div className="flex justify-center p-3">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 blur-md opacity-30 animate-pulse"></div>
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-600 border-t-transparent relative z-10"></div>
      </div>
    </div>
  );
}
