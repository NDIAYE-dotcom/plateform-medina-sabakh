import { Modal } from "../../components/ui";
import { PrintLetterheadFooter, PrintLetterheadHeader } from "../../components/print/PosteLetterhead";
import { formatDate } from "../../constants/patients";

export default function OrdonnancePrintModal({ open, onClose, consultation, patient, poste }) {
  if (!consultation) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Ordonnance"
      size="lg"
      footer={
        <div className="print-modal-footer">
          <p className="print-modal-footer__hint">
            Dans la fenêtre d'impression, choisissez « Enregistrer au format PDF » comme
            destination pour l'enregistrer sur votre appareil.
          </p>
          <button
            type="button"
            className="ordonnance-print-modal__print-btn"
            onClick={() => window.print()}
          >
            Imprimer / Enregistrer en PDF
          </button>
        </div>
      }
    >
      <div className="ordonnance-print">
        <PrintLetterheadHeader poste={poste} />

        <p className="ordonnance-print__title">Ordonnance médicale</p>

        <div className="ordonnance-print__meta">
          <div>
            <p className="ordonnance-print__patient-name">
              {patient?.prenom} {patient?.nom}
            </p>
            <p className="ordonnance-print__patient-dossier">Dossier n° {patient?.numero_dossier}</p>
          </div>
          <p className="ordonnance-print__date">{formatDate(consultation.date_consultation)}</p>
        </div>

        {consultation.diagnostic && (
          <div className="ordonnance-print__diagnostic">
            <span className="ordonnance-print__diagnostic-label">Diagnostic</span>
            <p>{consultation.diagnostic}</p>
          </div>
        )}

        <ol className="ordonnance-print__lines">
          {consultation.prescriptions.map((line, index) => (
            <li key={line.id} className="ordonnance-print__line">
              <span className="ordonnance-print__line-number">{index + 1}</span>
              <div className="ordonnance-print__line-content">
                <p className="ordonnance-print__medicament">{line.medicament}</p>
                {(line.posologie || line.duree) && (
                  <p className="ordonnance-print__posologie">
                    {[line.posologie, line.duree].filter(Boolean).join(" — ")}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>

        <PrintLetterheadFooter poste={poste} />
      </div>
    </Modal>
  );
}
