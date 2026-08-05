import { useState } from "react";
import { Badge, Button, Input, Textarea } from "../../../components/ui";
import { formatDateTime } from "../../../constants/patients";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { supabase } from "../../../lib/supabaseClient";

const EMPTY_FORM = {
  motif: "",
  examen_clinique: "",
  diagnostic: "",
  traitement: "",
  poids_kg: "",
  temperature_c: "",
  tension_arterielle: "",
};

export default function ConsultationsTab({ patientId, posteId, consultations, onChange }) {
  const { user } = useAuth();
  const toast = useToast();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const updateField = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    const { error } = await supabase.from("consultations").insert({
      patient_id: patientId,
      poste_id: posteId,
      motif: form.motif || null,
      examen_clinique: form.examen_clinique || null,
      diagnostic: form.diagnostic || null,
      traitement: form.traitement || null,
      poids_kg: form.poids_kg ? Number(form.poids_kg) : null,
      temperature_c: form.temperature_c ? Number(form.temperature_c) : null,
      tension_arterielle: form.tension_arterielle || null,
      medecin_id: user?.id,
    });
    setSubmitting(false);

    if (error) {
      toast.error("Impossible d'enregistrer la consultation.");
      return;
    }

    setForm(EMPTY_FORM);
    setShowForm(false);
    toast.success("Consultation enregistrée.");
    onChange();
  };

  return (
    <div className="patient-tab">
      {showForm ? (
        <form className="patient-tab__form-block" onSubmit={handleSubmit}>
          <Input label="Motif" value={form.motif} onChange={updateField("motif")} />
          <div className="patient-tab__inline-form">
            <Input
              label="Poids (kg)"
              type="number"
              step="0.1"
              value={form.poids_kg}
              onChange={updateField("poids_kg")}
            />
            <Input
              label="Température (°C)"
              type="number"
              step="0.1"
              value={form.temperature_c}
              onChange={updateField("temperature_c")}
            />
            <Input
              label="Tension artérielle"
              placeholder="Ex. 12/8"
              value={form.tension_arterielle}
              onChange={updateField("tension_arterielle")}
            />
          </div>
          <Textarea
            label="Examen clinique"
            rows={2}
            value={form.examen_clinique}
            onChange={updateField("examen_clinique")}
          />
          <Textarea
            label="Diagnostic"
            rows={2}
            value={form.diagnostic}
            onChange={updateField("diagnostic")}
          />
          <Textarea
            label="Traitement"
            rows={2}
            value={form.traitement}
            onChange={updateField("traitement")}
          />
          <div className="patient-tab__form-actions">
            <Button type="submit" loading={submitting}>
              Enregistrer la consultation
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
              Annuler
            </Button>
          </div>
        </form>
      ) : (
        <Button variant="primary" className="patient-tab__add-btn" onClick={() => setShowForm(true)}>
          Ajouter une consultation
        </Button>
      )}

      {consultations.length === 0 ? (
        <p className="patient-tab__empty">Aucune consultation enregistrée.</p>
      ) : (
        <ul className="patient-tab__card-list">
          {consultations.map((consultation) => (
            <ConsultationCard
              key={consultation.id}
              consultation={consultation}
              patientId={patientId}
              posteId={posteId}
              onChange={onChange}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function ConsultationCard({ consultation, patientId, posteId, onChange }) {
  const toast = useToast();
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
  const [line, setLine] = useState({ medicament: "", posologie: "", duree: "" });
  const [submitting, setSubmitting] = useState(false);

  const updateField = (field) => (event) =>
    setLine((current) => ({ ...current, [field]: event.target.value }));

  const handleAddLine = async (event) => {
    event.preventDefault();
    if (!line.medicament.trim()) {
      toast.error("Le nom du médicament est obligatoire.");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("consultation_prescriptions").insert({
      consultation_id: consultation.id,
      patient_id: patientId,
      poste_id: posteId,
      medicament: line.medicament,
      posologie: line.posologie || null,
      duree: line.duree || null,
    });
    setSubmitting(false);

    if (error) {
      toast.error("Impossible d'ajouter le médicament.");
      return;
    }

    setLine({ medicament: "", posologie: "", duree: "" });
    setShowPrescriptionForm(false);
    toast.success("Médicament ajouté à l'ordonnance.");
    onChange();
  };

  const hasVitals = consultation.poids_kg || consultation.temperature_c || consultation.tension_arterielle;

  return (
    <li className="patient-tab__card">
      <div className="patient-tab__card-header">
        <span className="patient-tab__card-date">{formatDateTime(consultation.date_consultation)}</span>
        {consultation.motif && <Badge tone="primary">{consultation.motif}</Badge>}
      </div>

      {hasVitals && (
        <div className="consultation-card__vitals">
          {consultation.poids_kg && (
            <div className="consultation-card__vital">
              <span className="consultation-card__vital-label">Poids</span>
              <span className="consultation-card__vital-value">{consultation.poids_kg} kg</span>
            </div>
          )}
          {consultation.temperature_c && (
            <div className="consultation-card__vital">
              <span className="consultation-card__vital-label">Température</span>
              <span className="consultation-card__vital-value">{consultation.temperature_c} °C</span>
            </div>
          )}
          {consultation.tension_arterielle && (
            <div className="consultation-card__vital">
              <span className="consultation-card__vital-label">Tension</span>
              <span className="consultation-card__vital-value">{consultation.tension_arterielle}</span>
            </div>
          )}
        </div>
      )}

      {(consultation.examen_clinique || consultation.diagnostic || consultation.traitement) && (
        <div className="patient-tab__fields-grid">
          {consultation.examen_clinique && (
            <div className="patient-tab__field">
              <span className="patient-tab__field-label">Examen clinique</span>
              <span className="patient-tab__field-value">{consultation.examen_clinique}</span>
            </div>
          )}
          {consultation.diagnostic && (
            <div className="patient-tab__field">
              <span className="patient-tab__field-label">Diagnostic</span>
              <span className="patient-tab__field-value">{consultation.diagnostic}</span>
            </div>
          )}
          {consultation.traitement && (
            <div className="patient-tab__field">
              <span className="patient-tab__field-label">Traitement</span>
              <span className="patient-tab__field-value">{consultation.traitement}</span>
            </div>
          )}
        </div>
      )}

      {consultation.prescriptions.length > 0 && (
        <div>
          <span className="patient-tab__field-label">Ordonnance</span>
          <ul className="patient-tab__highlight-list">
            {consultation.prescriptions.map((p) => (
              <li key={p.id} className="patient-tab__highlight-item">
                <span className="patient-tab__highlight-title">{p.medicament}</span>
                {(p.posologie || p.duree) && (
                  <span className="patient-tab__highlight-detail">
                    {[p.posologie, p.duree].filter(Boolean).join(" — ")}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {showPrescriptionForm ? (
        <form className="patient-tab__inline-sub-form" onSubmit={handleAddLine}>
          <Input placeholder="Médicament" value={line.medicament} onChange={updateField("medicament")} />
          <Input placeholder="Posologie" value={line.posologie} onChange={updateField("posologie")} />
          <Input placeholder="Durée" value={line.duree} onChange={updateField("duree")} />
          <div className="patient-tab__form-actions">
            <Button size="sm" type="submit" loading={submitting}>
              Ajouter
            </Button>
            <Button
              size="sm"
              type="button"
              variant="outline"
              onClick={() => setShowPrescriptionForm(false)}
            >
              Annuler
            </Button>
          </div>
        </form>
      ) : (
        <Button
          size="sm"
          variant="primary"
          className="patient-tab__add-btn"
          onClick={() => setShowPrescriptionForm(true)}
        >
          Ajouter un médicament
        </Button>
      )}
    </li>
  );
}
