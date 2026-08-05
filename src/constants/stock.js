export const CATEGORIE_OPTIONS = [
  { value: "medicament", label: "Médicament" },
  { value: "consommable", label: "Consommable" },
  { value: "materiel", label: "Matériel" },
];

export function getCategorieLabel(categorie) {
  return CATEGORIE_OPTIONS.find((o) => o.value === categorie)?.label ?? categorie;
}
