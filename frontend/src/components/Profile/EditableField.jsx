import React from "react";
import { Edit2, Check, X } from "lucide-react";

export default function EditableField({
  label,
  value,
  type = "text",
  readOnly = false,
  editMode = false,
  onChange,
  onStartEdit,
  onSave,
  onCancel,
  inputClass = "",
}) {
  return (
    <div className="p-4 rounded-lg bg-white/40 dark:bg-gray-800/40 border border-white/10">
      <label className="text-xs text-gray-600 dark:text-gray-300">
        {label}
      </label>
      <div className="mt-2 flex items-center gap-3">
        <input
          type={type}
          readOnly={readOnly && !editMode}
          value={value}
          onChange={(e) => onChange && onChange(e.target.value)}
          className={`w-full bg-transparent outline-none text-gray-800 dark:text-gray-100 ${
            editMode ? "border-b border-indigo-500 pb-1" : ""
          } ${inputClass}`}
        />
        {!editMode ? (
          !readOnly && (
            <button
              type="button"
              onClick={onStartEdit}
              className="p-2 rounded-md hover:bg-white/20"
            >
              <Edit2 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>
          )
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onSave}
              className="p-2 rounded-md bg-emerald-500 text-white"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="p-2 rounded-md bg-gray-200 dark:bg-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
