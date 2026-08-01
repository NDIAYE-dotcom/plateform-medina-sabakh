import { Link } from "react-router-dom";
import "./LegalPage.css";

export default function PolitiqueConfidentialite() {
  return (
    <main className="container legal-page">
      <h1>Politique de confidentialité</h1>
      <p>
        Cette page décrira la manière dont l'UCDS collecte, utilise et protège les données
        personnelles des visiteurs du site et des utilisateurs de la plateforme (patients,
        personnel de santé, administrateurs), conformément à la réglementation sénégalaise sur la
        protection des données personnelles.
      </p>
      <div className="legal-page__notice">
        Contenu provisoire — la politique définitive sera rédigée avec l'UCDS, notamment pour
        couvrir les données de santé traitées par le module Patients (étape 7 de la feuille de
        route).
      </div>
      <Link to="/" className="legal-page__back">
        ← Retour à l'accueil
      </Link>
    </main>
  );
}
