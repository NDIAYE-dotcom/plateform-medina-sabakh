-- Étape 13 — Gestion du personnel
-- À exécuter dans Supabase Dashboard → SQL Editor.

-- Contexte : jusqu'ici, seul un Super Administrateur UCDS pouvait affecter un compte fraîchement
-- inscrit (poste_id = null) à un poste. Cette étape permet à un Administrateur Poste de Santé de
-- gérer lui-même son équipe : voir les comptes en attente d'affectation, les intégrer avec un rôle
-- de terrain, et retirer un membre de son équipe si besoin — sans jamais pouvoir toucher à un
-- compte déjà affecté à un AUTRE poste, ni s'attribuer à lui-même un rôle différent.

-- 1. Un admin de poste voit aussi les comptes en attente d'affectation (poste_id null),
--    en plus de son propre poste (déjà en place depuis l'étape 6).
drop policy if exists "profiles_select_poste_admin" on public.profiles;
create policy "profiles_select_poste_admin"
on public.profiles for select
to authenticated
using (
  public.is_poste_admin()
  and (poste_id = public.current_poste_id() or poste_id is null)
);

-- 2. RLS large côté update (le trigger ci-dessous fait l'application stricte des règles métier) :
--    un admin de poste peut modifier un compte en attente ou déjà dans son équipe, et le résultat
--    doit rester soit dans son poste, soit repassé en attente (retrait d'équipe).
drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
on public.profiles for update
to authenticated
using (
  id = auth.uid()
  or public.is_super_admin()
  or (public.is_poste_admin() and (poste_id = public.current_poste_id() or poste_id is null))
)
with check (
  id = auth.uid()
  or public.is_super_admin()
  or (public.is_poste_admin() and (poste_id = public.current_poste_id() or poste_id is null))
);

-- 3. Règles précises d'affectation (remplace la version de l'étape 6) :
--    - un admin de poste peut affecter un compte SANS poste (poste_id null) à SON poste, avec un
--      rôle de terrain (jamais admin_poste ni super_admin_ucds) ;
--    - un admin de poste peut aussi changer le rôle d'un membre déjà dans son équipe ;
--    - un admin de poste peut retirer un membre de son équipe (poste_id -> null, rôle -> lecture_seule) ;
--    - jamais sur lui-même, jamais vers/depuis un AUTRE poste.
create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
as $$
declare
  allowed_roles_for_poste_admin public.user_role[] := array[
    'medecin', 'infirmier_chef', 'sage_femme', 'pharmacien',
    'caissier', 'magasinier', 'agent_sante', 'lecture_seule'
  ]::public.user_role[];
begin
  if auth.uid() is null or public.is_super_admin() then
    return new;
  end if;

  -- Affecter un compte en attente, ou changer le rôle d'un membre déjà dans l'équipe
  if public.is_poste_admin()
     and old.id <> auth.uid()
     and (old.poste_id = public.current_poste_id() or old.poste_id is null)
     and new.poste_id = public.current_poste_id()
     and new.role = any(allowed_roles_for_poste_admin)
  then
    return new;
  end if;

  -- Retirer un membre de l'équipe (repasse en attente d'affectation)
  if public.is_poste_admin()
     and old.id <> auth.uid()
     and old.poste_id = public.current_poste_id()
     and new.poste_id is null
     and new.role = 'lecture_seule'
  then
    return new;
  end if;

  if new.role is distinct from old.role then
    raise exception 'Vous n''êtes pas autorisé à modifier ce rôle.';
  end if;
  if new.poste_id is distinct from old.poste_id then
    raise exception 'Vous n''êtes pas autorisé à modifier le poste assigné.';
  end if;

  return new;
end;
$$;
