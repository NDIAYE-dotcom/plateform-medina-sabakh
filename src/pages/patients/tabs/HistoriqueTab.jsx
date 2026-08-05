import { Badge } from "../../../components/ui";
import { formatDateTime } from "../../../constants/patients";
import { getStatutGrossesseLabel } from "../../../constants/grossesse";

export default function HistoriqueTab({ visites, vaccinations, consultations, grossesses, notes }) {
  const events = [
    ...visites.map((v) => ({
      id: `visite-${v.id}`,
      date: v.date_visite,
      type: "Visite",
      label: v.motif || "Visite",
      tone: "primary",
    })),
    ...consultations.map((c) => ({
      id: `consultation-${c.id}`,
      date: c.date_consultation,
      type: "Consultation",
      label: c.diagnostic || c.motif || "Consultation",
      tone: "info",
    })),
    ...grossesses.map((g) => ({
      id: `grossesse-${g.id}`,
      date: g.date_dernieres_regles,
      type: "Grossesse",
      label: getStatutGrossesseLabel(g.statut),
      tone: "warning",
    })),
    ...vaccinations.map((v) => ({
      id: `vaccin-${v.id}`,
      date: v.date_administration,
      type: "Vaccin",
      label: v.nom_vaccin,
      tone: "success",
    })),
    ...notes.map((n) => ({
      id: `note-${n.id}`,
      date: n.created_at,
      type: "Suivi",
      label: n.contenu,
      tone: "neutral",
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  if (events.length === 0) {
    return <p className="patient-tab__empty">Aucun historique pour le moment.</p>;
  }

  return (
    <ul className="patient-tab__card-list">
      {events.map((event) => (
        <li key={event.id} className="patient-tab__card">
          <div className="patient-tab__card-header">
            <span className="patient-tab__card-date">{formatDateTime(event.date)}</span>
            <Badge tone={event.tone}>{event.type}</Badge>
          </div>
          <p className="patient-tab__field-value">{event.label}</p>
        </li>
      ))}
    </ul>
  );
}
