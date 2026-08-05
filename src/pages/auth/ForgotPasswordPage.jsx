import { useState } from "react";
import { Link } from "react-router-dom";
import { Button, Input } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import "./AuthLayout.css";

export default function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const { error: resetError } = await requestPasswordReset(email);
    setSubmitting(false);

    if (resetError) {
      setError("Impossible d'envoyer l'email pour le moment. Réessayez plus tard.");
      return;
    }
    setSent(true);
  };

  return (
    <main className="auth-page">
      <div className="auth-page__card">
        <h1>Mot de passe oublié</h1>
        <p className="auth-page__subtitle">Recevez un lien de réinitialisation par email.</p>

        {sent ? (
          <p className="auth-page__success">
            Si un compte existe pour <strong>{email}</strong>, un email de réinitialisation vient
            d'être envoyé.
          </p>
        ) : (
          <form className="auth-page__form" onSubmit={handleSubmit}>
            <Input
              label="Email"
              type="email"
              placeholder="vous@ucds.sn"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            {error && <p className="auth-page__error">{error}</p>}
            <Button type="submit" fullWidth loading={submitting}>
              Envoyer le lien
            </Button>
          </form>
        )}

        <Link to="/connexion" className="auth-page__back">
          ← Retour à la connexion
        </Link>
      </div>
    </main>
  );
}
