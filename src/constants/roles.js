/* Rôles utilisateurs — cahier des charges §7.2 */
export const ROLES = {
  super_admin_ucds: {
    label: "Super Administrateur UCDS",
    description: "Accès global à tous les postes de santé",
  },
  admin_poste: {
    label: "Administrateur Poste de Santé",
    description: "Gestion complète d'un poste donné",
  },
  medecin: {
    label: "Médecin",
    description: "Consultations, diagnostics, prescriptions",
  },
  infirmier_chef: {
    label: "Infirmier Chef de Poste",
    description: "Gestion clinique et coordination du poste",
  },
  sage_femme: {
    label: "Sage-femme",
    description: "Suivi de grossesse et maternité",
  },
  pharmacien: {
    label: "Pharmacien",
    description: "Gestion de la pharmacie et des médicaments",
  },
  caissier: {
    label: "Caissier",
    description: "Comptabilité, recettes et dépenses",
  },
  magasinier: {
    label: "Magasinier",
    description: "Gestion du stock et des inventaires",
  },
  agent_sante: {
    label: "Agent de santé",
    description: "Opérations de terrain et suivi communautaire",
  },
  lecture_seule: {
    label: "Consultation uniquement",
    description: "Accès en lecture seule",
  },
};

/* Rôles qu'un Administrateur Poste de Santé peut attribuer à un membre de son équipe
   (jamais admin_poste ni super_admin_ucds — doit rester synchronisé avec la fonction SQL
   prevent_role_escalation, supabase/migrations/0014_personnel.sql et 0015_ciblage_et_roles.sql). */
export const FIELD_ROLE_OPTIONS = [
  "medecin",
  "infirmier_chef",
  "sage_femme",
  "pharmacien",
  "caissier",
  "magasinier",
  "agent_sante",
  "lecture_seule",
].map((value) => ({ value, label: ROLES[value].label }));

/* Rôles autorisés à accéder à chaque module (en plus d'admin_poste/super_admin_ucds, toujours
   autorisés, et de lecture_seule, qui garde un accès en lecture à tous les modules). Doit rester
   synchronisé avec is_clinical_role()/is_pharmacie_role() dans supabase/migrations/0015_ciblage_et_roles.sql. */
export const PATIENTS_MODULE_ROLES = ["medecin", "infirmier_chef", "sage_femme", "agent_sante"];
export const CONSULTATIONS_MODULE_ROLES = ["medecin", "infirmier_chef", "sage_femme"];
export const GROSSESSE_MODULE_ROLES = ["medecin", "infirmier_chef", "sage_femme"];
export const PHARMACIE_MODULE_ROLES = ["pharmacien", "magasinier"];

export function getRoleLabel(role) {
  return ROLES[role]?.label ?? "Rôle non assigné";
}

export function getRoleDescription(role) {
  return ROLES[role]?.description ?? "";
}
