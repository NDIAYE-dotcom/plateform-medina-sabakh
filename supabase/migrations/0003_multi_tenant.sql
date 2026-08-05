-- Étape 6 — Architecture Multi-Tenant
-- À exécuter dans Supabase Dashboard → SQL Editor.

-- 1. Identifiant d'URL stable pour chaque poste (utilisé par les routes /poste/:slug)
alter table public.postes_sante add column if not exists slug text;

update public.postes_sante set slug = 'medina-sabakh' where nom = 'Médina Sabakh' and slug is null;
update public.postes_sante set slug = 'keur-ayib-gueye' where nom = 'Keur Ayib Gueye' and slug is null;
update public.postes_sante set slug = 'falila' where nom = 'Falila' and slug is null;
update public.postes_sante set slug = 'kohel' where nom = 'Kohel' and slug is null;
update public.postes_sante set slug = 'ndiba' where nom = 'Ndiba' and slug is null;
update public.postes_sante set slug = 'ndiayene' where nom = 'Ndiayène' and slug is null;
update public.postes_sante set slug = 'payoma' where nom = 'Payoma' and slug is null;

alter table public.postes_sante alter column slug set not null;
create unique index if not exists postes_sante_slug_idx on public.postes_sante(slug);

-- 2. Un Administrateur Poste de Santé ne gère que son propre poste
create or replace function public.is_poste_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin_poste'
  );
$$;

-- 3. Un admin de poste voit les profils de son poste (en plus de : soi-même, et le Super Admin qui voit tout)
drop policy if exists "profiles_select_poste_admin" on public.profiles;
create policy "profiles_select_poste_admin"
on public.profiles for select
to authenticated
using (public.is_poste_admin() and poste_id = public.current_poste_id());

-- 4. Un admin de poste peut mettre à jour les profils de son poste (le trigger ci-dessous
-- restreint précisément ce qu'il a le droit de changer)
drop policy if exists "profiles_update_own_or_super_admin" on public.profiles;
drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
on public.profiles for update
to authenticated
using (
  id = auth.uid()
  or public.is_super_admin()
  or (public.is_poste_admin() and poste_id = public.current_poste_id())
)
with check (
  id = auth.uid()
  or public.is_super_admin()
  or (public.is_poste_admin() and poste_id = public.current_poste_id())
);

-- 5. Règles d'attribution des rôles :
--    - Super Administrateur UCDS : peut tout faire (inchangé)
--    - Administrateur Poste de Santé : peut attribuer un rôle "de terrain" (jamais admin_poste ni
--      super_admin_ucds) à un utilisateur de SON poste, jamais à lui-même, jamais vers un autre poste
--    - Tout le monde d'autre : ne peut rien changer (inchangé)
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

  if public.is_poste_admin()
     and old.id <> auth.uid()
     and old.poste_id = public.current_poste_id()
     and new.poste_id = public.current_poste_id()
     and new.role = any(allowed_roles_for_poste_admin)
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
