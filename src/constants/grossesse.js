export const GROSSESSE_STATUTS = {
  en_cours: { label: "En cours", tone: "primary" },
  accouchee: { label: "Accouchée", tone: "success" },
  interrompue: { label: "Interrompue", tone: "danger" },
};

export function getStatutGrossesseLabel(statut) {
  return GROSSESSE_STATUTS[statut]?.label ?? statut;
}

export function getStatutGrossesseTone(statut) {
  return GROSSESSE_STATUTS[statut]?.tone ?? "neutral";
}

export const MODE_ACCOUCHEMENT_OPTIONS = [
  { value: "voie_basse", label: "Voie basse" },
  { value: "cesarienne", label: "Césarienne" },
];

export const ISSUE_OPTIONS = [
  { value: "vivant", label: "Vivant" },
  { value: "mort_ne", label: "Mort-né" },
];

export const BRUITS_COEUR_FOETAL_OPTIONS = [
  { value: "percus", label: "Perçus" },
  { value: "non_percus", label: "Non perçus" },
  { value: "non_recherches", label: "Non recherchés" },
];

export function getBruitsCoeurFoetalLabel(value) {
  return BRUITS_COEUR_FOETAL_OPTIONS.find((o) => o.value === value)?.label ?? "—";
}
