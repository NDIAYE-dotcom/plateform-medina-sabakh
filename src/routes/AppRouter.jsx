import { Routes, Route } from "react-router-dom";
import LandingPage from "../pages/landing/LandingPage";
import LoginPage from "../pages/auth/LoginPage";
import DashboardPage from "../pages/dashboard/DashboardPage";
import DesignSystemPage from "../pages/design-system/DesignSystemPage";
import MentionsLegales from "../pages/legal/MentionsLegales";
import PolitiqueConfidentialite from "../pages/legal/PolitiqueConfidentialite";
import NotFoundPage from "../pages/NotFoundPage";
import ProtectedRoute from "./ProtectedRoute";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/connexion" element={<LoginPage />} />
      <Route path="/mentions-legales" element={<MentionsLegales />} />
      <Route path="/politique-confidentialite" element={<PolitiqueConfidentialite />} />
      <Route path="/design-system" element={<DesignSystemPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/tableau-de-bord" element={<DashboardPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
