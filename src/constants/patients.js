export const SEXE_OPTIONS = [
  { value: "M", label: "Masculin" },
  { value: "F", label: "Féminin" },
];

export const GROUPE_SANGUIN_OPTIONS = [
  "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-",
].map((value) => ({ value, label: value }));

export const TYPE_VISITE_OPTIONS = [
  { value: "consultation", label: "Consultation" },
  { value: "suivi", label: "Suivi" },
  { value: "urgence", label: "Urgence" },
  { value: "autre", label: "Autre" },
];

export function getAge(dateNaissance) {
  if (!dateNaissance) return null;
  const birth = new Date(dateNaissance);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
}

export function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("fr-FR");
}

export function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
