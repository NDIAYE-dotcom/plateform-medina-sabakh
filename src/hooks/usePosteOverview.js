import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

function today() {
  return new Date().toISOString().slice(0, 10);
}

const EMPTY_RESULT = {
  patientsTotal: 0,
  ticketsAujourdhui: 0,
  ticketsEnAttente: 0,
  consultationsAujourdhui: 0,
  articlesRupture: 0,
};

/**
 * Aperçu du jour pour l'accueil d'un poste — chaque champ n'est utile qu'au rôle qui a accès au
 * module correspondant ; c'est à l'appelant de ne rendre que ce que le rôle courant peut voir.
 */
export function usePosteOverview(posteId, { includeConsultations = false, includePharmacie = false } = {}) {
  const [data, setData] = useState(EMPTY_RESULT);
  const [loading, setLoading] = useState(true);

  const fetchOverview = useCallback(async () => {
    if (!posteId) {
      setData(EMPTY_RESULT);
      setLoading(false);
      return;
    }

    setLoading(true);
    const jour = today();
    const finHoraire = `${jour}T23:59:59`;

    const [patientsResult, ticketsResult, consultationsResult, articlesResult] = await Promise.all([
      supabase.from("patients").select("id", { count: "exact", head: true }).eq("poste_id", posteId),
      supabase.from("tickets").select("statut").eq("poste_id", posteId).eq("date_ticket", jour),
      includeConsultations
        ? supabase
            .from("consultations")
            .select("id", { count: "exact", head: true })
            .eq("poste_id", posteId)
            .gte("date_consultation", jour)
            .lte("date_consultation", finHoraire)
        : Promise.resolve({ count: 0, error: null }),
      includePharmacie
        ? supabase.from("articles_stock").select("stock_actuel, seuil_alerte").eq("poste_id", posteId)
        : Promise.resolve({ data: [], error: null }),
    ]);

    [
      ["patients", patientsResult],
      ["tickets", ticketsResult],
      ["consultations", consultationsResult],
      ["articles", articlesResult],
    ].forEach(([label, result]) => {
      if (result.error) console.error(`Erreur aperçu du poste (${label}) :`, result.error.message);
    });

    const tickets = ticketsResult.data ?? [];
    const articlesRupture = (articlesResult.data ?? []).filter(
      (a) => a.stock_actuel <= a.seuil_alerte
    ).length;

    setData({
      patientsTotal: patientsResult.count ?? 0,
      ticketsAujourdhui: tickets.length,
      ticketsEnAttente: tickets.filter((t) => t.statut === "en_attente").length,
      consultationsAujourdhui: consultationsResult.count ?? 0,
      articlesRupture,
    });
    setLoading(false);
  }, [posteId, includeConsultations, includePharmacie]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  return { ...data, loading, refetch: fetchOverview };
}
