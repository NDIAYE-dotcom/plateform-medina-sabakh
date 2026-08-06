import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { Loader } from "../components/ui";
import LandingPage from "../pages/landing/LandingPage";
import ProtectedRoute from "./ProtectedRoute";
import RequireSuperAdmin from "./RequireSuperAdmin";
import RequirePosteAccess from "./RequirePosteAccess";

// Chargées à la demande : seule la Landing Page (premier écran vu par la quasi-totalité des
// visiteurs) reste chargée immédiatement — tout le reste n'est téléchargé qu'au moment d'y
// naviguer, pour un premier chargement plus rapide sur les connexions mobiles limitées.
const LoginPage = lazy(() => import("../pages/auth/LoginPage"));
const SignupPage = lazy(() => import("../pages/auth/SignupPage"));
const ForgotPasswordPage = lazy(() => import("../pages/auth/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("../pages/auth/ResetPasswordPage"));
const DashboardLayout = lazy(() => import("../layouts/DashboardLayout"));
const DashboardPage = lazy(() => import("../pages/dashboard/DashboardPage"));
const ActualitesPage = lazy(() => import("../pages/actualites/ActualitesPage"));
const PosteDashboardPage = lazy(() => import("../pages/poste/PosteDashboardPage"));
const PatientsListPage = lazy(() => import("../pages/patients/PatientsListPage"));
const PatientFormPage = lazy(() => import("../pages/patients/PatientFormPage"));
const PatientDetailPage = lazy(() => import("../pages/patients/PatientDetailPage"));
const TicketsQueuePage = lazy(() => import("../pages/tickets/TicketsQueuePage"));
const ConsultationsPage = lazy(() => import("../pages/consultations/ConsultationsPage"));
const GrossessePage = lazy(() => import("../pages/grossesse/GrossessePage"));
const PharmaciePage = lazy(() => import("../pages/pharmacie/PharmaciePage"));
const StockPage = lazy(() => import("../pages/pharmacie/StockPage"));
const HistoriqueMouvementsPage = lazy(() => import("../pages/pharmacie/HistoriqueMouvementsPage"));
const InventairesPage = lazy(() => import("../pages/pharmacie/InventairesPage"));
const InventaireDetailPage = lazy(() => import("../pages/pharmacie/InventaireDetailPage"));
const OrdonnancesPharmaciePage = lazy(() => import("../pages/pharmacie/OrdonnancesPharmaciePage"));
const ComptabilitePage = lazy(() => import("../pages/comptabilite/ComptabilitePage"));
const PersonnelPage = lazy(() => import("../pages/personnel/PersonnelPage"));
const RapportsPage = lazy(() => import("../pages/rapports/RapportsPage"));
const ReglagesPage = lazy(() => import("../pages/reglages/ReglagesPage"));
const DesignSystemPage = lazy(() => import("../pages/design-system/DesignSystemPage"));
const MentionsLegales = lazy(() => import("../pages/legal/MentionsLegales"));
const PolitiqueConfidentialite = lazy(() => import("../pages/legal/PolitiqueConfidentialite"));
const UnauthorizedPage = lazy(() => import("../pages/UnauthorizedPage"));
const PendingAssignmentPage = lazy(() => import("../pages/PendingAssignmentPage"));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage"));

function RouteFallback() {
  return <Loader fullScreen label="Chargement..." />;
}

export default function AppRouter() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/connexion" element={<LoginPage />} />
        <Route path="/inscription" element={<SignupPage />} />
        <Route path="/mot-de-passe-oublie" element={<ForgotPasswordPage />} />
        <Route path="/reinitialiser-mot-de-passe" element={<ResetPasswordPage />} />
        <Route path="/acces-refuse" element={<UnauthorizedPage />} />
        <Route path="/mentions-legales" element={<MentionsLegales />} />
        <Route path="/politique-confidentialite" element={<PolitiqueConfidentialite />} />
        <Route path="/design-system" element={<DesignSystemPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/en-attente-assignation" element={<PendingAssignmentPage />} />

          <Route element={<DashboardLayout />}>
            <Route element={<RequireSuperAdmin />}>
              <Route path="/tableau-de-bord" element={<DashboardPage />} />
              <Route path="/actualites" element={<ActualitesPage />} />
            </Route>

            <Route path="/poste/:slug" element={<RequirePosteAccess />}>
              <Route path="tableau-de-bord" element={<PosteDashboardPage />} />
              <Route path="patients" element={<PatientsListPage />} />
              <Route path="patients/nouveau" element={<PatientFormPage />} />
              <Route path="patients/:patientId" element={<PatientDetailPage />} />
              <Route path="patients/:patientId/modifier" element={<PatientFormPage />} />
              <Route path="tickets" element={<TicketsQueuePage />} />
              <Route path="consultations" element={<ConsultationsPage />} />
              <Route path="grossesses" element={<GrossessePage />} />
              <Route path="pharmacie" element={<PharmaciePage />} />
              <Route path="stock" element={<StockPage />} />
              <Route path="mouvements" element={<HistoriqueMouvementsPage />} />
              <Route path="inventaires" element={<InventairesPage />} />
              <Route path="inventaires/:inventaireId" element={<InventaireDetailPage />} />
              <Route path="ordonnances" element={<OrdonnancesPharmaciePage />} />
              <Route path="comptabilite" element={<ComptabilitePage />} />
              <Route path="personnel" element={<PersonnelPage />} />
              <Route path="rapports" element={<RapportsPage />} />
              <Route path="reglages" element={<ReglagesPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
