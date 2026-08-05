export const STATUT_INVENTAIRE = {
  en_cours: { label: "En cours", tone: "primary" },
  cloture: { label: "Clôturé", tone: "success" },
};

export function getStatutInventaireLabel(statut) {
  return STATUT_INVENTAIRE[statut]?.label ?? statut;
}

export function getStatutInventaireTone(statut) {
  return STATUT_INVENTAIRE[statut]?.tone ?? "neutral";
}
