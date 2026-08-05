import {
  CONSULTATIONS_MODULE_ROLES,
  GROSSESSE_MODULE_ROLES,
  PATIENTS_MODULE_ROLES,
  PHARMACIE_MODULE_ROLES,
} from "../constants/roles";
import { useAuth } from "../context/AuthContext";

/** Centralise les règles d'accès par module (sidebar, tableau de bord du poste...). */
export function useModuleAccess() {
  const { role, hasRole } = useAuth();
  const isSuperAdmin = role === "super_admin_ucds";

  return {
    isSuperAdmin,
    canViewPatients: isSuperAdmin || hasRole("admin_poste", "lecture_seule", ...PATIENTS_MODULE_ROLES),
    canViewConsultations:
      isSuperAdmin || hasRole("admin_poste", "lecture_seule", ...CONSULTATIONS_MODULE_ROLES),
    canViewGrossesse: isSuperAdmin || hasRole("admin_poste", "lecture_seule", ...GROSSESSE_MODULE_ROLES),
    canViewPharmacie: isSuperAdmin || hasRole("admin_poste", "lecture_seule", ...PHARMACIE_MODULE_ROLES),
    canViewComptabilite: isSuperAdmin || hasRole("admin_poste", "caissier"),
    canViewPersonnel: isSuperAdmin || hasRole("admin_poste"),
    canViewRapports: isSuperAdmin || hasRole("admin_poste", "lecture_seule"),
    canViewReglages: isSuperAdmin || hasRole("admin_poste"),
  };
}
