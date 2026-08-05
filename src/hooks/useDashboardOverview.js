import { useCallback, useEffect, useState } from "react";
import { getRoleLabel } from "../constants/roles";
import { supabase } from "../lib/supabaseClient";

const initialState = {
  totalPostes: 0,
  totalUsers: 0,
  roleBreakdown: [],
  postesWithoutAdmin: [],
  postesOverview: [],
  pendingAccounts: [],
  loading: true,
};

/**
 * Statistiques réelles du tableau de bord (postes, utilisateurs, répartition par rôle,
 * postes sans administrateur assigné, effectif par poste), synchronisées en temps réel via
 * Supabase Realtime. Réservé au Super Administrateur UCDS (vue globale) — passer `enabled: false`
 * ailleurs pour éviter une requête et un canal Realtime inutiles (un Administrateur Poste de Santé
 * n'a de toute façon pas la visibilité RLS sur les autres postes, le calcul serait faussé).
 */
export function useDashboardOverview({ enabled = true } = {}) {
  const [state, setState] = useState(initialState);

  const fetchOverview = useCallback(async () => {
    const [postesResult, profilesResult, pendingResult] = await Promise.all([
      supabase.from("postes_sante").select("id, nom, slug").order("nom"),
      supabase.from("profiles").select("role, poste_id"),
      supabase
        .from("profiles")
        .select("id, full_name, created_at, poste_souhaite:postes_sante!poste_souhaite_id(nom, slug)")
        .is("poste_id", null)
        .not("poste_souhaite_id", "is", null)
        .order("created_at", { ascending: true }),
    ]);

    if (postesResult.error || profilesResult.error || pendingResult.error) {
      console.error(
        "Erreur de chargement du tableau de bord :",
        postesResult.error?.message || profilesResult.error?.message || pendingResult.error?.message
      );
      setState((current) => ({ ...current, loading: false }));
      return;
    }

    const postes = postesResult.data ?? [];
    const profiles = profilesResult.data ?? [];

    const roleCounts = profiles.reduce((acc, profile) => {
      acc[profile.role] = (acc[profile.role] ?? 0) + 1;
      return acc;
    }, {});

    const roleBreakdown = Object.entries(roleCounts)
      .map(([role, value]) => ({ label: getRoleLabel(role), value }))
      .sort((a, b) => b.value - a.value);

    const postesWithAdminIds = new Set(
      profiles
        .filter((profile) => profile.role === "admin_poste" && profile.poste_id)
        .map((profile) => profile.poste_id)
    );
    const postesWithoutAdmin = postes.filter((poste) => !postesWithAdminIds.has(poste.id));

    const staffCountByPoste = profiles.reduce((acc, profile) => {
      if (!profile.poste_id) return acc;
      acc[profile.poste_id] = (acc[profile.poste_id] ?? 0) + 1;
      return acc;
    }, {});

    const postesOverview = postes.map((poste) => ({
      ...poste,
      staffCount: staffCountByPoste[poste.id] ?? 0,
      hasAdmin: postesWithAdminIds.has(poste.id),
    }));

    setState({
      totalPostes: postes.length,
      totalUsers: profiles.length,
      roleBreakdown,
      postesWithoutAdmin,
      postesOverview,
      pendingAccounts: pendingResult.data ?? [],
      loading: false,
    });
  }, []);

  useEffect(() => {
    if (!enabled) {
      setState((current) => ({ ...current, loading: false }));
      return undefined;
    }

    fetchOverview();

    // Nom de canal unique à chaque montage : en StrictMode, React monte/démonte/remonte les
    // effets une fois en développement, et Supabase réutilise un canal existant portant le même
    // nom s'il n'a pas encore fini d'être supprimé — ce qui fait échouer .on() après .subscribe().
    const channel = supabase
      .channel(`dashboard-overview-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, fetchOverview)
      .on("postgres_changes", { event: "*", schema: "public", table: "postes_sante" }, fetchOverview)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, fetchOverview]);

  return {
    ...state,
    alertsCount: state.postesWithoutAdmin.length + state.pendingAccounts.length,
  };
}
