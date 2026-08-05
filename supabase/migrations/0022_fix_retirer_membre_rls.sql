-- Correctif #2 — "Impossible de retirer ce membre" dans Personnel
-- À exécuter dans Supabase Dashboard → SQL Editor.

-- Le message d'erreur exact confirmé par la console ("new row violates row-level security policy
-- for table profiles") montre que le blocage vient de la POLICY RLS "profiles_update_own_or_admin",
-- pas du trigger déjà réaffirmé dans 0021. La version de cette policy encore active semble être
-- celle de l'étape 6 (0003_multi_tenant.sql), dont le "with check" n'autorise que
-- "poste_id = current_poste_id()" — sans la branche "poste_id is null" ajoutée à l'étape 13
-- (0014/0015). Résultat : affecter un compte ou changer un rôle fonctionne (poste_id reste non
-- nul), mais retirer un membre (poste_id -> null) échoue systématiquement.
--
-- Réaffirme la policy telle que définie à l'étape 13 (0015_ciblage_et_roles.sql). Sans effet si
-- elle était déjà à jour.
drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
on public.profiles for update
to authenticated
using (
  id = auth.uid()
  or public.is_super_admin()
  or (
    public.is_poste_admin()
    and (
      poste_id = public.current_poste_id()
      or (poste_id is null and poste_souhaite_id = public.current_poste_id())
    )
  )
)
with check (
  id = auth.uid()
  or public.is_super_admin()
  or (public.is_poste_admin() and (poste_id = public.current_poste_id() or poste_id is null))
);
