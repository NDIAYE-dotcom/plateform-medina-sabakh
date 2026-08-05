import { Link } from "react-router-dom";
import { Badge, BarChart, Button, Card, Skeleton, Table } from "../../components/ui";
import { AlertTriangleIcon, ArrowRightIcon, CheckCircleIcon, MapPinIcon, TrendingUpIcon, UsersIcon } from "../../components/ui/icons";
import { CURRENT_STEP, ROADMAP_STEPS } from "../../constants/roadmap";
import { getRoleLabel } from "../../constants/roles";
import { useAuth } from "../../context/AuthContext";
import { useDashboardOverview } from "../../hooks/useDashboardOverview";
import "./DashboardPage.css";

export default function DashboardPage() {
  const { user, profile, posteName, profileLoading } = useAuth();
  const { totalPostes, totalUsers, roleBreakdown, postesWithoutAdmin, postesOverview, alertsCount, loading } =
    useDashboardOverview();

  const progressPercent = Math.round((CURRENT_STEP / ROADMAP_STEPS.length) * 100);
  const currentStepLabel = ROADMAP_STEPS.find((item) => item.step === CURRENT_STEP)?.label;

  return (
    <main className="container dashboard-page">
      <div className="dashboard-page__header">
        <div>
          <h1>Tableau de bord</h1>
          {profileLoading ? (
            <Skeleton variant="text" width={240} />
          ) : (
            <p className="dashboard-page__welcome">
              Bienvenue, <strong>{profile?.full_name || user?.email}</strong>
              {profile?.role && <> — {getRoleLabel(profile.role)}</>}
              {posteName && <> · {posteName}</>}
            </p>
          )}
        </div>
      </div>

      <div className="dashboard-page__kpis">
        <Card className="dashboard-kpi">
          <span className="dashboard-kpi__icon dashboard-kpi__icon--primary">
            <MapPinIcon />
          </span>
          <div>
            {loading ? <Skeleton variant="text" width={40} /> : <p className="dashboard-kpi__value">{totalPostes}</p>}
            <p className="dashboard-kpi__label">Postes de santé</p>
          </div>
        </Card>

        <Card className="dashboard-kpi">
          <span className="dashboard-kpi__icon dashboard-kpi__icon--primary">
            <UsersIcon />
          </span>
          <div>
            {loading ? <Skeleton variant="text" width={40} /> : <p className="dashboard-kpi__value">{totalUsers}</p>}
            <p className="dashboard-kpi__label">
              Utilisateurs <span className="dashboard-kpi__live">● en temps réel</span>
            </p>
          </div>
        </Card>

        <Card className="dashboard-kpi">
          <span
            className={`dashboard-kpi__icon ${alertsCount > 0 ? "dashboard-kpi__icon--warning" : "dashboard-kpi__icon--success"}`}
          >
            {alertsCount > 0 ? <AlertTriangleIcon /> : <CheckCircleIcon />}
          </span>
          <div>
            {loading ? <Skeleton variant="text" width={40} /> : <p className="dashboard-kpi__value">{alertsCount}</p>}
            <p className="dashboard-kpi__label">Alertes actives</p>
          </div>
        </Card>

        <Card className="dashboard-kpi">
          <span className="dashboard-kpi__icon dashboard-kpi__icon--secondary">
            <TrendingUpIcon />
          </span>
          <div>
            <p className="dashboard-kpi__value">
              {CURRENT_STEP}/{ROADMAP_STEPS.length}
            </p>
            <p className="dashboard-kpi__label">Étapes du projet livrées</p>
          </div>
        </Card>
      </div>

      <div className="dashboard-page__progress">
        <div className="dashboard-page__progress-bar">
          <div className="dashboard-page__progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
        <p className="dashboard-page__progress-label">
          Feuille de route UCDS — étape {CURRENT_STEP} : {currentStepLabel} ({progressPercent}%)
        </p>
      </div>

      <div className="dashboard-page__grid">
        <Card>
          <Card.Title>Utilisateurs par rôle</Card.Title>
          {loading ? (
            <Skeleton variant="block" height={180} />
          ) : roleBreakdown.length > 0 ? (
            <BarChart data={roleBreakdown} height={200} />
          ) : (
            <p className="dashboard-page__empty">Aucun utilisateur pour le moment.</p>
          )}
        </Card>

        <Card>
          <Card.Title>Alertes — Postes sans administrateur</Card.Title>
          {loading ? (
            <Skeleton.Text lines={3} />
          ) : postesWithoutAdmin.length === 0 ? (
            <p className="dashboard-page__empty dashboard-page__empty--success">
              Tous les postes de santé ont un administrateur assigné.
            </p>
          ) : (
            <ul className="dashboard-page__alert-list">
              {postesWithoutAdmin.map((poste) => (
                <li key={poste.id}>
                  <span>{poste.nom}</span>
                  <Badge tone="warning" dot>
                    Sans administrateur
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="dashboard-page__postes-card">
        <Card.Title>Postes de santé</Card.Title>
        <Card.Description>
          Vue d'ensemble des 7 postes — accédez à l'espace de n'importe quel poste pour le
          superviser.
        </Card.Description>
        <Table
          className="dashboard-page__postes-table"
          columns={[
            { key: "nom", header: "Poste" },
            {
              key: "hasAdmin",
              header: "Administrateur",
              render: (row) =>
                row.hasAdmin ? (
                  <Badge tone="success" dot>
                    Assigné
                  </Badge>
                ) : (
                  <Badge tone="warning" dot>
                    Non assigné
                  </Badge>
                ),
            },
            { key: "staffCount", header: "Effectif", align: "right" },
            {
              key: "action",
              header: "",
              align: "right",
              render: (row) => (
                <Button as={Link} to={`/poste/${row.slug}/tableau-de-bord`} size="sm" variant="ghost" iconRight={<ArrowRightIcon />}>
                  Voir l'espace
                </Button>
              ),
            },
          ]}
          rows={postesOverview}
          emptyMessage={loading ? "Chargement..." : "Aucun poste de santé."}
        />
      </Card>
    </main>
  );
}
