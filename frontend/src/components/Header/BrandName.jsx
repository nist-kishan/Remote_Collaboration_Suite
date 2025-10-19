import React, { memo } from "react";
import { Link } from "react-router-dom";

const BrandName = memo(() => {
  return (
    <Link
      to="/"
      className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors duration-200"
    >
      Kontributor
    </Link>
  );
});

BrandName.displayName = 'BrandName';

export default BrandName;
