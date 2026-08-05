import { Link, useParams } from "react-router-dom";
import { Card, Skeleton } from "../../components/ui";
import {
  AlertTriangleIcon,
  BabyIcon,
  BoxIcon,
  BriefcaseIcon,
  ClipboardIcon,
  PillIcon,
  SettingsIcon,
  TicketIcon,
  TrendingUpIcon,
  UsersIcon,
  WalletIcon,
} from "../../components/ui/icons";
import { getRoleLabel } from "../../constants/roles";
import { useAuth } from "../../context/AuthContext";
import { useModuleAccess } from "../../hooks/useModuleAccess";
import { usePosteBySlug } from "../../hooks/usePosteBySlug";
import { usePosteOverview } from "../../hooks/usePosteOverview";
import "./PosteDashboardPage.css";

export default function PosteDashboardPage() {
  const { slug } = useParams();
  const { user, profile, role, posteId: ownPosteId } = useAuth();
  const { poste, loading: posteLoading } = usePosteBySlug(slug);
  const access = useModuleAccess();
  const isSuperAdmin = role === "super_admin_ucds";

  const overview = usePosteOverview(poste?.id, {
    includeConsultations: access.canViewConsultations,
    includePharmacie: access.canViewPharmacie,
  });

  if (posteLoading) {
    return (
      <main className="container poste-dashboard">
        <Skeleton variant="text" width={280} />
      </main>
    );
  }

  if (!poste) {
    return (
      <main className="container poste-dashboard">
        <h1>Poste introuvable</h1>
        <p className="poste-dashboard__subtitle">Ce poste de santé n'existe pas ou plus.</p>
      </main>
    );
  }

  const quickLinks = [
    access.canViewPatients && {
      label: "Patients",
      to: `/poste/${slug}/patients`,
      icon: <UsersIcon />,
    },
    { label: "Tickets", to: `/poste/${slug}/tickets`, icon: <TicketIcon /> },
    access.canViewConsultations && {
      label: "Consultations",
      to: `/poste/${slug}/consultations`,
      icon: <ClipboardIcon />,
    },
    access.canViewGrossesse && {
      label: "Grossesse",
      to: `/poste/${slug}/grossesses`,
      icon: <BabyIcon />,
    },
    access.canViewPharmacie && {
      label: "Pharmacie",
      to: `/poste/${slug}/pharmacie`,
      icon: <PillIcon />,
    },
    access.canViewPharmacie && { label: "Stock", to: `/poste/${slug}/stock`, icon: <BoxIcon /> },
    access.canViewComptabilite && {
      label: "Comptabilité",
      to: `/poste/${slug}/comptabilite`,
      icon: <WalletIcon />,
    },
    access.canViewPersonnel && {
      label: "Personnel",
      to: `/poste/${slug}/personnel`,
      icon: <BriefcaseIcon />,
    },
    access.canViewRapports && {
      label: "Rapports",
      to: `/poste/${slug}/rapports`,
      icon: <TrendingUpIcon />,
    },
    access.canViewReglages && {
      label: "Réglages",
      to: `/poste/${slug}/reglages`,
      icon: <SettingsIcon />,
    },
  ].filter(Boolean);

  return (
    <main className="container poste-dashboard">
      <div className="poste-dashboard__header">
        <div>
          <span className="poste-dashboard__eyebrow">Espace du poste</span>
          <h1>{poste.nom}</h1>
          <p className="poste-dashboard__subtitle">
            {isSuperAdmin && ownPosteId !== poste.id ? (
              "Vous consultez cet espace en tant que Super Administrateur UCDS."
            ) : (
              <>
                Bienvenue, <strong>{profile?.full_name || user?.email || "Utilisateur"}</strong>
                {role && <> — {getRoleLabel(role)}</>}
              </>
            )}
          </p>
        </div>
      </div>

      <div className="poste-dashboard__kpis">
        {access.canViewPatients && (
          <Card hoverable className="poste-dashboard__kpi poste-dashboard__kpi--primary">
            <span className="poste-dashboard__kpi-icon">
              <UsersIcon />
            </span>
            <div>
              {overview.loading ? (
                <Skeleton variant="text" width={40} />
              ) : (
                <p className="poste-dashboard__kpi-value">{overview.patientsTotal}</p>
              )}
              <p className="poste-dashboard__kpi-label">Patients enregistrés</p>
            </div>
          </Card>
        )}

        <Card hoverable className="poste-dashboard__kpi poste-dashboard__kpi--info">
          <span className="poste-dashboard__kpi-icon">
            <TicketIcon />
          </span>
          <div>
            {overview.loading ? (
              <Skeleton variant="text" width={40} />
            ) : (
              <p className="poste-dashboard__kpi-value">{overview.ticketsAujourdhui}</p>
            )}
            <p className="poste-dashboard__kpi-label">
              Tickets aujourd'hui
              {overview.ticketsEnAttente > 0 && ` · ${overview.ticketsEnAttente} en attente`}
            </p>
          </div>
        </Card>

        {access.canViewConsultations && (
          <Card hoverable className="poste-dashboard__kpi poste-dashboard__kpi--secondary">
            <span className="poste-dashboard__kpi-icon">
              <ClipboardIcon />
            </span>
            <div>
              {overview.loading ? (
                <Skeleton variant="text" width={40} />
              ) : (
                <p className="poste-dashboard__kpi-value">{overview.consultationsAujourdhui}</p>
              )}
              <p className="poste-dashboard__kpi-label">Consultations aujourd'hui</p>
            </div>
          </Card>
        )}

        {access.canViewPharmacie && (
          <Card hoverable className="poste-dashboard__kpi poste-dashboard__kpi--warning">
            <span className="poste-dashboard__kpi-icon">
              <AlertTriangleIcon />
            </span>
            <div>
              {overview.loading ? (
                <Skeleton variant="text" width={40} />
              ) : (
                <p className="poste-dashboard__kpi-value">{overview.articlesRupture}</p>
              )}
              <p className="poste-dashboard__kpi-label">Articles sous le seuil d'alerte</p>
            </div>
          </Card>
        )}
      </div>

      <div className="poste-dashboard__quick-links">
        <h2>Accès rapide</h2>
        <div className="poste-dashboard__quick-grid">
          {quickLinks.map((item) => (
            <Link key={item.label} to={item.to} className="poste-dashboard__quick-card">
              <span className="poste-dashboard__quick-icon">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
