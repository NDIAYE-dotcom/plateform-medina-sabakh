import { Link } from "react-router-dom";
import "./LegalPage.css";

export default function MentionsLegales() {
  return (
    <main className="container legal-page">
      <h1>Mentions légales</h1>
      <p>
        Cette page présentera les mentions légales officielles de l'Union des Comités de
        Développement Sanitaire (UCDS) : éditeur du site, hébergeur, directeur de publication et
        informations réglementaires relatives à la commune de Médina Sabakh, Sénégal.
      </p>
      <div className="legal-page__notice">
        Contenu provisoire — le texte définitif sera fourni par l'UCDS avant la mise en production.
      </div>
      <Link to="/" className="legal-page__back">
        ← Retour à l'accueil
      </Link>
    </main>
  );
}
