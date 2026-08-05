import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * File de tickets d'un poste pour une date donnée. Temps réel activé uniquement pour la date du
 * jour (la file d'attente en cours) — l'historique (dates passées) n'a pas besoin de sync live.
 */
export function useTickets(posteId, date) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const isToday = date === todayISO();

  const fetchTickets = useCallback(async () => {
    if (!posteId || !date) {
      setTickets([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("tickets")
      .select("*")
      .eq("poste_id", posteId)
      .eq("date_ticket", date)
      .order("numero", { ascending: true });

    if (error) {
      console.error("Erreur de chargement des tickets :", error.message);
      setTickets([]);
    } else {
      setTickets(data ?? []);
    }
    setLoading(false);
  }, [posteId, date]);

  useEffect(() => {
    fetchTickets();

    if (!isToday || !posteId) return undefined;

    const channel = supabase
      .channel(`tickets-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tickets", filter: `poste_id=eq.${posteId}` },
        fetchTickets
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTickets, isToday, posteId]);

  const counts = tickets.reduce(
    (acc, ticket) => {
      acc[ticket.statut] = (acc[ticket.statut] ?? 0) + 1;
      return acc;
    },
    { en_attente: 0, en_cours: 0, termine: 0, annule: 0 }
  );

  return { tickets, loading, counts, refetch: fetchTickets };
}
