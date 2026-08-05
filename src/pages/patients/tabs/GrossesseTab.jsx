import { useState } from "react";
import { Badge, Button, Input, Select, Textarea } from "../../../components/ui";
import { formatDate } from "../../../constants/patients";
import {
  BRUITS_COEUR_FOETAL_OPTIONS,
  ISSUE_OPTIONS,
  MODE_ACCOUCHEMENT_OPTIONS,
  getBruitsCoeurFoetalLabel,
  getStatutGrossesseLabel,
  getStatutGrossesseTone,
} from "../../../constants/grossesse";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { supabase } from "../../../lib/supabaseClient";

const EMPTY_FORM = {
  date_dernieres_regles: "",
  gestite: "",
  parite: "",
  risques: "",
  notes: "",
};

const EMPTY_CPN = {
  date_cpn: "",
  poids_kg: "",
  tension_arterielle: "",
  hauteur_uterine_cm: "",
  bruits_coeur_foetal: "",
  observations: "",
};

const EMPTY_ACCOUCHEMENT = {
  date_accouchement: "",
  lieu_accouchement: "",
  mode_accouchement: "",
  issue: "",
  poids_naissance_kg: "",
  complications: "",
};

export default function GrossesseTab({ patientId, posteId, grossesses, onChange }) {
  const { user } = useAuth();
  const toast = useToast();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const updateField = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.date_dernieres_regles) {
      toast.error("La date des dernières règles est obligatoire.");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("grossesses").insert({
      patient_id: patientId,
      poste_id: posteId,
      date_dernieres_regles: form.date_dernieres_regles,
      gestite: form.gestite ? Number(form.gestite) : null,
      parite: form.parite ? Number(form.parite) : null,
      risques: form.risques || null,
      notes: form.notes || null,
      medecin_id: user?.id,
    });
    setSubmitting(false);

    if (error) {
      toast.error("Impossible d'enregistrer la grossesse.");
      return;
    }

    setForm(EMPTY_FORM);
    setShowForm(false);
    toast.success("Grossesse enregistrée.");
    onChange();
  };

  return (
    <div className="patient-tab">
      {showForm ? (
        <form className="patient-tab__form-block" onSubmit={handleSubmit}>
          <Input
            label="Date des dernières règles (DDR)"
            type="date"
            value={form.date_dernieres_regles}
            onChange={updateField("date_dernieres_regles")}
          />
          <div className="patient-tab__inline-form">
            <Input
              label="Gestité"
              type="number"
              min="0"
              value={form.gestite}
              onChange={updateField("gestite")}
            />
            <Input
              label="Parité"
              type="number"
              min="0"
              value={form.parite}
              onChange={updateField("parite")}
            />
          </div>
          <Textarea
            label="Facteurs de risque"
            rows={2}
            value={form.risques}
            onChange={updateField("risques")}
          />
          <Textarea label="Notes" rows={2} value={form.notes} onChange={updateField("notes")} />
          <div className="patient-tab__form-actions">
            <Button type="submit" loading={submitting}>
              Enregistrer la grossesse
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
              Annuler
            </Button>
          </div>
        </form>
      ) : (
        <Button variant="primary" className="patient-tab__add-btn" onClick={() => setShowForm(true)}>
          Ajouter une grossesse
        </Button>
      )}

      {grossesses.length === 0 ? (
        <p className="patient-tab__empty">Aucune grossesse enregistrée.</p>
      ) : (
        <ul className="patient-tab__card-list">
          {grossesses.map((grossesse) => (
            <GrossesseCard
              key={grossesse.id}
              grossesse={grossesse}
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

function GrossesseCard({ grossesse, patientId, posteId, onChange }) {
  const toast = useToast();
  const [showCpnForm, setShowCpnForm] = useState(false);
  const [cpn, setCpn] = useState(EMPTY_CPN);
  const [submittingCpn, setSubmittingCpn] = useState(false);

  const [showAccouchementForm, setShowAccouchementForm] = useState(false);
  const [accouchement, setAccouchement] = useState(EMPTY_ACCOUCHEMENT);
  const [submittingAccouchement, setSubmittingAccouchement] = useState(false);

  const updateCpnField = (field) => (event) =>
    setCpn((current) => ({ ...current, [field]: event.target.value }));

  const updateAccouchementField = (field) => (event) =>
    setAccouchement((current) => ({ ...current, [field]: event.target.value }));

  const handleAddCpn = async (event) => {
    event.preventDefault();
    setSubmittingCpn(true);
    const { error } = await supabase.from("consultations_prenatales").insert({
      grossesse_id: grossesse.id,
      patient_id: patientId,
      poste_id: posteId,
      date_cpn: cpn.date_cpn || new Date().toISOString().slice(0, 10),
      poids_kg: cpn.poids_kg ? Number(cpn.poids_kg) : null,
      tension_arterielle: cpn.tension_arterielle || null,
      hauteur_uterine_cm: cpn.hauteur_uterine_cm ? Number(cpn.hauteur_uterine_cm) : null,
      bruits_coeur_foetal: cpn.bruits_coeur_foetal || null,
      observations: cpn.observations || null,
    });
    setSubmittingCpn(false);

    if (error) {
      toast.error("Impossible d'ajouter la CPN.");
      return;
    }

    setCpn(EMPTY_CPN);
    setShowCpnForm(false);
    toast.success("Consultation prénatale ajoutée.");
    onChange();
  };

  const handleAccouchement = async (event) => {
    event.preventDefault();
    if (!accouchement.date_accouchement) {
      toast.error("La date de l'accouchement est obligatoire.");
      return;
    }

    setSubmittingAccouchement(true);
    const { error } = await supabase
      .from("grossesses")
      .update({
        statut: "accouchee",
        date_accouchement: accouchement.date_accouchement,
        lieu_accouchement: accouchement.lieu_accouchement || null,
        mode_accouchement: accouchement.mode_accouchement || null,
        issue: accouchement.issue || null,
        poids_naissance_kg: accouchement.poids_naissance_kg
          ? Number(accouchement.poids_naissance_kg)
          : null,
        complications: accouchement.complications || null,
      })
      .eq("id", grossesse.id);
    setSubmittingAccouchement(false);

    if (error) {
      toast.error("Impossible d'enregistrer l'accouchement.");
      return;
    }

    setShowAccouchementForm(false);
    toast.success("Accouchement enregistré.");
    onChange();
  };

  return (
    <li className="patient-tab__card">
      <div className="patient-tab__card-header">
        <span className="patient-tab__card-date">DPA : {formatDate(grossesse.date_prevue_accouchement)}</span>
        <Badge tone={getStatutGrossesseTone(grossesse.statut)}>
          {getStatutGrossesseLabel(grossesse.statut)}
        </Badge>
      </div>

      <div className="patient-tab__fields-grid">
        <div className="patient-tab__field">
          <span className="patient-tab__field-label">Dernières règles</span>
          <span className="patient-tab__field-value">{formatDate(grossesse.date_dernieres_regles)}</span>
        </div>
        {grossesse.gestite != null && (
          <div className="patient-tab__field">
            <span className="patient-tab__field-label">Gestité</span>
            <span className="patient-tab__field-value">{grossesse.gestite}</span>
          </div>
        )}
        {grossesse.parite != null && (
          <div className="patient-tab__field">
            <span className="patient-tab__field-label">Parité</span>
            <span className="patient-tab__field-value">{grossesse.parite}</span>
          </div>
        )}
        {grossesse.risques && (
          <div className="patient-tab__field">
            <span className="patient-tab__field-label">Facteurs de risque</span>
            <span className="patient-tab__field-value">{grossesse.risques}</span>
          </div>
        )}
      </div>

      {grossesse.statut === "accouchee" && (
        <div className="patient-tab__fields-grid">
          <div className="patient-tab__field">
            <span className="patient-tab__field-label">Accouchement</span>
            <span className="patient-tab__field-value">{formatDate(grossesse.date_accouchement)}</span>
          </div>
          {grossesse.lieu_accouchement && (
            <div className="patient-tab__field">
              <span className="patient-tab__field-label">Lieu</span>
              <span className="patient-tab__field-value">{grossesse.lieu_accouchement}</span>
            </div>
          )}
          {grossesse.mode_accouchement && (
            <div className="patient-tab__field">
              <span className="patient-tab__field-label">Mode</span>
              <span className="patient-tab__field-value">
                {MODE_ACCOUCHEMENT_OPTIONS.find((o) => o.value === grossesse.mode_accouchement)?.label}
              </span>
            </div>
          )}
          {grossesse.issue && (
            <div className="patient-tab__field">
              <span className="patient-tab__field-label">Issue</span>
              <span className="patient-tab__field-value">
                {ISSUE_OPTIONS.find((o) => o.value === grossesse.issue)?.label}
              </span>
            </div>
          )}
          {grossesse.poids_naissance_kg && (
            <div className="patient-tab__field">
              <span className="patient-tab__field-label">Poids de naissance</span>
              <span className="patient-tab__field-value">{grossesse.poids_naissance_kg} kg</span>
            </div>
          )}
        </div>
      )}

      {grossesse.cpns.length > 0 && (
        <div>
          <span className="patient-tab__field-label">Consultations prénatales</span>
          <ul className="patient-tab__highlight-list">
            {grossesse.cpns.map((c) => (
              <li key={c.id} className="patient-tab__highlight-item">
                <span className="patient-tab__highlight-title">
                  CPN {c.numero} — {formatDate(c.date_cpn)}
                </span>
                <span className="patient-tab__highlight-detail">
                  {[
                    c.poids_kg && `${c.poids_kg} kg`,
                    c.tension_arterielle,
                    c.hauteur_uterine_cm && `HU ${c.hauteur_uterine_cm} cm`,
                    getBruitsCoeurFoetalLabel(c.bruits_coeur_foetal),
                  ]
                    .filter(Boolean)
                    .join(" — ")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showCpnForm ? (
        <form className="patient-tab__inline-sub-form" onSubmit={handleAddCpn}>
          <Input label="Date" type="date" value={cpn.date_cpn} onChange={updateCpnField("date_cpn")} />
          <Input
            label="Poids (kg)"
            type="number"
            step="0.1"
            value={cpn.poids_kg}
            onChange={updateCpnField("poids_kg")}
          />
          <Input
            label="Tension"
            placeholder="Ex. 12/8"
            value={cpn.tension_arterielle}
            onChange={updateCpnField("tension_arterielle")}
          />
          <Input
            label="Hauteur utérine (cm)"
            type="number"
            step="0.1"
            value={cpn.hauteur_uterine_cm}
            onChange={updateCpnField("hauteur_uterine_cm")}
          />
          <Select
            label="Bruits du cœur fœtal"
            options={BRUITS_COEUR_FOETAL_OPTIONS}
            value={cpn.bruits_coeur_foetal}
            onChange={updateCpnField("bruits_coeur_foetal")}
          />
          <div className="patient-tab__form-actions">
            <Button size="sm" type="submit" loading={submittingCpn}>
              Ajouter
            </Button>
            <Button size="sm" type="button" variant="outline" onClick={() => setShowCpnForm(false)}>
              Annuler
            </Button>
          </div>
        </form>
      ) : (
        <Button
          size="sm"
          variant="primary"
          className="patient-tab__add-btn"
          onClick={() => setShowCpnForm(true)}
        >
          Ajouter une CPN
        </Button>
      )}

      {grossesse.statut === "en_cours" &&
        (showAccouchementForm ? (
          <form className="patient-tab__form-block" onSubmit={handleAccouchement}>
            <div className="patient-tab__inline-form">
              <Input
                label="Date de l'accouchement"
                type="date"
                value={accouchement.date_accouchement}
                onChange={updateAccouchementField("date_accouchement")}
              />
              <Input
                label="Lieu"
                value={accouchement.lieu_accouchement}
                onChange={updateAccouchementField("lieu_accouchement")}
              />
              <Input
                label="Poids de naissance (kg)"
                type="number"
                step="0.01"
                value={accouchement.poids_naissance_kg}
                onChange={updateAccouchementField("poids_naissance_kg")}
              />
              <Select
                label="Mode"
                options={MODE_ACCOUCHEMENT_OPTIONS}
                value={accouchement.mode_accouchement}
                onChange={updateAccouchementField("mode_accouchement")}
              />
              <Select
                label="Issue"
                options={ISSUE_OPTIONS}
                value={accouchement.issue}
                onChange={updateAccouchementField("issue")}
              />
            </div>
            <Textarea
              label="Complications"
              rows={2}
              value={accouchement.complications}
              onChange={updateAccouchementField("complications")}
            />
            <div className="patient-tab__form-actions">
              <Button size="sm" type="submit" loading={submittingAccouchement}>
                Enregistrer l'accouchement
              </Button>
              <Button
                size="sm"
                type="button"
                variant="outline"
                onClick={() => setShowAccouchementForm(false)}
              >
                Annuler
              </Button>
            </div>
          </form>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setShowAccouchementForm(true)}>
            Enregistrer l'accouchement
          </Button>
        ))}
    </li>
  );
}
