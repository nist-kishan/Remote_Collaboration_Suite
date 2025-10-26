import { Loader2 } from "lucide-react";

const AppLoading = ({ message = "Loading..." }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-900">
      <div className="text-center relative">
        <div className="relative mx-auto w-24 h-24 mb-8">
          <div className="absolute inset-0 rounded-full border-[6px] border-transparent animate-spin bg-[conic-gradient(var(--tw-gradient-stops))] from-indigo-500 via-purple-500 to-indigo-500 bg-clip-border"></div>
          <div className="absolute inset-[6px] rounded-full bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-indigo-600 dark:text-indigo-400 animate-spin-slow" />
          </div>
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2 animate-fade-in">
          {message}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 animate-fade-in delay-300">
          Please wait while we prepare everything...
        </p>
        <div className="absolute inset-0 -z-10 blur-3xl opacity-30 animate-pulse bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 rounded-full w-40 h-40 mx-auto"></div>
      </div>
    </div>
  );
};

export default AppLoading;
