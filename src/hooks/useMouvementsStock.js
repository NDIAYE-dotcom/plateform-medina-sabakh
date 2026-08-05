import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const PAGE_SIZE = 20;

/** Historique paginé des mouvements de stock d'un poste (entrées + sorties), le plus récent d'abord. */
export function useMouvementsStock(posteId, { type, search = "" } = {}) {
  const [mouvements, setMouvements] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchMouvements = useCallback(async () => {
    if (!posteId) {
      setMouvements([]);
      setTotal(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const term = search.trim();
    let articleIds = null;
    if (term) {
      const { data: matches } = await supabase
        .from("articles_stock")
        .select("id")
        .eq("poste_id", posteId)
        .ilike("nom", `%${term}%`);
      articleIds = (matches ?? []).map((a) => a.id);

      if (articleIds.length === 0) {
        setMouvements([]);
        setTotal(0);
        setLoading(false);
        return;
      }
    }

    let query = supabase
      .from("mouvements_stock")
      .select("*, articles_stock(nom, unite), patients(id, nom, prenom)", { count: "exact" })
      .eq("poste_id", posteId)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (type) {
      query = query.eq("type", type);
    }

    if (articleIds) {
      query = query.in("article_id", articleIds);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Erreur de chargement de l'historique des mouvements :", error.message);
      setMouvements([]);
      setTotal(0);
    } else {
      setMouvements(data ?? []);
      setTotal(count ?? 0);
    }
    setLoading(false);
  }, [posteId, type, search, page]);

  useEffect(() => {
    fetchMouvements();
  }, [fetchMouvements]);

  useEffect(() => {
    setPage(1);
  }, [type, search]);

  return {
    mouvements,
    total,
    page,
    setPage,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    loading,
    refetch: fetchMouvements,
  };
}
