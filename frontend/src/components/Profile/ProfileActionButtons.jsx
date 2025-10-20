import React from 'react'
import { Link } from 'react-router-dom';

export default function Buttons({ handleSaveAll, updatingProfile }) {
  return (
    <div className="flex items-center gap-3">
      <Link
        to="/changepassword"
        className="px-3 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium"
      >
        Change Password
      </Link>
      <button
        onClick={handleSaveAll}
        disabled={updatingProfile}
        className="px-3 py-2 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium"
      >
        Save All
      </button>
    </div>
  );
}
