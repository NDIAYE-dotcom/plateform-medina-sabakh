import { Modal } from "../../components/ui";
import { PrintLetterheadFooter, PrintLetterheadHeader } from "../../components/print/PosteLetterhead";
import { formatFcfa } from "../../constants/comptabilite";
import { formatDate } from "../../constants/patients";

export default function RapportPrintModal({ open, onClose, poste, dateDebut, dateFin, rapport }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Rapport"
      size="lg"
      footer={
        <div className="print-modal-footer">
          <p className="print-modal-footer__hint">
            Dans la fenêtre d'impression, choisissez « Enregistrer au format PDF » comme
            destination pour l'enregistrer sur votre appareil.
          </p>
          <button type="button" className="rapport-print-modal__print-btn" onClick={() => window.print()}>
            Imprimer / Enregistrer en PDF
          </button>
        </div>
      }
    >
      <div className="rapport-print">
        <PrintLetterheadHeader poste={poste} />
        <p className="rapport-print__periode">
          Du {formatDate(dateDebut)} au {formatDate(dateFin)}
        </p>

        <div className="rapport-print__section">
          <p className="rapport-print__section-title">Activité</p>
          <div className="rapport-print__line">
            <span>Nouveaux patients</span>
            <span>{rapport.nouveauxPatients}</span>
          </div>
          <div className="rapport-print__line">
            <span>Tickets émis</span>
            <span>{rapport.ticketsTotal}</span>
          </div>
          <div className="rapport-print__line">
            <span>Consultations</span>
            <span>{rapport.consultationsTotal}</span>
          </div>
          <div className="rapport-print__line">
            <span>CPN réalisées</span>
            <span>{rapport.cpnTotal}</span>
          </div>
          <div className="rapport-print__line">
            <span>Accouchements</span>
            <span>{rapport.accouchementsTotal}</span>
          </div>
        </div>

        <div className="rapport-print__section">
          <p className="rapport-print__section-title">Tickets par statut</p>
          {rapport.ticketsParStatut.map((item) => (
            <div className="rapport-print__line" key={item.label}>
              <span>{item.label}</span>
              <span>{item.value}</span>
            </div>
          ))}
        </div>

        <div className="rapport-print__section">
          <p className="rapport-print__section-title">Finances</p>
          <div className="rapport-print__line">
            <span>Recettes tickets</span>
            <span>{formatFcfa(rapport.recettesTickets)}</span>
          </div>
          <div className="rapport-print__line">
            <span>Ventes pharmacie</span>
            <span>{formatFcfa(rapport.ventesPharmacie)}</span>
          </div>
          <div className="rapport-print__line rapport-print__line--total">
            <span>Total recettes</span>
            <span>{formatFcfa(rapport.totalRecettes)}</span>
          </div>
          <div className="rapport-print__line">
            <span>Dépenses</span>
            <span>{formatFcfa(rapport.totalDepenses)}</span>
          </div>
          <div
            className={`rapport-print__line rapport-print__line--total ${
              rapport.solde < 0 ? "rapport-print__line--negative" : ""
            }`}
          >
            <span>Solde</span>
            <span>{formatFcfa(rapport.solde)}</span>
          </div>
        </div>

        <div className="rapport-print__section">
          <p className="rapport-print__section-title">Personnel par rôle</p>
          {rapport.personnelParRole.length === 0 ? (
            <p className="rapport-print__empty">Aucun membre du personnel assigné.</p>
          ) : (
            rapport.personnelParRole.map((item) => (
              <div className="rapport-print__line" key={item.label}>
                <span>{item.label}</span>
                <span>{item.value}</span>
              </div>
            ))
          )}
        </div>

        <div className="rapport-print__section">
          <p className="rapport-print__section-title">Alertes stock</p>
          {rapport.articlesEnRupture.length === 0 ? (
            <p className="rapport-print__empty">Aucun article sous le seuil d'alerte.</p>
          ) : (
            rapport.articlesEnRupture.map((article) => (
              <div className="rapport-print__line" key={article.nom}>
                <span>{article.nom}</span>
                <span>
                  {article.stock_actuel} {article.unite || ""}
                </span>
              </div>
            ))
          )}
        </div>

        <PrintLetterheadFooter poste={poste} />
      </div>
    </Modal>
  );
}
