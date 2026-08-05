import { Navigate, Outlet } from "react-router-dom";
import { Loader } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { getHomePath } from "../utils/getHomePath";

/**
 * Réserve une route au Super Administrateur UCDS. Toute autre personne authentifiée est
 * redirigée vers sa propre page d'accueil (son poste) plutôt que vers un message d'erreur —
 * ce n'est pas un accès refusé, c'est simplement une autre page d'accueil.
 */
export default function RequireSuperAdmin() {
  const { role, posteSlug, profileLoading } = useAuth();

  if (profileLoading && !role) {
    return <Loader fullScreen label="Chargement..." />;
  }

  if (role !== "super_admin_ucds") {
    return <Navigate to={getHomePath({ role, posteSlug })} replace />;
  }

  return <Outlet />;
}
