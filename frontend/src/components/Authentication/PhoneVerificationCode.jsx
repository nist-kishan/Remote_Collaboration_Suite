import React from "react";

export default function PhoneCode({ countrycode, handleChange, countryCodes }) {
  return (
    <div className="mb-2.5">
      <select
        value={countrycode}
        onChange={(e) => handleChange("countrycode", e.target.value)}
        className="w-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-2.5 rounded-md mb-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm"
      >
        {countryCodes.map((c) => (
          <option key={`${c.name}-${c.dial_code}`} value={c.dial_code}>
            {c.name} ({c.dial_code})
          </option>
        ))}
      </select>
    </div>
  );
}
