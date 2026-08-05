import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

/**
 * Comptes inscrits ayant demandé CE poste mais pas encore affectés (poste_id null,
 * poste_souhaite_id = posteId). Filtre explicite côté requête : la RLS restreint déjà un
 * Administrateur Poste à son propre poste, mais le Super Admin voit tous les postes — sans ce
 * filtre, sa page Personnel afficherait les comptes en attente de TOUS les postes mélangés,
 * pas seulement ceux du poste affiché.
 */
export function usePendingProfiles(posteId, enabled) {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPending = useCallback(async () => {
    if (!enabled || !posteId) {
      setPending([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, created_at")
      .is("poste_id", null)
      .eq("poste_souhaite_id", posteId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Erreur de chargement des comptes en attente :", error.message);
      setPending([]);
    } else {
      setPending(data ?? []);
    }
    setLoading(false);
  }, [enabled, posteId]);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  return { pending, loading, refetch: fetchPending };
}
