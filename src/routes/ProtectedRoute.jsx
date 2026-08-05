import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Loader } from "../components/ui";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, loading, profileLoading, role } = useAuth();
  const location = useLocation();

  if (loading || (isAuthenticated && profileLoading && !role)) {
    return <Loader fullScreen label="Chargement..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/connexion" state={{ from: location.pathname }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/acces-refuse" replace />;
  }

  return <Outlet />;
}
