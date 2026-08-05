import { useState } from "react";
import { Button } from "../../../components/ui";
import { formatDate } from "../../../constants/patients";
import { useAuth } from "../../../context/AuthContext";
import OrdonnancePrintModal from "../OrdonnancePrintModal";

export default function OrdonnancesTab({ patient, consultations }) {
  const { posteName, posteTelephone, posteNomChef, posteCachetUrl, posteSignatureUrl } = useAuth();
  const poste = {
    nom: posteName,
    telephone: posteTelephone,
    nom_chef: posteNomChef,
    cachet_url: posteCachetUrl,
    signature_url: posteSignatureUrl,
  };
  const [printing, setPrinting] = useState(null);

  const ordonnances = consultations.filter((c) => c.prescriptions.length > 0);

  if (ordonnances.length === 0) {
    return <p className="patient-tab__empty">Aucune ordonnance pour le moment.</p>;
  }

  return (
    <div className="patient-tab">
      <ul className="patient-tab__card-list">
        {ordonnances.map((consultation) => (
          <li key={consultation.id} className="patient-tab__card">
            <div className="patient-tab__card-header">
              <span className="patient-tab__card-date">{formatDate(consultation.date_consultation)}</span>
              {consultation.diagnostic && <span>{consultation.diagnostic}</span>}
            </div>
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
            <Button size="sm" variant="outline" onClick={() => setPrinting(consultation)}>
              Imprimer l'ordonnance
            </Button>
          </li>
        ))}
      </ul>

      <OrdonnancePrintModal
        open={Boolean(printing)}
        onClose={() => setPrinting(null)}
        consultation={printing}
        patient={patient}
        poste={poste}
      />
    </div>
  );
}
