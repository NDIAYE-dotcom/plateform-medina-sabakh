import { useState } from "react";
import { useParams } from "react-router-dom";
import { BarChart, Badge, Button, Card, Input, LineChart, Skeleton } from "../../components/ui";
import { formatFcfa } from "../../constants/comptabilite";
import { useAuth } from "../../context/AuthContext";
import { usePosteBySlug } from "../../hooks/usePosteBySlug";
import { useRapports } from "../../hooks/useRapports";
import RapportPrintModal from "./RapportPrintModal";
import "./RapportsPage.css";

function firstDayOfMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function RapportsPage() {
  const { slug } = useParams();
  const { role, hasRole } = useAuth();
  const { poste, loading: posteLoading } = usePosteBySlug(slug);
  const [dateDebut, setDateDebut] = useState(firstDayOfMonth());
  const [dateFin, setDateFin] = useState(today());
  const [printOpen, setPrintOpen] = useState(false);

  const canView = role === "super_admin_ucds" || hasRole("admin_poste", "lecture_seule");

  const rapport = useRapports(canView ? poste?.id : null, dateDebut, dateFin);
  const { loading } = rapport;

  if (!posteLoading && !canView) {
    return (
      <main className="container rapports-page">
        <h1>Rapports et statistiques</h1>
        <p className="rapports-page__restricted">
          L'accès aux rapports est réservé à l'Administrateur Poste de Santé, à Consultation
          uniquement et au Super Admin.
        </p>
      </main>
    );
  }

  return (
    <main className="container rapports-page">
      <div className="rapports-page__header">
        <div>
          <h1>Rapports et statistiques</h1>
          <p className="rapports-page__subtitle">
            Vue d'ensemble de l'activité du poste {poste?.nom ?? ""} sur la période choisie.
          </p>
        </div>
        <Button variant="primary" onClick={() => setPrintOpen(true)}>
          Imprimer le rapport
        </Button>
      </div>

      <div className="rapports-page__period">
        <Input
          label="Du"
          type="date"
          value={dateDebut}
          onChange={(event) => setDateDebut(event.target.value)}
        />
        <Input
          label="Au"
          type="date"
          value={dateFin}
          onChange={(event) => setDateFin(event.target.value)}
        />
      </div>

      <div className="rapports-page__kpis">
        {[
          { label: "Nouveaux patients", value: rapport.nouveauxPatients },
          { label: "Tickets émis", value: rapport.ticketsTotal },
          { label: "Consultations", value: rapport.consultationsTotal },
          { label: "CPN réalisées", value: rapport.cpnTotal },
          { label: "Accouchements", value: rapport.accouchementsTotal },
          { label: "Ventes pharmacie", value: formatFcfa(rapport.ventesPharmacie) },
          { label: "Dépenses", value: formatFcfa(rapport.totalDepenses) },
          {
            label: "Solde",
            value: formatFcfa(rapport.solde),
            danger: rapport.solde < 0,
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className={`rapports-page__stat-card ${kpi.danger ? "rapports-page__stat-card--danger" : ""}`}
          >
            <span className="rapports-page__stat-label">{kpi.label}</span>
            {loading ? (
              <Skeleton variant="text" width={60} />
            ) : (
              <span className="rapports-page__stat-value">{kpi.value}</span>
            )}
          </div>
        ))}
      </div>

      <div className="rapports-page__grid">
        <Card>
          <Card.Title>Tickets par statut</Card.Title>
          {loading ? (
            <Skeleton variant="block" height={180} />
          ) : rapport.ticketsTotal > 0 ? (
            <BarChart data={rapport.ticketsParStatut} height={200} />
          ) : (
            <p className="rapports-page__empty">Aucun ticket sur cette période.</p>
          )}
        </Card>

        <Card>
          <Card.Title>Consultations par jour</Card.Title>
          {loading ? (
            <Skeleton variant="block" height={180} />
          ) : rapport.consultationsParJour.length > 0 ? (
            <LineChart data={rapport.consultationsParJour} height={200} />
          ) : (
            <p className="rapports-page__empty">Aucune consultation sur cette période.</p>
          )}
        </Card>

        <Card>
          <Card.Title>Personnel par rôle</Card.Title>
          {loading ? (
            <Skeleton variant="block" height={180} />
          ) : rapport.personnelParRole.length > 0 ? (
            <BarChart data={rapport.personnelParRole} height={200} color="var(--color-secondary)" />
          ) : (
            <p className="rapports-page__empty">Aucun membre du personnel assigné.</p>
          )}
        </Card>

        <Card>
          <Card.Title>Alertes stock</Card.Title>
          {loading ? (
            <Skeleton.Text lines={3} />
          ) : rapport.articlesEnRupture.length === 0 ? (
            <p className="rapports-page__empty rapports-page__empty--success">
              Aucun article sous le seuil d'alerte.
            </p>
          ) : (
            <ul className="rapports-page__alert-list">
              {rapport.articlesEnRupture.map((article) => (
                <li key={article.nom}>
                  <span>{article.nom}</span>
                  <Badge tone="danger">
                    {article.stock_actuel} {article.unite || ""} restant
                    {article.stock_actuel > 1 ? "s" : ""}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <RapportPrintModal
        open={printOpen}
        onClose={() => setPrintOpen(false)}
        poste={poste}
        dateDebut={dateDebut}
        dateFin={dateFin}
        rapport={rapport}
      />
    </main>
  );
}
