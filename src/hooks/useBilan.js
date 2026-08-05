import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const sum = (rows, key) => rows.reduce((total, row) => total + (row[key] ?? 0), 0);

/** Bilan financier d'un poste sur une période : recettes tickets + pharmacie, dépenses, solde. */
export function useBilan(posteId, dateDebut, dateFin) {
  const [recettesTickets, setRecettesTickets] = useState(0);
  const [recettesPharmacie, setRecettesPharmacie] = useState(0);
  const [depenses, setDepenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBilan = useCallback(async () => {
    if (!posteId || !dateDebut || !dateFin) {
      setRecettesTickets(0);
      setRecettesPharmacie(0);
      setDepenses([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const finHoraire = `${dateFin}T23:59:59`;

    const [ticketsResult, mouvementsResult, depensesResult] = await Promise.all([
      supabase
        .from("tickets")
        .select("montant")
        .eq("poste_id", posteId)
        .gte("date_ticket", dateDebut)
        .lte("date_ticket", dateFin),
      supabase
        .from("mouvements_stock")
        .select("montant")
        .eq("poste_id", posteId)
        .eq("type", "sortie")
        .gte("created_at", dateDebut)
        .lte("created_at", finHoraire),
      supabase
        .from("depenses")
        .select("*")
        .eq("poste_id", posteId)
        .gte("date_depense", dateDebut)
        .lte("date_depense", dateFin)
        .order("date_depense", { ascending: false }),
    ]);

    if (ticketsResult.error) console.error("Erreur recettes tickets :", ticketsResult.error.message);
    if (mouvementsResult.error) console.error("Erreur recettes pharmacie :", mouvementsResult.error.message);
    if (depensesResult.error) console.error("Erreur dépenses :", depensesResult.error.message);

    setRecettesTickets(sum(ticketsResult.data ?? [], "montant"));
    setRecettesPharmacie(sum(mouvementsResult.data ?? [], "montant"));
    setDepenses(depensesResult.data ?? []);
    setLoading(false);
  }, [posteId, dateDebut, dateFin]);

  useEffect(() => {
    fetchBilan();
  }, [fetchBilan]);

  const totalDepenses = sum(depenses, "montant");
  const totalRecettes = recettesTickets + recettesPharmacie;

  return {
    recettesTickets,
    recettesPharmacie,
    totalRecettes,
    depenses,
    totalDepenses,
    solde: totalRecettes - totalDepenses,
    loading,
    refetch: fetchBilan,
  };
}
