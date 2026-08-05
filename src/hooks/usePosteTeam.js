import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

/**
 * Équipe d'un poste de santé. La visibilité réelle est garantie par les policies RLS
 * (un Administrateur Poste de Santé ne voit que son propre poste, le Super Admin voit tout).
 */
export function usePosteTeam(posteId) {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTeam = useCallback(async () => {
    if (!posteId) {
      setTeam([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, role")
      .eq("poste_id", posteId)
      .order("full_name");

    if (error) {
      console.error("Erreur de chargement de l'équipe :", error.message);
      setTeam([]);
    } else {
      setTeam(data ?? []);
    }
    setLoading(false);
  }, [posteId]);

  useEffect(() => {
    fetchTeam();

    if (!posteId) return undefined;

    const channel = supabase
      .channel(`poste-team-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles", filter: `poste_id=eq.${posteId}` },
        fetchTeam
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTeam, posteId]);

  return { team, loading, refetch: fetchTeam };
}
