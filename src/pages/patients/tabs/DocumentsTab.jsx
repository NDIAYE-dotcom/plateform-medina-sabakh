import { useState } from "react";
import { Button } from "../../../components/ui";
import { formatDateTime } from "../../../constants/patients";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { supabase } from "../../../lib/supabaseClient";

function formatSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export default function DocumentsTab({ patientId, posteId, documents, onChange }) {
  const { user } = useAuth();
  const toast = useToast();
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploading(true);
    const path = `${posteId}/${patientId}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("patient-documents").upload(path, file);

    if (uploadError) {
      setUploading(false);
      toast.error("Échec de l'envoi du fichier.");
      return;
    }

    const { error: insertError } = await supabase.from("patient_documents").insert({
      patient_id: patientId,
      poste_id: posteId,
      nom_fichier: file.name,
      chemin_storage: path,
      type_document: file.type,
      taille_octets: file.size,
      uploaded_by: user?.id,
    });

    setUploading(false);

    if (insertError) {
      toast.error("Fichier envoyé mais impossible d'enregistrer la référence.");
      return;
    }

    toast.success("Document ajouté.");
    onChange();
  };

  const handleDownload = async (doc) => {
    const { data, error } = await supabase.storage
      .from("patient-documents")
      .createSignedUrl(doc.chemin_storage, 60);

    if (error || !data) {
      toast.error("Impossible d'ouvrir ce document.");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const handleDelete = async (doc) => {
    const { error: storageError } = await supabase.storage
      .from("patient-documents")
      .remove([doc.chemin_storage]);

    if (storageError) {
      toast.error("Impossible de supprimer le fichier.");
      return;
    }

    await supabase.from("patient_documents").delete().eq("id", doc.id);
    toast.success("Document supprimé.");
    onChange();
  };

  return (
    <div className="patient-tab">
      <div className="patient-tab__upload">
        <input
          type="file"
          onChange={handleFileChange}
          className="patient-tab__file-input"
          id="patient-document-upload"
        />
        <Button
          as="label"
          htmlFor="patient-document-upload"
          variant="primary"
          className="patient-tab__add-btn"
          loading={uploading}
        >
          Ajouter un document
        </Button>
      </div>

      {documents.length === 0 ? (
        <p className="patient-tab__empty">Aucun document pour le moment.</p>
      ) : (
        <ul className="patient-tab__documents-list">
          {documents.map((doc) => (
            <li key={doc.id} className="patient-tab__document">
              <div>
                <p>{doc.nom_fichier}</p>
                <span className="patient-tab__note-date">
                  {formatDateTime(doc.created_at)} · {formatSize(doc.taille_octets)}
                </span>
              </div>
              <div className="patient-tab__document-actions">
                <Button size="sm" variant="ghost" onClick={() => handleDownload(doc)}>
                  Ouvrir
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(doc)}>
                  Supprimer
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
