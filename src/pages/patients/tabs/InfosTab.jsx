import { formatDate } from "../../../constants/patients";

function Field({ label, value }) {
  return (
    <div className="patient-tab__field">
      <span className="patient-tab__field-label">{label}</span>
      <span className="patient-tab__field-value">{value || "—"}</span>
    </div>
  );
}

export default function InfosTab({ patient }) {
  return (
    <div className="patient-tab">
      <div className="patient-tab__card">
        <div className="patient-tab__fields-grid">
          <Field label="Date de naissance" value={formatDate(patient.date_naissance)} />
          <Field
            label="Sexe"
            value={patient.sexe === "M" ? "Masculin" : patient.sexe === "F" ? "Féminin" : null}
          />
          <Field label="Téléphone" value={patient.telephone} />
          <Field label="Groupe sanguin" value={patient.groupe_sanguin} />
          <Field label="Adresse" value={patient.adresse} />
          <Field label="Personne à contacter" value={patient.personne_contact} />
          <Field label="Téléphone du contact" value={patient.telephone_contact} />
          <Field label="Dossier créé le" value={formatDate(patient.created_at)} />
        </div>
        <Field label="Allergies connues" value={patient.allergies} />
      </div>
    </div>
  );
}
