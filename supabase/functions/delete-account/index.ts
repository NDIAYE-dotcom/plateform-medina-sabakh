// Edge Function — suppression définitive d'un compte utilisateur (auth + profil).
//
// Pourquoi une Edge Function : supprimer un compte auth.users nécessite l'API admin de Supabase,
// qui exige la clé service_role — une clé qui ne doit JAMAIS être exposée côté client (elle
// contourne toutes les policies RLS). Cette fonction tourne côté serveur, vérifie elle-même que
// l'appelant a le droit de supprimer CE compte précis, puis seulement fait l'appel admin.
//
// Déploiement : Dashboard Supabase → Edge Functions → New function → coller ce fichier → Deploy.
// SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY sont déjà disponibles
// automatiquement dans l'environnement de toute Edge Function — rien à configurer.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Un Administrateur Poste ne peut supprimer que des rôles de terrain de SON équipe — jamais un
// autre admin_poste ni un super_admin_ucds. Doit rester synchronisé avec
// allowed_roles_for_poste_admin dans prevent_role_escalation() (supabase/migrations/0015).
const ALLOWED_TARGET_ROLES_FOR_POSTE_ADMIN = [
  "medecin",
  "infirmier_chef",
  "sage_femme",
  "pharmacien",
  "caissier",
  "magasinier",
  "agent_sante",
  "lecture_seule",
];

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();
    if (!userId) {
      return jsonResponse({ error: "userId manquant." }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    // Client scopé à l'appelant (RLS active) — sert uniquement à l'identifier et lire son rôle.
    const authHeader = req.headers.get("Authorization") ?? "";
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Le token est passé explicitement à getUser() plutôt que de compter implicitement sur
    // l'en-tête global — comportement garanti, sans dépendre d'une version précise de la librairie.
    const {
      data: { user: caller },
    } = await callerClient.auth.getUser(authHeader.replace("Bearer ", ""));

    if (!caller) {
      return jsonResponse({ error: "Non authentifié." }, 401);
    }

    const { data: callerProfile } = await callerClient
      .from("profiles")
      .select("role, poste_id")
      .eq("id", caller.id)
      .maybeSingle();

    if (!callerProfile) {
      return jsonResponse({ error: "Profil introuvable." }, 403);
    }

    if (userId === caller.id) {
      return jsonResponse({ error: "Vous ne pouvez pas supprimer votre propre compte." }, 403);
    }

    // Client admin (service role) — uniquement pour lire la cible sans filtre RLS, et supprimer.
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: target } = await adminClient
      .from("profiles")
      .select("id, role, poste_id, poste_souhaite_id")
      .eq("id", userId)
      .maybeSingle();

    if (!target) {
      return jsonResponse({ error: "Compte introuvable." }, 404);
    }

    const isSuperAdmin = callerProfile.role === "super_admin_ucds";
    const isPosteAdmin = callerProfile.role === "admin_poste";
    // callerProfile.poste_id !== null en garde explicite : en JavaScript "null === null" vaut
    // true (contrairement au SQL, où "null = null" vaut NULL/faux) — sans cette garde, un compte
    // admin_poste mal configuré (poste_id absent) pourrait autoriser la suppression de N'IMPORTE
    // quel compte en attente, quel que soit le poste réellement demandé.
    const targetBelongsToCallerPoste =
      callerProfile.poste_id !== null &&
      (target.poste_id === callerProfile.poste_id ||
        (target.poste_id === null && target.poste_souhaite_id === callerProfile.poste_id));

    const canDelete =
      isSuperAdmin ||
      (isPosteAdmin &&
        targetBelongsToCallerPoste &&
        ALLOWED_TARGET_ROLES_FOR_POSTE_ADMIN.includes(target.role));

    if (!canDelete) {
      return jsonResponse({ error: "Vous n'êtes pas autorisé à supprimer ce compte." }, 403);
    }

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);

    if (deleteError) {
      return jsonResponse({ error: deleteError.message }, 500);
    }

    return jsonResponse({ success: true }, 200);
  } catch (err) {
    return jsonResponse({ error: String(err) }, 500);
  }
});
