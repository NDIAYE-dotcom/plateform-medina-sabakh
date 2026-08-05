import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Button, Input, Logo, Select } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import "./AuthLayout.css";

function mapSignupError(message) {
  if (!message) return "Une erreur est survenue. Veuillez réessayer.";
  if (message.includes("already registered") || message.includes("already been registered")) {
    return "Un compte existe déjà avec cet email.";
  }
  if (message.includes("Password should be at least")) {
    return "Le mot de passe doit contenir au moins 6 caractères.";
  }
  return message;
}

export default function SignupPage() {
  const { isAuthenticated, loading, signUp } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [posteSouhaiteId, setPosteSouhaiteId] = useState("");
  const [postes, setPostes] = useState([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase
      .from("postes_sante")
      .select("id, nom")
      .order("nom")
      .then(({ data }) => setPostes(data ?? []));
  }, []);

  if (!loading && isAuthenticated) {
    return <Navigate to="/tableau-de-bord" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (!posteSouhaiteId) {
      setError("Veuillez sélectionner le poste de santé que vous souhaitez rejoindre.");
      return;
    }
    setSubmitting(true);
    const { data, error: signupError } = await signUp(email, password, fullName, posteSouhaiteId);
    setSubmitting(false);

    if (signupError) {
      setError(mapSignupError(signupError.message));
      return;
    }

    if (data.session) {
      navigate("/en-attente-assignation", { replace: true });
      return;
    }

    setAwaitingConfirmation(true);
  };

  return (
    <main className="auth-page">
      <div className="auth-page__card">
        <Link to="/" className="auth-page__brand">
          <Logo />
        </Link>
        <h1>Créer un compte</h1>
        <p className="auth-page__subtitle">
          Votre compte sera en attente jusqu'à ce qu'un Administrateur de Poste de Santé vous
          intègre à son équipe.
        </p>

        {awaitingConfirmation ? (
          <p className="auth-page__success">
            Compte créé. Vérifiez votre boîte mail (<strong>{email}</strong>) pour confirmer votre
            adresse avant de vous connecter.
          </p>
        ) : (
          <form className="auth-page__form" onSubmit={handleSubmit}>
            <Input
              label="Nom complet"
              name="full_name"
              autoComplete="name"
              placeholder="Votre nom et prénom"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
            />
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
            <Select
              label="Poste de santé souhaité"
              options={postes.map((p) => ({ value: p.id, label: p.nom }))}
              value={posteSouhaiteId}
              onChange={(event) => setPosteSouhaiteId(event.target.value)}
              required
            />
            <Input
              label="Mot de passe"
              type="password"
              name="password"
              autoComplete="new-password"
              placeholder="••••••••"
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            {error && <p className="auth-page__error">{error}</p>}
            <Button type="submit" fullWidth loading={submitting}>
              Créer mon compte
            </Button>
          </form>
        )}

        <Link to="/connexion" className="auth-page__back">
          ← Déjà un compte ? Se connecter
        </Link>
      </div>
    </main>
  );
}
