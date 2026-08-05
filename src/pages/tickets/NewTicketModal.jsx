import { useEffect, useState } from "react";
import { Button, Input, Modal, Textarea } from "../../components/ui";
import { SearchIcon } from "../../components/ui/icons";
import { useToast } from "../../context/ToastContext";
import { supabase } from "../../lib/supabaseClient";

export default function NewTicketModal({ open, onClose, posteId, userId, defaultMontant, onCreated }) {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [nomVisiteur, setNomVisiteur] = useState("");
  const [motif, setMotif] = useState("");
  const [montant, setMontant] = useState("0");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setMontant(String(defaultMontant ?? 0));
    } else {
      setSearch("");
      setResults([]);
      setSelectedPatient(null);
      setNomVisiteur("");
      setMotif("");
    }
  }, [open, defaultMontant]);

  useEffect(() => {
    if (!posteId || !search.trim() || selectedPatient) {
      setResults([]);
      return undefined;
    }

    let active = true;
    const term = search.trim();
    supabase
      .from("patients")
      .select("id, nom, prenom, numero_dossier")
      .eq("poste_id", posteId)
      .or(`nom.ilike.%${term}%,prenom.ilike.%${term}%`)
      .limit(5)
      .then(({ data }) => {
        if (active) setResults(data ?? []);
      });

    return () => {
      active = false;
    };
  }, [search, posteId, selectedPatient]);

  const selectPatient = (patient) => {
    setSelectedPatient(patient);
    setNomVisiteur(`${patient.prenom} ${patient.nom}`);
    setSearch(`${patient.prenom} ${patient.nom}`);
    setResults([]);
  };

  const clearPatientSelection = () => {
    setSelectedPatient(null);
    setSearch("");
    setNomVisiteur("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!nomVisiteur.trim()) {
      toast.error("Le nom du visiteur est obligatoire.");
      return;
    }

    const montantNumber = Number(montant);
    if (!Number.isInteger(montantNumber) || montantNumber < 0) {
      toast.error("Le montant doit être un nombre entier positif.");
      return;
    }

    setSubmitting(true);
    const { data, error } = await supabase
      .from("tickets")
      .insert({
        poste_id: posteId,
        patient_id: selectedPatient?.id ?? null,
        nom_visiteur: nomVisiteur.trim(),
        motif: motif.trim() || null,
        montant: montantNumber,
        created_by: userId,
      })
      .select()
      .single();
    setSubmitting(false);

    if (error) {
      toast.error("Impossible de créer le ticket.");
      return;
    }

    toast.success(`Ticket n° ${data.numero} créé.`);
    onCreated(data);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Nouveau ticket">
      <form className="new-ticket-modal__form" onSubmit={handleSubmit}>
        <div className="new-ticket-modal__search-wrap">
          <Input
            label="Rechercher un patient existant (optionnel)"
            icon={<SearchIcon />}
            placeholder="Nom ou prénom..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              if (selectedPatient) setSelectedPatient(null);
            }}
          />
          {results.length > 0 && (
            <ul className="new-ticket-modal__results">
              {results.map((patient) => (
                <li key={patient.id}>
                  <button type="button" onClick={() => selectPatient(patient)}>
                    {patient.prenom} {patient.nom}{" "}
                    <span className="new-ticket-modal__result-dossier">
                      N° {patient.numero_dossier}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {selectedPatient && (
            <button
              type="button"
              className="new-ticket-modal__clear"
              onClick={clearPatientSelection}
            >
              ✕ Retirer la sélection ({selectedPatient.prenom} {selectedPatient.nom})
            </button>
          )}
        </div>

        <Input
          label="Nom du visiteur"
          required
          value={nomVisiteur}
          onChange={(event) => setNomVisiteur(event.target.value)}
          disabled={Boolean(selectedPatient)}
          hint={selectedPatient ? "Rempli automatiquement depuis la fiche patient" : undefined}
        />

        <Textarea
          label="Motif (optionnel)"
          rows={2}
          value={motif}
          onChange={(event) => setMotif(event.target.value)}
          placeholder="Ex. fièvre, consultation de suivi..."
        />

        <Input
          label="Montant encaissé (FCFA)"
          type="number"
          min="0"
          step="1"
          required
          value={montant}
          onChange={(event) => setMontant(event.target.value)}
        />

        <Button type="submit" fullWidth loading={submitting}>
          Créer le ticket
        </Button>
      </form>
    </Modal>
  );
}
