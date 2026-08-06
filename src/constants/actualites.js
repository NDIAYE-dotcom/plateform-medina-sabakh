export const ACTUALITE_CATEGORIES = {
  blog: "Blog",
  evenement: "Évènements",
  campagne: "Campagnes",
  vaccination: "Vaccinations",
  sensibilisation: "Sensibilisations",
};

export const ACTUALITE_CATEGORIE_OPTIONS = Object.entries(ACTUALITE_CATEGORIES).map(
  ([value, label]) => ({ value, label })
);

export function getActualiteCategorieLabel(categorie) {
  return ACTUALITE_CATEGORIES[categorie] ?? categorie;
}
