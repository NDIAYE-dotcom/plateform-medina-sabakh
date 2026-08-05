import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const PAGE_SIZE = 15;

/** Journal paginé des inventaires d'un poste, le plus récent d'abord. */
export function useInventaires(posteId) {
  const [inventaires, setInventaires] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchInventaires = useCallback(async () => {
    if (!posteId) {
      setInventaires([]);
      setTotal(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error, count } = await supabase
      .from("inventaires")
      .select("*", { count: "exact" })
      .eq("poste_id", posteId)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Erreur de chargement des inventaires :", error.message);
      setInventaires([]);
      setTotal(0);
    } else {
      setInventaires(data ?? []);
      setTotal(count ?? 0);
    }
    setLoading(false);
  }, [posteId, page]);

  useEffect(() => {
    fetchInventaires();
  }, [fetchInventaires]);

  return {
    inventaires,
    total,
    page,
    setPage,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    loading,
    refetch: fetchInventaires,
  };
}
