import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const STALE_INVENTAIRE_DAYS = 2;

const EMPTY_RESULT = {
  stockBasCount: 0,
  comptesEnAttenteCount: 0,
  inventairesEnCoursCount: 0,
};

/**
 * Alertes du poste pour la cloche de notifications — reflète toujours l'état actuel (pas
 * d'historique, pas de statut lu/non lu), même principe que les KPI du tableau de bord.
 * Chaque type d'alerte n'est calculé que si le rôle courant a accès au module concerné.
 */
export function usePosteAlerts(posteId, { includePharmacie = false, includePersonnel = false } = {}) {
  const [data, setData] = useState(EMPTY_RESULT);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = useCallback(async () => {
    if (!posteId || (!includePharmacie && !includePersonnel)) {
      setData(EMPTY_RESULT);
      setLoading(false);
      return;
    }

    setLoading(true);
    const staleDate = new Date(
      Date.now() - STALE_INVENTAIRE_DAYS * 24 * 60 * 60 * 1000
    ).toISOString();

    const [articlesResult, comptesResult, inventairesResult] = await Promise.all([
      includePharmacie
        ? supabase.from("articles_stock").select("stock_actuel, seuil_alerte").eq("poste_id", posteId)
        : Promise.resolve({ data: [], error: null }),
      includePersonnel
        ? supabase
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .eq("poste_souhaite_id", posteId)
            .is("poste_id", null)
        : Promise.resolve({ count: 0, error: null }),
      includePharmacie
        ? supabase
            .from("inventaires")
            .select("id", { count: "exact", head: true })
            .eq("poste_id", posteId)
            .eq("statut", "en_cours")
            .lt("created_at", staleDate)
        : Promise.resolve({ count: 0, error: null }),
    ]);

    [
      ["articles", articlesResult],
      ["comptes en attente", comptesResult],
      ["inventaires", inventairesResult],
    ].forEach(([label, result]) => {
      if (result.error) console.error(`Erreur alertes poste (${label}) :`, result.error.message);
    });

    const stockBasCount = (articlesResult.data ?? []).filter(
      (a) => a.stock_actuel <= a.seuil_alerte
    ).length;

    setData({
      stockBasCount,
      comptesEnAttenteCount: comptesResult.count ?? 0,
      inventairesEnCoursCount: inventairesResult.count ?? 0,
    });
    setLoading(false);
  }, [posteId, includePharmacie, includePersonnel]);

  useEffect(() => {
    fetchAlerts();

    if (!posteId) return undefined;

    const channel = supabase
      .channel(`poste-alerts-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "articles_stock", filter: `poste_id=eq.${posteId}` },
        fetchAlerts
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles", filter: `poste_souhaite_id=eq.${posteId}` },
        fetchAlerts
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "inventaires", filter: `poste_id=eq.${posteId}` },
        fetchAlerts
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAlerts, posteId]);

  return { ...data, loading, refetch: fetchAlerts };
}
