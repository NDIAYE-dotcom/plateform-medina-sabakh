import { useEffect, useState } from "react";
import { Input, Modal } from "../../components/ui";
import { SearchIcon } from "../../components/ui/icons";
import { supabase } from "../../lib/supabaseClient";

export default function NewConsultationModal({ open, onClose, posteId, onSelectPatient }) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  useEffect(() => {
    if (!posteId || !search.trim()) {
      setResults([]);
      return undefined;
    }

    let active = true;
    const term = search.trim();
    supabase
      .from("patients")
      .select("id, nom, prenom, numero_dossier")
      .eq("poste_id", posteId)
      .or(`nom.ilike.%${term}%,prenom.ilike.%${term}%,numero_dossier.ilike.%${term}%`)
      .limit(8)
      .then(({ data }) => {
        if (active) setResults(data ?? []);
      });

    return () => {
      active = false;
    };
  }, [search, posteId]);

  return (
    <Modal open={open} onClose={onClose} title="Nouvelle consultation">
      <div className="new-consultation-modal__search-wrap">
        <Input
          icon={<SearchIcon />}
          placeholder="Rechercher un patient par nom, prénom ou n° de dossier..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          autoFocus
        />
        {results.length > 0 && (
          <ul className="new-consultation-modal__results">
            {results.map((patient) => (
              <li key={patient.id}>
                <button type="button" onClick={() => onSelectPatient(patient)}>
                  {patient.prenom} {patient.nom}
                  <span className="new-consultation-modal__result-dossier">
                    N° {patient.numero_dossier}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {search.trim() && results.length === 0 && (
        <p className="new-consultation-modal__empty">Aucun patient trouvé.</p>
      )}
    </Modal>
  );
}
