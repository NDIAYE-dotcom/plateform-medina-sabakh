import { useState } from "react";
import { NavLink, Outlet, useParams } from "react-router-dom";
import { Drawer, Logo, Navbar, Sidebar } from "../components/ui";
import {
  BabyIcon,
  BoxIcon,
  BriefcaseIcon,
  ClipboardIcon,
  GridIcon,
  MegaphoneIcon,
  PillIcon,
  SettingsIcon,
  TicketIcon,
  TrendingUpIcon,
  UsersIcon,
  WalletIcon,
} from "../components/ui/icons";
import { getRoleLabel } from "../constants/roles";
import { useAuth } from "../context/AuthContext";
import { useDashboardOverview } from "../hooks/useDashboardOverview";
import { useModuleAccess } from "../hooks/useModuleAccess";
import { usePosteAlerts } from "../hooks/usePosteAlerts";
import { usePosteBySlug } from "../hooks/usePosteBySlug";
import { getHomePath } from "../utils/getHomePath";
import "./DashboardLayout.css";

function buildNavSections({
  homePath,
  currentPosteSlug,
  isSuperAdmin,
  canViewPatients,
  canViewConsultations,
  canViewGrossesse,
  canViewPharmacie,
  canViewComptabilite,
  canViewPersonnel,
  canViewRapports,
  canViewReglages,
}) {
  // Un module restreint par rôle est simplement absent du menu pour ce compte, plutôt
  // qu'affiché grisé avec un badge — chaque rôle ne voit que ce qui le concerne.
  const patientsItem = !currentPosteSlug
    ? { label: "Patients", icon: <UsersIcon />, disabled: true, badge: "Par poste" }
    : canViewPatients
      ? { label: "Patients", to: `/poste/${currentPosteSlug}/patients`, icon: <UsersIcon /> }
      : null;

  const ticketsItem = currentPosteSlug
    ? { label: "Tickets", to: `/poste/${currentPosteSlug}/tickets`, icon: <TicketIcon /> }
    : { label: "Tickets", icon: <TicketIcon />, disabled: true, badge: "Par poste" };

  const consultationsItem = !currentPosteSlug
    ? { label: "Consultations", icon: <ClipboardIcon />, disabled: true, badge: "Par poste" }
    : canViewConsultations
      ? { label: "Consultations", to: `/poste/${currentPosteSlug}/consultations`, icon: <ClipboardIcon /> }
      : null;

  const grossesseItem = !currentPosteSlug
    ? { label: "Grossesse", icon: <BabyIcon />, disabled: true, badge: "Par poste" }
    : canViewGrossesse
      ? { label: "Grossesse", to: `/poste/${currentPosteSlug}/grossesses`, icon: <BabyIcon /> }
      : null;

  const pharmacieItem = !currentPosteSlug
    ? { label: "Pharmacie", icon: <PillIcon />, disabled: true, badge: "Par poste" }
    : canViewPharmacie
      ? { label: "Pharmacie", to: `/poste/${currentPosteSlug}/pharmacie`, icon: <PillIcon /> }
      : null;

  const stockItem = !currentPosteSlug
    ? { label: "Stock", icon: <BoxIcon />, disabled: true, badge: "Par poste" }
    : canViewPharmacie
      ? { label: "Stock", to: `/poste/${currentPosteSlug}/stock`, icon: <BoxIcon /> }
      : null;

  const comptabiliteItem = !currentPosteSlug
    ? { label: "Comptabilité", icon: <WalletIcon />, disabled: true, badge: "Par poste" }
    : canViewComptabilite
      ? { label: "Comptabilité", to: `/poste/${currentPosteSlug}/comptabilite`, icon: <WalletIcon /> }
      : null;

  const personnelItem = !currentPosteSlug
    ? { label: "Personnel", icon: <BriefcaseIcon />, disabled: true, badge: "Par poste" }
    : canViewPersonnel
      ? { label: "Personnel", to: `/poste/${currentPosteSlug}/personnel`, icon: <BriefcaseIcon /> }
      : null;

  const rapportsItem = !currentPosteSlug
    ? { label: "Rapports", icon: <TrendingUpIcon />, disabled: true, badge: "Par poste" }
    : canViewRapports
      ? { label: "Rapports", to: `/poste/${currentPosteSlug}/rapports`, icon: <TrendingUpIcon /> }
      : null;

  const reglagesItem = !currentPosteSlug
    ? { label: "Réglages", icon: <SettingsIcon />, disabled: true, badge: "Par poste" }
    : canViewReglages
      ? { label: "Réglages", to: `/poste/${currentPosteSlug}/reglages`, icon: <SettingsIcon /> }
      : null;

  return [
    {
      title: "Général",
      items: [
        { label: "Tableau de bord", to: homePath, icon: <GridIcon /> },
        isSuperAdmin
          ? { label: "Actualités", to: "/actualites", icon: <MegaphoneIcon /> }
          : null,
      ].filter(Boolean),
    },
    {
      title: "Modules",
      items: [
        patientsItem,
        ticketsItem,
        consultationsItem,
        grossesseItem,
        pharmacieItem,
        stockItem,
        comptabiliteItem,
        personnelItem,
        rapportsItem,
        reglagesItem,
      ].filter(Boolean),
    },
  ];
}

export default function DashboardLayout() {
  const { user, profile, role, posteName, posteSlug, signOut } = useAuth();
  const { slug: currentPosteSlug } = useParams();
  const isSuperAdmin = role === "super_admin_ucds";
  const {
    postesWithoutAdmin,
    pendingAccounts,
    loading: overviewLoading,
  } = useDashboardOverview({
    enabled: isSuperAdmin,
  });
  const moduleAccess = useModuleAccess();
  const { poste: currentPoste } = usePosteBySlug(currentPosteSlug);
  const posteAlerts = usePosteAlerts(currentPosteSlug ? currentPoste?.id : null, {
    includePharmacie: moduleAccess.canViewPharmacie,
    includePersonnel: moduleAccess.canViewPersonnel,
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const displayName = profile?.full_name || user?.email || "";
  const navSections = buildNavSections({
    homePath: getHomePath({ role, posteSlug }),
    currentPosteSlug,
    isSuperAdmin,
    ...moduleAccess,
  });

  const notifications = [
    ...(isSuperAdmin
      ? postesWithoutAdmin.map((poste) => ({
          id: `admin-${poste.id}`,
          label: poste.nom,
          description: "Sans administrateur",
          to: `/poste/${poste.slug}/tableau-de-bord`,
        }))
      : []),
    // Vue globale (aucun poste ouvert) : liste tous les comptes en attente, tous postes confondus
    // — dès qu'un poste précis est ouvert, posteAlerts.comptesEnAttenteCount prend le relais pour
    // ce poste-là, donc on évite ici de lister deux fois le même compte.
    ...(isSuperAdmin && !currentPosteSlug
      ? pendingAccounts
          .filter((account) => account.poste_souhaite)
          .map((account) => ({
            id: `pending-${account.id}`,
            label: account.full_name || "Compte sans nom",
            description: `Demande ${account.poste_souhaite.nom}`,
            to: `/poste/${account.poste_souhaite.slug}/personnel`,
            urgent: true,
          }))
      : []),
    ...(posteAlerts.stockBasCount > 0
      ? [
          {
            id: "stock-bas",
            label: `${posteAlerts.stockBasCount} article${posteAlerts.stockBasCount > 1 ? "s" : ""} sous le seuil`,
            description: "Pharmacie",
            to: `/poste/${currentPosteSlug}/stock`,
          },
        ]
      : []),
    ...(posteAlerts.comptesEnAttenteCount > 0
      ? [
          {
            id: "comptes-attente",
            label: `${posteAlerts.comptesEnAttenteCount} compte${posteAlerts.comptesEnAttenteCount > 1 ? "s" : ""} en attente d'affectation`,
            description: "Personnel",
            to: `/poste/${currentPosteSlug}/personnel`,
            urgent: true,
          },
        ]
      : []),
    ...(posteAlerts.inventairesEnCoursCount > 0
      ? [
          {
            id: "inventaires-en-cours",
            label: `${posteAlerts.inventairesEnCoursCount} inventaire${posteAlerts.inventairesEnCoursCount > 1 ? "s" : ""} non clôturé depuis plus de 2 jours`,
            description: "Pharmacie",
            to: `/poste/${currentPosteSlug}/inventaires`,
          },
        ]
      : []),
  ];
  const notificationsLoading = (isSuperAdmin && overviewLoading) || posteAlerts.loading;

  return (
    <div className="dashboard-layout">
      <div className="dashboard-layout__sidebar-desktop">
        <Sidebar logo={<Logo size={30} />} sections={navSections} />
      </div>

      <div className="dashboard-layout__main">
        <Navbar
          onMenuClick={() => setMobileMenuOpen(true)}
          showSearch={false}
          notifications={notifications}
          notificationsLoading={notificationsLoading}
          user={{ name: displayName, role: profile?.role ? getRoleLabel(profile.role) : undefined }}
          onSignOut={signOut}
          actions={
            posteName ? <span className="dashboard-layout__poste-pill">{posteName}</span> : null
          }
        />

        <div className="dashboard-layout__content">
          <Outlet />
        </div>
      </div>

      <Drawer open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} title="Menu" side="left">
        <nav className="sidebar__nav dashboard-layout__mobile-nav">
          {navSections.map((section) => (
            <div className="sidebar__section" key={section.title}>
              <p className="sidebar__section-title">{section.title}</p>
              <ul>
                {section.items.map((item) =>
                  item.disabled ? (
                    <li key={item.label}>
                      <span className="sidebar__item sidebar__item--disabled">
                        <span className="sidebar__icon">{item.icon}</span>
                        <span className="sidebar__label">{item.label}</span>
                        {item.badge && <span className="sidebar__badge">{item.badge}</span>}
                      </span>
                    </li>
                  ) : (
                    <li key={item.label}>
                      <NavLink
                        to={item.to}
                        onClick={() => setMobileMenuOpen(false)}
                        className={({ isActive }) =>
                          `sidebar__item ${isActive ? "sidebar__item--active" : ""}`
                        }
                      >
                        <span className="sidebar__icon">{item.icon}</span>
                        <span className="sidebar__label">{item.label}</span>
                      </NavLink>
                    </li>
                  )
                )}
              </ul>
            </div>
          ))}
        </nav>
        <button type="button" className="dashboard-layout__mobile-signout" onClick={signOut}>
          Se déconnecter
        </button>
      </Drawer>
    </div>
  );
}
