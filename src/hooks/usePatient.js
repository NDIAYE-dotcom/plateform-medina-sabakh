import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

/** Fiche patient complète : informations + documents + vaccins + visites + consultations + grossesses + notes de suivi. */
export function usePatient(patientId) {
  const [patient, setPatient] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [vaccinations, setVaccinations] = useState([]);
  const [visites, setVisites] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [grossesses, setGrossesses] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!patientId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const [
      patientResult,
      documentsResult,
      vaccinationsResult,
      visitesResult,
      consultationsResult,
      prescriptionsResult,
      grossessesResult,
      cpnResult,
      notesResult,
    ] = await Promise.all([
      supabase.from("patients").select("*").eq("id", patientId).maybeSingle(),
      supabase
        .from("patient_documents")
        .select("*")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false }),
      supabase
        .from("patient_vaccinations")
        .select("*")
        .eq("patient_id", patientId)
        .order("date_administration", { ascending: false }),
      supabase
        .from("patient_visites")
        .select("*")
        .eq("patient_id", patientId)
        .order("date_visite", { ascending: false }),
      supabase
        .from("consultations")
        .select("*")
        .eq("patient_id", patientId)
        .order("date_consultation", { ascending: false }),
      supabase
        .from("consultation_prescriptions")
        .select("*")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: true }),
      supabase
        .from("grossesses")
        .select("*")
        .eq("patient_id", patientId)
        .order("date_dernieres_regles", { ascending: false }),
      supabase
        .from("consultations_prenatales")
        .select("*")
        .eq("patient_id", patientId)
        .order("numero", { ascending: true }),
      supabase
        .from("patient_notes_suivi")
        .select("*")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false }),
    ]);

    if (patientResult.error) {
      console.error("Erreur de chargement du patient :", patientResult.error.message);
    }

    const prescriptions = prescriptionsResult.data ?? [];
    const consultationsWithPrescriptions = (consultationsResult.data ?? []).map((consultation) => ({
      ...consultation,
      prescriptions: prescriptions.filter((p) => p.consultation_id === consultation.id),
    }));

    const cpns = cpnResult.data ?? [];
    const grossessesWithCpn = (grossessesResult.data ?? []).map((grossesse) => ({
      ...grossesse,
      cpns: cpns.filter((c) => c.grossesse_id === grossesse.id),
    }));

    setPatient(patientResult.data ?? null);
    setDocuments(documentsResult.data ?? []);
    setVaccinations(vaccinationsResult.data ?? []);
    setVisites(visitesResult.data ?? []);
    setConsultations(consultationsWithPrescriptions);
    setGrossesses(grossessesWithCpn);
    setNotes(notesResult.data ?? []);
    setLoading(false);
  }, [patientId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    patient,
    documents,
    vaccinations,
    visites,
    consultations,
    grossesses,
    notes,
    loading,
    refetch: fetchAll,
  };
}
