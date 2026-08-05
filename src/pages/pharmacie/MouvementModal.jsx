import { useEffect, useState } from "react";
import { Button, Input, Modal } from "../../components/ui";
import { SearchIcon } from "../../components/ui/icons";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { supabase } from "../../lib/supabaseClient";
import "./pharmacie-shared.css";

const TITLES = { entree: "Réceptionner", sortie: "Dispenser" };

export default function MouvementModal({ open, onClose, article, type, posteId, onSaved }) {
  const { user } = useAuth();
  const toast = useToast();
  const [quantite, setQuantite] = useState("1");
  const [montant, setMontant] = useState("0");
  const [montantEdited, setMontantEdited] = useState(false);
  const [motif, setMotif] = useState("");
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setQuantite("1");
      setMontant(String(article?.prix_unitaire ?? 0));
      setMontantEdited(false);
      setMotif("");
      setSearch("");
      setResults([]);
      setSelectedPatient(null);
    }
  }, [open, article]);

  const updateQuantite = (event) => {
    const value = event.target.value;
    setQuantite(value);
    if (!montantEdited && article?.prix_unitaire != null) {
      const quantiteNumber = Number(value) || 0;
      setMontant(String(quantiteNumber * article.prix_unitaire));
    }
  };

  useEffect(() => {
    if (type !== "sortie" || !posteId || !search.trim() || selectedPatient) {
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
  }, [search, posteId, selectedPatient, type]);

  if (!article) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    const quantiteNumber = Number(quantite);
    if (!Number.isInteger(quantiteNumber) || quantiteNumber <= 0) {
      toast.error("La quantité doit être un nombre entier positif.");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("mouvements_stock").insert({
      poste_id: posteId,
      article_id: article.id,
      type,
      quantite: quantiteNumber,
      montant: type === "sortie" ? Number(montant) || 0 : null,
      motif: motif || null,
      patient_id: selectedPatient?.id ?? null,
      created_by: user?.id,
    });
    setSubmitting(false);

    if (error) {
      toast.error(error.message.includes("Stock insuffisant") ? error.message : "Impossible d'enregistrer le mouvement.");
      return;
    }

    toast.success(type === "entree" ? "Réception enregistrée." : "Dispensation enregistrée.");
    onSaved();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={`${TITLES[type]} — ${article.nom}`}>
      <form className="pharmacie-modal__form" onSubmit={handleSubmit}>
        <p className="pharmacie-modal__stock-info">
          Stock actuel : <strong>{article.stock_actuel}</strong> {article.unite || ""}
        </p>

        <Input label="Quantité" type="number" min="1" value={quantite} onChange={updateQuantite} autoFocus />

        {type === "sortie" && (
          <Input
            label="Montant encaissé (FCFA)"
            type="number"
            min="0"
            value={montant}
            onChange={(event) => {
              setMontant(event.target.value);
              setMontantEdited(true);
            }}
          />
        )}

        {type === "sortie" && (
          <div className="pharmacie-modal__search-wrap">
            <Input
              label="Patient (facultatif)"
              icon={<SearchIcon />}
              placeholder="Rechercher un patient..."
              value={selectedPatient ? `${selectedPatient.prenom} ${selectedPatient.nom}` : search}
              onChange={(event) => {
                setSelectedPatient(null);
                setSearch(event.target.value);
              }}
            />
            {results.length > 0 && (
              <ul className="pharmacie-modal__results">
                {results.map((patient) => (
                  <li key={patient.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPatient(patient);
                        setResults([]);
                      }}
                    >
                      {patient.prenom} {patient.nom}
                      <span className="pharmacie-modal__result-dossier">N° {patient.numero_dossier}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <Input
          label="Motif"
          placeholder={type === "entree" ? "Ex. Réception livraison" : "Ex. Dispensation ordonnance"}
          value={motif}
          onChange={(event) => setMotif(event.target.value)}
        />

        <Button type="submit" loading={submitting}>
          Confirmer
        </Button>
      </form>
    </Modal>
  );
}
