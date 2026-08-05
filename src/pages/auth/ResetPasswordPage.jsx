import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import "./AuthLayout.css";

export default function ResetPasswordPage() {
  const { updatePassword } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setSubmitting(true);
    const { error: updateError } = await updatePassword(password);
    setSubmitting(false);

    if (updateError) {
      setError("Impossible de mettre à jour le mot de passe. Le lien a peut-être expiré.");
      return;
    }

    toast.success("Mot de passe mis à jour. Vous pouvez vous reconnecter.");
    navigate("/connexion", { replace: true });
  };

  return (
    <main className="auth-page">
      <div className="auth-page__card">
        <h1>Réinitialiser le mot de passe</h1>
        <p className="auth-page__subtitle">Choisissez un nouveau mot de passe.</p>

        <form className="auth-page__form" onSubmit={handleSubmit}>
          <Input
            label="Nouveau mot de passe"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <Input
            label="Confirmer le mot de passe"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />
          {error && <p className="auth-page__error">{error}</p>}
          <Button type="submit" fullWidth loading={submitting}>
            Mettre à jour
          </Button>
        </form>
      </div>
    </main>
  );
}
