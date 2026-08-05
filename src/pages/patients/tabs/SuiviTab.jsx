import { useState } from "react";
import { Button, Textarea } from "../../../components/ui";
import { formatDateTime } from "../../../constants/patients";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { supabase } from "../../../lib/supabaseClient";

export default function SuiviTab({ patientId, posteId, notes, onChange }) {
  const { user } = useAuth();
  const toast = useToast();
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    const { error } = await supabase.from("patient_notes_suivi").insert({
      patient_id: patientId,
      poste_id: posteId,
      contenu: content,
      created_by: user?.id,
    });
    setSubmitting(false);

    if (error) {
      toast.error("Impossible d'ajouter la note.");
      return;
    }

    setContent("");
    setShowForm(false);
    toast.success("Note ajoutée.");
    onChange();
  };

  return (
    <div className="patient-tab">
      {showForm ? (
        <form className="patient-tab__form-block" onSubmit={handleSubmit}>
          <Textarea
            label="Nouvelle note de suivi"
            rows={3}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Observation, évolution, recommandation..."
          />
          <div className="patient-tab__form-actions">
            <Button type="submit" loading={submitting}>
              Ajouter la note
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
              Annuler
            </Button>
          </div>
        </form>
      ) : (
        <Button variant="primary" className="patient-tab__add-btn" onClick={() => setShowForm(true)}>
          Ajouter la note
        </Button>
      )}

      {notes.length === 0 ? (
        <p className="patient-tab__empty">Aucune note de suivi pour le moment.</p>
      ) : (
        <ul className="patient-tab__card-list">
          {notes.map((note) => (
            <li key={note.id} className="patient-tab__card">
              <div className="patient-tab__card-header">
                <span className="patient-tab__card-date">{formatDateTime(note.created_at)}</span>
              </div>
              <p className="patient-tab__field-value">{note.contenu}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
