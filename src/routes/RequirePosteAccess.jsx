import { Navigate, Outlet, useParams } from "react-router-dom";
import { Loader } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { getHomePath } from "../utils/getHomePath";

/**
 * Protège les routes /poste/:slug/... : seul le Super Administrateur UCDS (vue globale) ou un
 * utilisateur rattaché à CE poste précis peut y accéder. Toute autre personne est redirigée vers
 * sa propre page d'accueil — l'isolation est déjà garantie côté base de données (RLS), ceci évite
 * simplement d'afficher une page vide/cassée à quelqu'un qui n'a pas les droits.
 */
export default function RequirePosteAccess() {
  const { slug } = useParams();
  const { role, posteSlug, profileLoading } = useAuth();

  if (profileLoading && !role) {
    return <Loader fullScreen label="Chargement..." />;
  }

  const isSuperAdmin = role === "super_admin_ucds";
  const isOwnPoste = posteSlug === slug;

  if (!isSuperAdmin && !isOwnPoste) {
    return <Navigate to={getHomePath({ role, posteSlug })} replace />;
  }

  return <Outlet />;
}
