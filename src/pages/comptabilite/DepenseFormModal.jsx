import { useEffect, useState } from "react";
import { Button, Input, Modal, Select, Textarea } from "../../components/ui";
import { CATEGORIE_DEPENSE_OPTIONS } from "../../constants/comptabilite";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { supabase } from "../../lib/supabaseClient";
import "./comptabilite-shared.css";

const emptyForm = () => ({
  date_depense: new Date().toISOString().slice(0, 10),
  categorie: "autre",
  libelle: "",
  montant: "",
  notes: "",
});

export default function DepenseFormModal({ open, onClose, posteId, onCreated }) {
  const { user } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) setForm(emptyForm());
  }, [open]);

  const updateField = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    const montantNumber = Number(form.montant);
    if (!form.libelle.trim()) {
      toast.error("Le libellé est obligatoire.");
      return;
    }
    if (!Number.isInteger(montantNumber) || montantNumber <= 0) {
      toast.error("Le montant doit être un nombre entier positif.");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("depenses").insert({
      poste_id: posteId,
      date_depense: form.date_depense,
      categorie: form.categorie,
      libelle: form.libelle,
      montant: montantNumber,
      notes: form.notes || null,
      created_by: user?.id,
    });
    setSubmitting(false);

    if (error) {
      toast.error("Impossible d'enregistrer la dépense.");
      return;
    }

    toast.success("Dépense enregistrée.");
    onCreated();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Nouvelle dépense">
      <form className="comptabilite-modal__form" onSubmit={handleSubmit}>
        <Input
          label="Date"
          type="date"
          value={form.date_depense}
          onChange={updateField("date_depense")}
        />
        <Select
          label="Catégorie"
          options={CATEGORIE_DEPENSE_OPTIONS}
          value={form.categorie}
          onChange={updateField("categorie")}
        />
        <Input label="Libellé" value={form.libelle} onChange={updateField("libelle")} autoFocus />
        <Input
          label="Montant (FCFA)"
          type="number"
          min="1"
          value={form.montant}
          onChange={updateField("montant")}
        />
        <Textarea label="Notes" rows={2} value={form.notes} onChange={updateField("notes")} />
        <Button type="submit" loading={submitting}>
          Enregistrer la dépense
        </Button>
      </form>
    </Modal>
  );
}
