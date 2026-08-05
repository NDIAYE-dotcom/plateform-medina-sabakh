import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

/** Charge un poste de santé à partir de son slug d'URL (/poste/:slug). */
export function usePosteBySlug(slug) {
  const [poste, setPoste] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPoste = useCallback(async () => {
    if (!slug) {
      setPoste(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("postes_sante")
      .select("id, nom, slug, prix_ticket, telephone, nom_chef, cachet_url, signature_url")
      .eq("slug", slug)
      .maybeSingle();

    if (error) console.error("Erreur de chargement du poste :", error.message);
    setPoste(data ?? null);
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    fetchPoste();
  }, [fetchPoste]);

  return { poste, loading, refetch: fetchPoste };
}
