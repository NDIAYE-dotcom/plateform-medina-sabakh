import { Link } from "react-router-dom";

export default function UnauthorizedPage() {
  return (
    <main className="container" style={{ paddingBlock: "var(--space-10)", textAlign: "center" }}>
      <h1>Accès refusé</h1>
      <p style={{ color: "var(--color-text-muted)", marginTop: "var(--space-3)" }}>
        Votre rôle ne vous permet pas d'accéder à cette page.
      </p>
      <Link
        to="/tableau-de-bord"
        style={{ color: "var(--color-primary)", marginTop: "var(--space-4)", display: "inline-block" }}
      >
        Retour au tableau de bord
      </Link>
    </main>
  );
}
