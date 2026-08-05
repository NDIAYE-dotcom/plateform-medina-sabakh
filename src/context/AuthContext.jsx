import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  const fetchProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null);
      return;
    }

    setProfileLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, full_name, role, poste_id, poste_souhaite_id, poste:postes_sante!poste_id(nom, slug, telephone, nom_chef, cachet_url, signature_url), poste_souhaite:postes_sante!poste_souhaite_id(nom)"
      )
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Erreur de chargement du profil :", error.message);
      setProfile(null);
    } else {
      setProfile(data);
    }
    setProfileLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
      if (data.session?.user?.id) fetchProfile(data.session.user.id);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user?.id) {
        fetchProfile(nextSession.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.subscription.unsubscribe();
  }, [fetchProfile]);

  const signInWithPassword = (email, password) =>
    supabase.auth.signInWithPassword({ email, password });

  const signUp = (email, password, fullName, posteSouhaiteId) =>
    supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, poste_souhaite_id: posteSouhaiteId } },
    });

  const signOut = () => supabase.auth.signOut();

  const requestPasswordReset = (email) =>
    supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reinitialiser-mot-de-passe`,
    });

  const updatePassword = (password) => supabase.auth.updateUser({ password });

  const hasRole = (...roles) => Boolean(profile?.role) && roles.includes(profile.role);

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    role: profile?.role ?? null,
    posteId: profile?.poste_id ?? null,
    posteName: profile?.poste?.nom ?? null,
    posteSlug: profile?.poste?.slug ?? null,
    posteTelephone: profile?.poste?.telephone ?? null,
    posteNomChef: profile?.poste?.nom_chef ?? null,
    posteCachetUrl: profile?.poste?.cachet_url ?? null,
    posteSignatureUrl: profile?.poste?.signature_url ?? null,
    posteSouhaiteName: profile?.poste_souhaite?.nom ?? null,
    loading,
    profileLoading,
    isAuthenticated: Boolean(session),
    signInWithPassword,
    signUp,
    signOut,
    requestPasswordReset,
    updatePassword,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth doit être utilisé à l'intérieur d'un AuthProvider");
  }
  return context;
}
