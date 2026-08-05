import { Button, Logo } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import "./auth/AuthLayout.css";

export default function PendingAssignmentPage() {
  const { user, posteSouhaiteName, signOut } = useAuth();

  return (
    <main className="auth-page">
      <div className="auth-page__card" style={{ textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "var(--space-6)" }}>
          <Logo />
        </div>
        <h1>Compte en attente d'assignation</h1>
        <p className="auth-page__subtitle">
          Votre compte ({user?.email}) n'est pour le moment rattaché à aucun poste de santé.
          {posteSouhaiteName ? (
            <>
              {" "}
              Vous avez demandé à rejoindre <strong>{posteSouhaiteName}</strong> — l'Administrateur
              de ce poste doit valider votre affectation.
            </>
          ) : (
            " Contactez votre Super Administrateur UCDS pour qu'il vous assigne à un poste."
          )}
        </p>
        <Button variant="outline" fullWidth onClick={signOut}>
          Se déconnecter
        </Button>
      </div>
    </main>
  );
}
