-- Étape 4 — Authentification et gestion des rôles
-- À exécuter dans Supabase Dashboard → SQL Editor (ou via `supabase db push` si le CLI est lié).

-- 1. Rôles utilisateurs (cahier des charges §7.2)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum (
      'super_admin_ucds',
      'admin_poste',
      'medecin',
      'infirmier_chef',
      'sage_femme',
      'pharmacien',
      'caissier',
      'magasinier',
      'agent_sante',
      'lecture_seule'
    );
  end if;
end $$;

-- 2. Postes de santé (référence — l'architecture multi-tenant complète arrive à l'étape 6)
create table if not exists public.postes_sante (
  id uuid primary key default gen_random_uuid(),
  nom text not null unique,
  created_at timestamptz not null default now()
);

insert into public.postes_sante (nom) values
  ('Médina Sabakh'),
  ('Keur Ayib Gueye'),
  ('Falila'),
  ('Kohel'),
  ('Ndiba'),
  ('Ndiayène'),
  ('Payoma')
on conflict (nom) do nothing;

-- 3. Profils utilisateurs
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role public.user_role not null default 'lecture_seule',
  poste_id uuid references public.postes_sante(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists profiles_poste_id_idx on public.profiles(poste_id);

-- 4. updated_at automatique
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- 5. Création automatique du profil à l'inscription d'un utilisateur Supabase Auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- 6. Fonctions utilitaires (security definer pour éviter la récursion RLS)
create or replace function public.is_super_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'super_admin_ucds'
  );
$$;

create or replace function public.current_poste_id()
returns uuid
language sql
security definer set search_path = public
stable
as $$
  select poste_id from public.profiles where id = auth.uid();
$$;

-- 7. Empêche un utilisateur de s'auto-attribuer un rôle ou un poste
-- Ne s'applique qu'aux requêtes faites via l'application (auth.uid() renseigné).
-- Les interventions manuelles depuis le SQL Editor (rôle postgres, sans JWT) ne sont pas
-- concernées : c'est nécessaire pour pouvoir bootstrapper le tout premier Super Admin.
create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is not null and not public.is_super_admin() then
    if new.role is distinct from old.role then
      raise exception 'Seul un Super Administrateur UCDS peut modifier le rôle.';
    end if;
    if new.poste_id is distinct from old.poste_id then
      raise exception 'Seul un Super Administrateur UCDS peut modifier le poste de santé assigné.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_prevent_role_escalation on public.profiles;
create trigger profiles_prevent_role_escalation
before update on public.profiles
for each row execute function public.prevent_role_escalation();

-- 8. Row Level Security
alter table public.postes_sante enable row level security;
alter table public.profiles enable row level security;

drop policy if exists "postes_sante_select_authenticated" on public.postes_sante;
create policy "postes_sante_select_authenticated"
on public.postes_sante for select
to authenticated
using (true);

drop policy if exists "postes_sante_write_super_admin" on public.postes_sante;
create policy "postes_sante_write_super_admin"
on public.postes_sante for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists "profiles_select_own_or_super_admin" on public.profiles;
create policy "profiles_select_own_or_super_admin"
on public.profiles for select
to authenticated
using (id = auth.uid() or public.is_super_admin());

drop policy if exists "profiles_update_own_or_super_admin" on public.profiles;
create policy "profiles_update_own_or_super_admin"
on public.profiles for update
to authenticated
using (id = auth.uid() or public.is_super_admin())
with check (id = auth.uid() or public.is_super_admin());
