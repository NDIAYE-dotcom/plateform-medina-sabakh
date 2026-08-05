import { Badge, Modal, QrCode } from "../../components/ui";
import { PrintLetterheadFooter, PrintLetterheadHeader } from "../../components/print/PosteLetterhead";
import { getStatutLabel, getStatutTone } from "../../constants/tickets";

function formatHeure(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TicketPrintModal({ open, onClose, ticket, posteSlug, poste }) {
  if (!ticket) return null;

  const qrValue = `${posteSlug}-${ticket.numero}-${ticket.date_ticket.replaceAll("-", "")}`;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Ticket"
      footer={
        <div className="print-modal-footer">
          <p className="print-modal-footer__hint">
            Dans la fenêtre d'impression, choisissez « Enregistrer au format PDF » comme
            destination pour l'enregistrer sur votre appareil.
          </p>
          <button type="button" className="ticket-print-modal__print-btn" onClick={() => window.print()}>
            Imprimer / Enregistrer en PDF
          </button>
        </div>
      }
    >
      <div className="ticket-print">
        <PrintLetterheadHeader poste={poste} />

        <div className="ticket-print__stub">
          <p className="ticket-print__label">Ticket n°</p>
          <p className="ticket-print__numero">{ticket.numero}</p>
        </div>

        <div className="ticket-print__qr">
          <QrCode value={qrValue} size={140} />
        </div>

        <div className="ticket-print__details">
          <div className="ticket-print__detail-row">
            <span className="ticket-print__detail-label">Patient</span>
            <span className="ticket-print__detail-value">{ticket.nom_visiteur}</span>
          </div>
          {ticket.motif && (
            <div className="ticket-print__detail-row">
              <span className="ticket-print__detail-label">Motif</span>
              <span className="ticket-print__detail-value">{ticket.motif}</span>
            </div>
          )}
          <div className="ticket-print__detail-row">
            <span className="ticket-print__detail-label">Montant</span>
            <span className="ticket-print__detail-value">
              {(ticket.montant ?? 0).toLocaleString("fr-FR")} FCFA
            </span>
          </div>
          <div className="ticket-print__detail-row">
            <span className="ticket-print__detail-label">Date</span>
            <span className="ticket-print__detail-value">{formatHeure(ticket.created_at)}</span>
          </div>
        </div>

        <Badge tone={getStatutTone(ticket.statut)}>{getStatutLabel(ticket.statut)}</Badge>

        <PrintLetterheadFooter poste={poste} />
      </div>
    </Modal>
  );
}
