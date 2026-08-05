export const TICKET_STATUTS = {
  en_attente: { label: "En attente", tone: "warning" },
  en_cours: { label: "En cours", tone: "primary" },
  termine: { label: "Terminé", tone: "success" },
  annule: { label: "Annulé", tone: "danger" },
};

export function getStatutLabel(statut) {
  return TICKET_STATUTS[statut]?.label ?? statut;
}

export function getStatutTone(statut) {
  return TICKET_STATUTS[statut]?.tone ?? "neutral";
}
