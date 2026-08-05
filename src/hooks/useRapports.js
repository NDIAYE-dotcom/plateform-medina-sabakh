import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { getRoleLabel } from "../constants/roles";
import { TICKET_STATUTS } from "../constants/tickets";

const sum = (rows, key) => rows.reduce((total, row) => total + (row[key] ?? 0), 0);

const EMPTY_RESULT = {
  nouveauxPatients: 0,
  ticketsTotal: 0,
  ticketsParStatut: [],
  consultationsTotal: 0,
  consultationsParJour: [],
  cpnTotal: 0,
  accouchementsTotal: 0,
  ventesPharmacie: 0,
  sortiesPharmacieCount: 0,
  entreesPharmacieCount: 0,
  recettesTickets: 0,
  totalRecettes: 0,
  totalDepenses: 0,
  solde: 0,
  articlesEnRupture: [],
  personnelParRole: [],
};

/** Statistiques agrégées d'un poste sur une période, tous modules confondus. */
export function useRapports(posteId, dateDebut, dateFin) {
  const [data, setData] = useState(EMPTY_RESULT);
  const [loading, setLoading] = useState(true);

  const fetchRapports = useCallback(async () => {
    if (!posteId || !dateDebut || !dateFin) {
      setData(EMPTY_RESULT);
      setLoading(false);
      return;
    }

    setLoading(true);
    const finHoraire = `${dateFin}T23:59:59`;

    const [
      patientsResult,
      ticketsResult,
      consultationsResult,
      cpnResult,
      accouchementsResult,
      mouvementsResult,
      depensesResult,
      articlesResult,
      personnelResult,
    ] = await Promise.all([
      supabase
        .from("patients")
        .select("id", { count: "exact", head: true })
        .eq("poste_id", posteId)
        .gte("created_at", dateDebut)
        .lte("created_at", finHoraire),
      supabase
        .from("tickets")
        .select("statut, montant")
        .eq("poste_id", posteId)
        .gte("date_ticket", dateDebut)
        .lte("date_ticket", dateFin),
      supabase
        .from("consultations")
        .select("date_consultation")
        .eq("poste_id", posteId)
        .gte("date_consultation", dateDebut)
        .lte("date_consultation", finHoraire),
      supabase
        .from("consultations_prenatales")
        .select("id", { count: "exact", head: true })
        .eq("poste_id", posteId)
        .gte("date_cpn", dateDebut)
        .lte("date_cpn", dateFin),
      supabase
        .from("grossesses")
        .select("id", { count: "exact", head: true })
        .eq("poste_id", posteId)
        .eq("statut", "accouchee")
        .gte("date_accouchement", dateDebut)
        .lte("date_accouchement", dateFin),
      supabase
        .from("mouvements_stock")
        .select("type, montant")
        .eq("poste_id", posteId)
        .gte("created_at", dateDebut)
        .lte("created_at", finHoraire),
      supabase
        .from("depenses")
        .select("montant")
        .eq("poste_id", posteId)
        .gte("date_depense", dateDebut)
        .lte("date_depense", dateFin),
      supabase
        .from("articles_stock")
        .select("nom, unite, stock_actuel, seuil_alerte")
        .eq("poste_id", posteId)
        .order("nom"),
      supabase.from("profiles").select("role").eq("poste_id", posteId),
    ]);

    [
      ["patients", patientsResult],
      ["tickets", ticketsResult],
      ["consultations", consultationsResult],
      ["CPN", cpnResult],
      ["accouchements", accouchementsResult],
      ["mouvements de stock", mouvementsResult],
      ["dépenses", depensesResult],
      ["articles", articlesResult],
      ["personnel", personnelResult],
    ].forEach(([label, result]) => {
      if (result.error) console.error(`Erreur rapport (${label}) :`, result.error.message);
    });

    const tickets = ticketsResult.data ?? [];
    const ticketsParStatut = Object.entries(TICKET_STATUTS).map(([statut, meta]) => ({
      label: meta.label,
      value: tickets.filter((t) => t.statut === statut).length,
    }));

    const consultations = consultationsResult.data ?? [];
    const parJour = new Map();
    consultations.forEach((c) => {
      const jour = (c.date_consultation ?? "").slice(0, 10);
      parJour.set(jour, (parJour.get(jour) ?? 0) + 1);
    });
    const consultationsParJour = Array.from(parJour.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([jour, value]) => ({ label: jour.slice(5).split("-").reverse().join("/"), value }));

    const mouvements = mouvementsResult.data ?? [];
    const sorties = mouvements.filter((m) => m.type === "sortie");
    const entrees = mouvements.filter((m) => m.type === "entree");

    const recettesTickets = sum(tickets, "montant");
    const ventesPharmacie = sum(sorties, "montant");
    const totalRecettes = recettesTickets + ventesPharmacie;
    const totalDepenses = sum(depensesResult.data ?? [], "montant");

    const articlesEnRupture = (articlesResult.data ?? []).filter(
      (a) => a.stock_actuel <= a.seuil_alerte
    );

    const roleCounts = new Map();
    (personnelResult.data ?? []).forEach((p) => {
      if (!p.role) return;
      roleCounts.set(p.role, (roleCounts.get(p.role) ?? 0) + 1);
    });
    const personnelParRole = Array.from(roleCounts.entries()).map(([role, value]) => ({
      label: getRoleLabel(role),
      value,
    }));

    setData({
      nouveauxPatients: patientsResult.count ?? 0,
      ticketsTotal: tickets.length,
      ticketsParStatut,
      consultationsTotal: consultations.length,
      consultationsParJour,
      cpnTotal: cpnResult.count ?? 0,
      accouchementsTotal: accouchementsResult.count ?? 0,
      ventesPharmacie,
      sortiesPharmacieCount: sorties.length,
      entreesPharmacieCount: entrees.length,
      recettesTickets,
      totalRecettes,
      totalDepenses,
      solde: totalRecettes - totalDepenses,
      articlesEnRupture,
      personnelParRole,
    });
    setLoading(false);
  }, [posteId, dateDebut, dateFin]);

  useEffect(() => {
    fetchRapports();
  }, [fetchRapports]);

  return { ...data, loading, refetch: fetchRapports };
}
