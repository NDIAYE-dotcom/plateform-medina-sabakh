import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Input, Tabs } from "../../components/ui";
import { SearchIcon } from "../../components/ui/icons";
import { formatDateTime } from "../../constants/patients";
import { PHARMACIE_MODULE_ROLES } from "../../constants/roles";
import { useAuth } from "../../context/AuthContext";
import { useOrdonnancesPharmacie } from "../../hooks/useOrdonnancesPharmacie";
import { usePosteBySlug } from "../../hooks/usePosteBySlug";
import "./PharmaciePage.css";

const PERIOD_TABS = [
  { id: "recentes", label: "Récentes" },
  { id: "aujourdhui", label: "Aujourd'hui" },
];

export default function OrdonnancesPharmaciePage() {
  const { slug } = useParams();
  const { role, hasRole } = useAuth();
  const canView =
    role === "super_admin_ucds" || hasRole("admin_poste", "lecture_seule", ...PHARMACIE_MODULE_ROLES);
  const { poste, loading: posteLoading } = usePosteBySlug(slug);
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("recentes");
  const { ordonnances, loading } = useOrdonnancesPharmacie(canView ? poste?.id : null, {
    search,
    onlyToday: period === "aujourdhui",
  });

  if (!posteLoading && !canView) {
    return (
      <main className="container pharmacie-page">
        <h1>Ordonnances</h1>
        <p className="pharmacie-page__restricted">
          L'accès aux ordonnances est réservé au Pharmacien, au Magasinier et à l'Administrateur
          du poste.
        </p>
      </main>
    );
  }

  return (
    <main className="container pharmacie-page">
      <Link to={`/poste/${slug}/pharmacie`} className="pharmacie-page__back">
        ← Retour à la Pharmacie
      </Link>

      <div className="pharmacie-page__header">
        <div>
          <h1>Ordonnances</h1>
          <p className="pharmacie-page__subtitle">
            Médicaments prescrits au poste {poste?.nom ?? ""} — préparez-les avant l'arrivée du
            patient au comptoir.
          </p>
        </div>
      </div>

      <div className="pharmacie-page__toolbar">
        <Input
          icon={<SearchIcon />}
          placeholder="Rechercher un patient..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="pharmacie-page__search"
        />
      </div>

      <Tabs tabs={PERIOD_TABS} activeId={period} onChange={setPeriod} />

      {loading || posteLoading ? (
        <p className="pharmacie-page__empty">Chargement...</p>
      ) : ordonnances.length === 0 ? (
        <p className="pharmacie-page__empty">Aucune ordonnance sur cette période.</p>
      ) : (
        <ul className="pharmacie-page__ordonnance-list">
          {ordonnances.map((ordonnance) => (
            <li key={ordonnance.consultationId} className="pharmacie-page__ordonnance-card">
              <div className="pharmacie-page__ordonnance-header">
                <div>
                  <p className="pharmacie-page__ordonnance-patient">
                    {ordonnance.patient?.prenom} {ordonnance.patient?.nom}
                  </p>
                  <p className="pharmacie-page__ordonnance-dossier">
                    Dossier n° {ordonnance.patient?.numero_dossier ?? "—"}
                  </p>
                </div>
                <span className="pharmacie-page__ordonnance-date">
                  {formatDateTime(ordonnance.createdAt)}
                </span>
              </div>
              <ul className="pharmacie-page__ordonnance-meds">
                {ordonnance.lignes.map((ligne) => (
                  <li key={ligne.id} className="pharmacie-page__ordonnance-med">
                    <span className="pharmacie-page__ordonnance-med-nom">{ligne.medicament}</span>
                    {(ligne.posologie || ligne.duree) && (
                      <span className="pharmacie-page__ordonnance-med-detail">
                        {[ligne.posologie, ligne.duree].filter(Boolean).join(" — ")}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
