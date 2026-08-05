import { Modal } from "../../components/ui";
import { formatFcfa, getCategorieDepenseLabel } from "../../constants/comptabilite";
import { formatDate } from "../../constants/patients";

export default function BilanPrintModal({
  open,
  onClose,
  posteName,
  dateDebut,
  dateFin,
  recettesTickets,
  recettesPharmacie,
  totalRecettes,
  depenses,
  totalDepenses,
  solde,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Bilan"
      size="lg"
      footer={
        <div className="print-modal-footer">
          <p className="print-modal-footer__hint">
            Dans la fenêtre d'impression, choisissez « Enregistrer au format PDF » comme
            destination pour l'enregistrer sur votre appareil.
          </p>
          <button
            type="button"
            className="comptabilite-print-modal__print-btn"
            onClick={() => window.print()}
          >
            Imprimer / Enregistrer en PDF
          </button>
        </div>
      }
    >
      <div className="bilan-print">
        <p className="bilan-print__poste">{posteName}</p>
        <p className="bilan-print__periode">
          Du {formatDate(dateDebut)} au {formatDate(dateFin)}
        </p>

        <div className="bilan-print__section">
          <div className="bilan-print__line">
            <span>Recettes tickets</span>
            <span>{formatFcfa(recettesTickets)}</span>
          </div>
          <div className="bilan-print__line">
            <span>Recettes pharmacie</span>
            <span>{formatFcfa(recettesPharmacie)}</span>
          </div>
          <div className="bilan-print__line bilan-print__line--total">
            <span>Total recettes</span>
            <span>{formatFcfa(totalRecettes)}</span>
          </div>
        </div>

        <div className="bilan-print__section">
          <p className="bilan-print__section-title">Dépenses</p>
          {depenses.length === 0 ? (
            <p className="bilan-print__empty">Aucune dépense sur cette période.</p>
          ) : (
            depenses.map((d) => (
              <div key={d.id} className="bilan-print__line">
                <span>
                  {formatDate(d.date_depense)} — {d.libelle} ({getCategorieDepenseLabel(d.categorie)})
                </span>
                <span>{formatFcfa(d.montant)}</span>
              </div>
            ))
          )}
          <div className="bilan-print__line bilan-print__line--total">
            <span>Total dépenses</span>
            <span>{formatFcfa(totalDepenses)}</span>
          </div>
        </div>

        <div className={`bilan-print__solde ${solde < 0 ? "bilan-print__solde--negative" : ""}`}>
          <span>Solde</span>
          <span>{formatFcfa(solde)}</span>
        </div>
      </div>
    </Modal>
  );
}
