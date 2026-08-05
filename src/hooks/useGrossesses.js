import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const PAGE_SIZE = 10;

/** Journal paginé + recherche des grossesses d'un poste (isolation garantie par la RLS). */
export function useGrossesses(posteId, search = "") {
  const [grossesses, setGrossesses] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchGrossesses = useCallback(async () => {
    if (!posteId) {
      setGrossesses([]);
      setTotal(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const term = search.trim();
    let patientIds = null;
    if (term) {
      const { data: matches } = await supabase
        .from("patients")
        .select("id")
        .eq("poste_id", posteId)
        .or(`nom.ilike.%${term}%,prenom.ilike.%${term}%`);
      patientIds = (matches ?? []).map((p) => p.id);

      if (patientIds.length === 0) {
        setGrossesses([]);
        setTotal(0);
        setLoading(false);
        return;
      }
    }

    let query = supabase
      .from("grossesses")
      .select(
        "id, statut, date_dernieres_regles, date_prevue_accouchement, patients(id, nom, prenom, numero_dossier)",
        { count: "exact" }
      )
      .eq("poste_id", posteId)
      .order("date_prevue_accouchement", { ascending: true })
      .range(from, to);

    if (patientIds) {
      query = query.in("patient_id", patientIds);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Erreur de chargement des grossesses :", error.message);
      setGrossesses([]);
      setTotal(0);
    } else {
      setGrossesses(data ?? []);
      setTotal(count ?? 0);
    }
    setLoading(false);
  }, [posteId, page, search]);

  useEffect(() => {
    fetchGrossesses();
  }, [fetchGrossesses]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  return {
    grossesses,
    total,
    page,
    setPage,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    loading,
    refetch: fetchGrossesses,
  };
}
