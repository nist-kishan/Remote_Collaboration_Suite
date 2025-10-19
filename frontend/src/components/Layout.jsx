import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import DocumentStateInitializer from "./documents/DocumentStateInitializer";

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 transition-all duration-300">
      <DocumentStateInitializer />
      <Header />
      <main className="flex-1 pt-16 overflow-y-auto">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
