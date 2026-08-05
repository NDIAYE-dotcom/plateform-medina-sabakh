import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Button, Input, Logo } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import "./AuthLayout.css";

function mapAuthError(message) {
  if (!message) return "Une erreur est survenue. Veuillez réessayer.";
  if (message.includes("Invalid login credentials")) {
    return "Email ou mot de passe incorrect.";
  }
  if (message.includes("Email not confirmed")) {
    return "Votre adresse email n'a pas encore été confirmée.";
  }
  return message;
}

export default function LoginPage() {
  const { isAuthenticated, loading, signInWithPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  if (!loading && isAuthenticated) {
    return <Navigate to={location.state?.from ?? "/tableau-de-bord"} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const { error: signInError } = await signInWithPassword(email, password);
    setSubmitting(false);

    if (signInError) {
      setError(mapAuthError(signInError.message));
      return;
    }

    navigate(location.state?.from ?? "/tableau-de-bord", { replace: true });
  };

  return (
    <main className="auth-page">
      <div className="auth-page__card">
        <Link to="/" className="auth-page__brand">
          <Logo />
        </Link>
        <h1>Connexion</h1>
        <p className="auth-page__subtitle">
          Accédez à l'espace de gestion de votre poste de santé.
        </p>

        <form className="auth-page__form" onSubmit={handleSubmit}>
          <Input
            label="Email"
            type="email"
            name="email"
            autoComplete="username"
            placeholder="vous@ucds.sn"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <Input
            label="Mot de passe"
            type="password"
            name="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          {error && <p className="auth-page__error">{error}</p>}
          <Link to="/mot-de-passe-oublie" className="auth-page__forgot">
            Mot de passe oublié ?
          </Link>
          <Button type="submit" fullWidth loading={submitting}>
            Se connecter
          </Button>
        </form>

        <Link to="/inscription" className="auth-page__back">
          Pas encore de compte ? Créer un compte
        </Link>
      </div>
    </main>
  );
}
