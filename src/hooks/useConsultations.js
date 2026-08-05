import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const PAGE_SIZE = 10;

/** Journal paginé + recherche des consultations d'un poste (isolation garantie par la RLS). */
export function useConsultations(posteId, search = "") {
  const [consultations, setConsultations] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchConsultations = useCallback(async () => {
    if (!posteId) {
      setConsultations([]);
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
        setConsultations([]);
        setTotal(0);
        setLoading(false);
        return;
      }
    }

    let query = supabase
      .from("consultations")
      .select("id, date_consultation, motif, diagnostic, patients(id, nom, prenom, numero_dossier)", {
        count: "exact",
      })
      .eq("poste_id", posteId)
      .order("date_consultation", { ascending: false })
      .range(from, to);

    if (patientIds) {
      query = query.in("patient_id", patientIds);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Erreur de chargement des consultations :", error.message);
      setConsultations([]);
      setTotal(0);
    } else {
      setConsultations(data ?? []);
      setTotal(count ?? 0);
    }
    setLoading(false);
  }, [posteId, page, search]);

  useEffect(() => {
    fetchConsultations();
  }, [fetchConsultations]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  return {
    consultations,
    total,
    page,
    setPage,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    loading,
    refetch: fetchConsultations,
  };
}
