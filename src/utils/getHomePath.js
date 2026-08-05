/**
 * Calcule la page d'accueil interne selon le profil connecté :
 * - Super Administrateur UCDS → tableau de bord global
 * - Utilisateur rattaché à un poste → tableau de bord de son poste
 * - Aucun poste assigné pour le moment → page d'attente
 */
export function getHomePath({ role, posteSlug }) {
  if (role === "super_admin_ucds") return "/tableau-de-bord";
  if (posteSlug) return `/poste/${posteSlug}/tableau-de-bord`;
  return "/en-attente-assignation";
}
