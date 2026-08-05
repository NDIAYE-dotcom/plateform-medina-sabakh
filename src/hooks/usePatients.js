import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const PAGE_SIZE = 10;

/** Liste paginée + recherche des patients d'un poste (isolation garantie par la RLS). */
export function usePatients(posteId, search = "") {
  const [patients, setPatients] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchPatients = useCallback(async () => {
    if (!posteId) {
      setPatients([]);
      setTotal(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from("patients")
      .select("id, numero_dossier, nom, prenom, date_naissance, sexe, telephone", { count: "exact" })
      .eq("poste_id", posteId)
      .order("created_at", { ascending: false })
      .range(from, to);

    const term = search.trim();
    if (term) {
      query = query.or(`nom.ilike.%${term}%,prenom.ilike.%${term}%,numero_dossier.ilike.%${term}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Erreur de chargement des patients :", error.message);
      setPatients([]);
      setTotal(0);
    } else {
      setPatients(data ?? []);
      setTotal(count ?? 0);
    }
    setLoading(false);
  }, [posteId, page, search]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  return {
    patients,
    total,
    page,
    setPage,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    loading,
    refetch: fetchPatients,
  };
}
