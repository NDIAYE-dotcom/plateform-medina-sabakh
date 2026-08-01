import { useAuth } from "../../context/AuthContext";

export default function DashboardPage() {
  const { user, signOut } = useAuth();

  return (
    <main className="container" style={{ paddingBlock: "var(--space-10)" }}>
      <h1>Tableau de bord</h1>
      <p style={{ color: "var(--color-text-muted)", marginTop: "var(--space-3)" }}>
        Connecté en tant que {user?.email}. Tableau de bord complet — étape 5 de la feuille de route.
      </p>
      <button
        onClick={signOut}
        style={{
          marginTop: "var(--space-5)",
          padding: "var(--space-2) var(--space-4)",
          background: "var(--color-primary)",
          color: "var(--color-white)",
          borderRadius: "var(--radius-md)",
        }}
      >
        Se déconnecter
      </button>
    </main>
  );
}
