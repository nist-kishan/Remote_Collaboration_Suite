import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";
import ApplicationLoadingSpinner from "./ui/ApplicationLoadingSpinner";

export default function PrivateRoute() {
  const { isAuthenticated, loading } = useSelector((state) => state.auth);

  // Show loading while authentication is being checked
  if (loading) {
    return <ApplicationLoadingSpinner message="Checking authentication..." />;
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
