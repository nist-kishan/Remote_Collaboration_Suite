import { Loader2 } from "lucide-react";

const AppLoading = ({ message = "Loading..." }) => {

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-900 flex items-center justify-center">
      <div className="text-center">
        <div className="relative mx-auto w-20 h-20 mb-6">
          {/* Outer pulsing circle */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 opacity-20 animate-pulse"></div>
          
          {/* Spinning loader */}
          <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-white dark:bg-gray-800 shadow-lg">
            <Loader2 className="w-10 h-10 text-indigo-600 dark:text-indigo-400 animate-spin" />
          </div>
        </div>
        
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {message}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Please wait while we prepare everything...
        </p>
      </div>
    </div>
  );
};

export default AppLoading;

