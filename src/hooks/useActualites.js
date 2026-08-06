import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

/** Actualités publiques (blog, évènements, campagnes...) — lecture ouverte à tous, y compris anonyme. */
export function useActualites({ categorie } = {}) {
  const [actualites, setActualites] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchActualites = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("actualites").select("*").order("created_at", { ascending: false });

    if (categorie) {
      query = query.eq("categorie", categorie);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Erreur de chargement des actualités :", error.message);
      setActualites([]);
    } else {
      setActualites(data ?? []);
    }
    setLoading(false);
  }, [categorie]);

  useEffect(() => {
    fetchActualites();
  }, [fetchActualites]);

  return { actualites, loading, refetch: fetchActualites };
}
