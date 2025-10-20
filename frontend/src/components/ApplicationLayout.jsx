import { Outlet } from "react-router-dom";
import ApplicationHeader from "./ApplicationHeader";
import ApplicationFooter from "./ApplicationFooter";
import DocumentStateManager from "./documents/DocumentStateManager";

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 transition-all duration-300">
      <DocumentStateManager />
      <ApplicationHeader />
      <main className="flex-1 pt-16 overflow-y-auto">
        <Outlet />
      </main>
      <ApplicationFooter />
    </div>
  );
}
