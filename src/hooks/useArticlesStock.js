import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const PAGE_SIZE = 15;

/** Catalogue paginé + recherche des articles d'un poste, filtrable par catégorie. */
export function useArticlesStock(posteId, { categorie, search = "" } = {}) {
  const [articles, setArticles] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchArticles = useCallback(async () => {
    if (!posteId) {
      setArticles([]);
      setTotal(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from("articles_stock")
      .select("*", { count: "exact" })
      .eq("poste_id", posteId)
      .order("nom", { ascending: true })
      .range(from, to);

    if (categorie) {
      query = query.eq("categorie", categorie);
    }

    const term = search.trim();
    if (term) {
      query = query.ilike("nom", `%${term}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Erreur de chargement des articles :", error.message);
      setArticles([]);
      setTotal(0);
    } else {
      setArticles(data ?? []);
      setTotal(count ?? 0);
    }
    setLoading(false);
  }, [posteId, categorie, search, page]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  useEffect(() => {
    setPage(1);
  }, [categorie, search]);

  return {
    articles,
    total,
    page,
    setPage,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    loading,
    refetch: fetchArticles,
  };
}
