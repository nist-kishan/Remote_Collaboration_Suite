import { Outlet, useLocation } from "react-router-dom";
import ApplicationHeader from "./ApplicationHeader";
import ApplicationFooter from "./ApplicationFooter";
import DocumentStateManager from "./documents/DocumentStateManager";
import GlobalCallNotification from "./call/GlobalCallNotification";

export default function Layout() {
  const location = useLocation();
  const isChatPage = location.pathname.startsWith('/chat');
  
  if (isChatPage) {
    // Full screen layout for chat pages with proper header spacing
    return (
      <div className="h-screen w-screen flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden fixed inset-0">
        <DocumentStateManager />
        <ApplicationHeader />
        <main className="flex-1 overflow-hidden" style={{ paddingTop: '64px' }}>
          <Outlet />
        </main>
        {/* No footer for chat pages to maximize space */}
        <GlobalCallNotification key="chat-layout" />
      </div>
    );
  }

  // Standard layout for other pages
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 transition-all duration-300">
      <DocumentStateManager />
      <ApplicationHeader />
      <main className="flex-1 pt-16 overflow-y-auto">
        <Outlet />
      </main>
      <ApplicationFooter />
      <GlobalCallNotification key="standard-layout" />
    </div>
  );
}
