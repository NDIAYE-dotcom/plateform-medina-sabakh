import { useState } from "react";
import { Badge, Button, Input, Table } from "../../../components/ui";
import { formatDate } from "../../../constants/patients";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { supabase } from "../../../lib/supabaseClient";

export default function VaccinsTab({ patientId, posteId, vaccinations, onChange }) {
  const { user } = useAuth();
  const toast = useToast();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nom_vaccin: "", date_administration: "", date_rappel: "" });
  const [submitting, setSubmitting] = useState(false);

  const updateField = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.nom_vaccin.trim() || !form.date_administration) {
      toast.error("Le nom du vaccin et la date sont obligatoires.");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("patient_vaccinations").insert({
      patient_id: patientId,
      poste_id: posteId,
      nom_vaccin: form.nom_vaccin,
      date_administration: form.date_administration,
      date_rappel: form.date_rappel || null,
      administre_par: user?.id,
    });
    setSubmitting(false);

    if (error) {
      toast.error("Impossible d'ajouter le vaccin.");
      return;
    }

    setForm({ nom_vaccin: "", date_administration: "", date_rappel: "" });
    setShowForm(false);
    toast.success("Vaccin ajouté.");
    onChange();
  };

  return (
    <div className="patient-tab">
      {showForm ? (
        <form className="patient-tab__inline-form" onSubmit={handleSubmit}>
          <Input
            label="Vaccin"
            placeholder="Ex. BCG"
            value={form.nom_vaccin}
            onChange={updateField("nom_vaccin")}
          />
          <Input
            label="Date d'administration"
            type="date"
            value={form.date_administration}
            onChange={updateField("date_administration")}
          />
          <Input
            label="Date de rappel"
            type="date"
            value={form.date_rappel}
            onChange={updateField("date_rappel")}
          />
          <div className="patient-tab__form-actions">
            <Button type="submit" loading={submitting}>
              Ajouter
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
              Annuler
            </Button>
          </div>
        </form>
      ) : (
        <Button variant="primary" className="patient-tab__add-btn" onClick={() => setShowForm(true)}>
          Ajouter un vaccin
        </Button>
      )}

      <Table
        columns={[
          { key: "nom_vaccin", header: "Vaccin" },
          {
            key: "date_administration",
            header: "Administré le",
            render: (row) => formatDate(row.date_administration),
          },
          {
            key: "date_rappel",
            header: "Rappel",
            render: (row) =>
              row.date_rappel ? formatDate(row.date_rappel) : <Badge tone="neutral">Aucun</Badge>,
          },
        ]}
        rows={vaccinations}
        emptyMessage="Aucun vaccin enregistré."
      />
    </div>
  );
}
