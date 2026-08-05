import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const PAGE_SIZE = 30;

function groupByConsultation(rows) {
  const groups = new Map();
  for (const row of rows) {
    if (!groups.has(row.consultation_id)) {
      groups.set(row.consultation_id, {
        consultationId: row.consultation_id,
        patient: row.patients,
        createdAt: row.created_at,
        lignes: [],
      });
    }
    groups.get(row.consultation_id).lignes.push(row);
  }
  return Array.from(groups.values());
}

/**
 * Ordonnances récentes du poste, groupées par consultation, pour que la Pharmacie puisse
 * anticiper les médicaments à préparer avant l'arrivée du patient. Ne lit que
 * consultation_prescriptions (médicament/posologie/durée + patient) — jamais la table
 * consultations (diagnostic, examen clinique...), restée réservée aux rôles cliniques.
 */
export function useOrdonnancesPharmacie(posteId, { search = "", onlyToday = false } = {}) {
  const [ordonnances, setOrdonnances] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrdonnances = useCallback(async () => {
    if (!posteId) {
      setOrdonnances([]);
      setLoading(false);
      return;
    }

    setLoading(true);
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
        setOrdonnances([]);
        setLoading(false);
        return;
      }
    }

    let query = supabase
      .from("consultation_prescriptions")
      .select("id, consultation_id, medicament, posologie, duree, created_at, patients(id, nom, prenom, numero_dossier)")
      .eq("poste_id", posteId)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    if (onlyToday) {
      query = query.gte("created_at", `${new Date().toISOString().slice(0, 10)}T00:00:00`);
    }

    if (patientIds) {
      query = query.in("patient_id", patientIds);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Erreur de chargement des ordonnances :", error.message);
      setOrdonnances([]);
    } else {
      setOrdonnances(groupByConsultation(data ?? []));
    }
    setLoading(false);
  }, [posteId, search, onlyToday]);

  useEffect(() => {
    fetchOrdonnances();
  }, [fetchOrdonnances]);

  return { ordonnances, loading, refetch: fetchOrdonnances };
}
