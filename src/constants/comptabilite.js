export const CATEGORIE_DEPENSE_OPTIONS = [
  { value: "salaires", label: "Salaires" },
  { value: "loyer", label: "Loyer" },
  { value: "fournitures", label: "Fournitures" },
  { value: "electricite_eau", label: "Électricité / Eau" },
  { value: "transport", label: "Transport" },
  { value: "maintenance", label: "Maintenance" },
  { value: "autre", label: "Autre" },
];

export function getCategorieDepenseLabel(categorie) {
  return CATEGORIE_DEPENSE_OPTIONS.find((o) => o.value === categorie)?.label ?? categorie;
}

export function formatFcfa(value) {
  return `${(value ?? 0).toLocaleString("fr-FR")} FCFA`;
}
