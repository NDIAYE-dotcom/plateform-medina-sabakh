import { useEffect, useState } from "react";
import { Badge, Modal, QrCode } from "../../components/ui";
import { PrintLetterheadFooter, PrintLetterheadHeader } from "../../components/print/PosteLetterhead";
import { getStatutLabel, getStatutTone } from "../../constants/tickets";
import "./TicketPrintModal.css";

const FORMAT_STORAGE_KEY = "ucds-ticket-print-format";

function formatDateHeure(value) {
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
  const [format, setFormat] = useState(() => {
    if (typeof window === "undefined") return "standard";
    return window.localStorage.getItem(FORMAT_STORAGE_KEY) === "thermique" ? "thermique" : "standard";
  });

  useEffect(() => {
    window.localStorage.setItem(FORMAT_STORAGE_KEY, format);
  }, [format]);

  if (!ticket) return null;

  const qrValue = `${posteSlug}-${ticket.numero}-${ticket.date_ticket.replaceAll("-", "")}`;
  const isThermal = format === "thermique";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Ticket"
      footer={
        <div className="print-modal-footer">
          <div className="ticket-print-modal__format-toggle" role="tablist" aria-label="Format d'impression">
            <button
              type="button"
              role="tab"
              aria-selected={!isThermal}
              className={`ticket-print-modal__format-btn ${!isThermal ? "ticket-print-modal__format-btn--active" : ""}`}
              onClick={() => setFormat("standard")}
            >
              Format standard
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={isThermal}
              className={`ticket-print-modal__format-btn ${isThermal ? "ticket-print-modal__format-btn--active" : ""}`}
              onClick={() => setFormat("thermique")}
            >
              Imprimante thermique
            </button>
          </div>
          <p className="print-modal-footer__hint">
            {isThermal
              ? "Reçu 80 mm, adapté aux imprimantes de tickets de caisse."
              : "Dans la fenêtre d'impression, choisissez « Enregistrer au format PDF » comme destination pour l'enregistrer sur votre appareil."}
          </p>
          <button type="button" className="ticket-print-modal__print-btn" onClick={() => window.print()}>
            Imprimer / Enregistrer en PDF
          </button>
        </div>
      }
    >
      {isThermal ? (
        <div className="ticket-print--thermal">
          <p className="ticket-print__thermal-poste">{poste?.nom}</p>
          {poste?.telephone && <p className="ticket-print__thermal-tel">Tél : {poste.telephone}</p>}

          <div className="ticket-print__thermal-divider" />

          <p className="ticket-print__thermal-label">Ticket de file d'attente n°</p>
          <p className="ticket-print__thermal-numero">{ticket.numero}</p>

          <div className="ticket-print__thermal-divider" />

          <div className="ticket-print__thermal-lines">
            <div className="ticket-print__thermal-line">
              <span>Patient</span>
              <span>{ticket.nom_visiteur}</span>
            </div>
            {ticket.motif && (
              <div className="ticket-print__thermal-line">
                <span>Motif</span>
                <span>{ticket.motif}</span>
              </div>
            )}
            <div className="ticket-print__thermal-line">
              <span>Montant</span>
              <span>{(ticket.montant ?? 0).toLocaleString("fr-FR")} FCFA</span>
            </div>
            <div className="ticket-print__thermal-line">
              <span>Date</span>
              <span>{formatDateHeure(ticket.created_at)}</span>
            </div>
          </div>

          <div className="ticket-print__thermal-divider" />

          <div className="ticket-print__thermal-qr">
            <QrCode value={qrValue} size={120} color="#000000" background="#FFFFFF" />
          </div>

          <p className="ticket-print__thermal-footer">Merci de conserver ce ticket</p>
        </div>
      ) : (
        <div className="ticket-print--standard">
          <PrintLetterheadHeader poste={poste} />

          <div className="ticket-print__stub">
            <p className="ticket-print__label">Ticket n°</p>
            <p className="ticket-print__numero">{ticket.numero}</p>
            <Badge tone={getStatutTone(ticket.statut)}>{getStatutLabel(ticket.statut)}</Badge>
          </div>

          <div className="ticket-print__qr-card">
            <QrCode value={qrValue} size={140} />
            <span className="ticket-print__qr-caption">Scan pour vérifier ce ticket</span>
          </div>

          <div className="ticket-print__details">
            <div className="ticket-print__detail-row">
              <span className="ticket-print__detail-label">Patient</span>
              <span className="ticket-print__detail-value">{ticket.nom_visiteur}</span>
            </div>
            {ticket.motif && (
              <div className="ticket-print__detail-row ticket-print__detail-row--alt">
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
            <div className="ticket-print__detail-row ticket-print__detail-row--alt">
              <span className="ticket-print__detail-label">Date</span>
              <span className="ticket-print__detail-value">{formatDateHeure(ticket.created_at)}</span>
            </div>
          </div>

          <PrintLetterheadFooter poste={poste} />
        </div>
      )}
    </Modal>
  );
}
