import { useState } from "react";
import { Button, Input, Select, Table, Textarea } from "../../../components/ui";
import { TYPE_VISITE_OPTIONS, formatDateTime } from "../../../constants/patients";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { supabase } from "../../../lib/supabaseClient";

export default function VisitesTab({ patientId, posteId, visites, onChange }) {
  const { user } = useAuth();
  const toast = useToast();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date_visite: "", type_visite: "autre", motif: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);

  const updateField = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    const { error } = await supabase.from("patient_visites").insert({
      patient_id: patientId,
      poste_id: posteId,
      date_visite: form.date_visite ? new Date(form.date_visite).toISOString() : new Date().toISOString(),
      type_visite: form.type_visite,
      motif: form.motif,
      notes: form.notes,
      created_by: user?.id,
    });
    setSubmitting(false);

    if (error) {
      toast.error("Impossible d'ajouter la visite.");
      return;
    }

    setForm({ date_visite: "", type_visite: "autre", motif: "", notes: "" });
    setShowForm(false);
    toast.success("Visite enregistrée.");
    onChange();
  };

  return (
    <div className="patient-tab">
      {showForm ? (
        <form className="patient-tab__form-block" onSubmit={handleSubmit}>
          <div className="patient-tab__inline-form">
            <Input
              label="Date de la visite"
              type="datetime-local"
              value={form.date_visite}
              onChange={updateField("date_visite")}
            />
            <Select
              label="Type"
              options={TYPE_VISITE_OPTIONS}
              value={form.type_visite}
              onChange={updateField("type_visite")}
            />
            <Input label="Motif" value={form.motif} onChange={updateField("motif")} />
          </div>
          <Textarea label="Notes" rows={2} value={form.notes} onChange={updateField("notes")} />
          <div className="patient-tab__form-actions">
            <Button type="submit" loading={submitting}>
              Ajouter la visite
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
              Annuler
            </Button>
          </div>
        </form>
      ) : (
        <Button variant="primary" className="patient-tab__add-btn" onClick={() => setShowForm(true)}>
          Ajouter une visite
        </Button>
      )}

      <Table
        columns={[
          { key: "date_visite", header: "Date", render: (row) => formatDateTime(row.date_visite) },
          { key: "type_visite", header: "Type" },
          { key: "motif", header: "Motif", render: (row) => row.motif || "—" },
        ]}
        rows={visites}
        emptyMessage="Aucune visite enregistrée."
      />
    </div>
  );
}
