import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <main className="container" style={{ paddingBlock: "var(--space-10)", textAlign: "center" }}>
      <h1>404</h1>
      <p style={{ color: "var(--color-text-muted)", marginTop: "var(--space-3)" }}>
        Page introuvable.
      </p>
      <Link
        to="/"
        style={{ color: "var(--color-primary)", marginTop: "var(--space-4)", display: "inline-block" }}
      >
        Retour à l'accueil
      </Link>
    </main>
  );
}
