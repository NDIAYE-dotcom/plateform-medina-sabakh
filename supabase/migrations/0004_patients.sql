-- Étape 7 — Gestion des patients
-- À exécuter dans Supabase Dashboard → SQL Editor.

-- 0. Petit utilitaire manquant : le rôle de l'utilisateur courant (évite de répéter la sous-requête)
create or replace function public.current_role()
returns public.user_role
language sql
security definer set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- 1. Fiche patient
create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  poste_id uuid not null references public.postes_sante(id) on delete restrict,
  numero_dossier text not null,
  nom text not null,
  prenom text not null,
  date_naissance date,
  sexe text check (sexe in ('M', 'F')),
  telephone text,
  adresse text,
  groupe_sanguin text check (groupe_sanguin in ('A+','A-','B+','B-','AB+','AB-','O+','O-') or groupe_sanguin is null),
  allergies text,
  personne_contact text,
  telephone_contact text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (poste_id, numero_dossier)
);

create index if not exists patients_poste_id_idx on public.patients(poste_id);
create index if not exists patients_nom_prenom_idx on public.patients(poste_id, nom, prenom);

drop trigger if exists patients_set_updated_at on public.patients;
create trigger patients_set_updated_at
before update on public.patients
for each row execute function public.set_updated_at();

-- Numéro de dossier auto-généré, séquentiel par poste (ex. 0001, 0002...)
create or replace function public.set_patient_numero_dossier()
returns trigger
language plpgsql
as $$
begin
  if new.numero_dossier is null or new.numero_dossier = '' then
    select lpad((count(*) + 1)::text, 4, '0')
    into new.numero_dossier
    from public.patients
    where poste_id = new.poste_id;
  end if;
  return new;
end;
$$;

drop trigger if exists patients_set_numero_dossier on public.patients;
create trigger patients_set_numero_dossier
before insert on public.patients
for each row execute function public.set_patient_numero_dossier();

-- 2. Documents du patient (métadonnées — les fichiers vivent dans le bucket Storage "patient-documents")
create table if not exists public.patient_documents (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  poste_id uuid not null references public.postes_sante(id) on delete restrict,
  nom_fichier text not null,
  chemin_storage text not null,
  type_document text,
  taille_octets bigint,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists patient_documents_patient_id_idx on public.patient_documents(patient_id);

-- 3. Vaccins
create table if not exists public.patient_vaccinations (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  poste_id uuid not null references public.postes_sante(id) on delete restrict,
  nom_vaccin text not null,
  date_administration date not null,
  date_rappel date,
  administre_par uuid references public.profiles(id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists patient_vaccinations_patient_id_idx on public.patient_vaccinations(patient_id);

-- 4. Visites
create table if not exists public.patient_visites (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  poste_id uuid not null references public.postes_sante(id) on delete restrict,
  date_visite timestamptz not null default now(),
  type_visite text check (type_visite in ('consultation', 'suivi', 'urgence', 'autre')) default 'autre',
  motif text,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists patient_visites_patient_id_idx on public.patient_visites(patient_id);

-- 5. Notes de suivi
create table if not exists public.patient_notes_suivi (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  poste_id uuid not null references public.postes_sante(id) on delete restrict,
  contenu text not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists patient_notes_suivi_patient_id_idx on public.patient_notes_suivi(patient_id);

-- 6. Row Level Security — isolation stricte par poste (même principe que l'étape 6)
alter table public.patients enable row level security;
alter table public.patient_documents enable row level security;
alter table public.patient_vaccinations enable row level security;
alter table public.patient_visites enable row level security;
alter table public.patient_notes_suivi enable row level security;

-- patients
drop policy if exists "patients_select" on public.patients;
create policy "patients_select"
on public.patients for select
to authenticated
using (poste_id = public.current_poste_id() or public.is_super_admin());

drop policy if exists "patients_insert" on public.patients;
create policy "patients_insert"
on public.patients for insert
to authenticated
with check (
  (poste_id = public.current_poste_id() and public.current_role() <> 'lecture_seule')
  or public.is_super_admin()
);

drop policy if exists "patients_update" on public.patients;
create policy "patients_update"
on public.patients for update
to authenticated
using (
  (poste_id = public.current_poste_id() and public.current_role() <> 'lecture_seule')
  or public.is_super_admin()
)
with check (
  (poste_id = public.current_poste_id() and public.current_role() <> 'lecture_seule')
  or public.is_super_admin()
);

drop policy if exists "patients_delete" on public.patients;
create policy "patients_delete"
on public.patients for delete
to authenticated
using (
  (poste_id = public.current_poste_id() and public.is_poste_admin())
  or public.is_super_admin()
);

-- patient_documents / patient_vaccinations / patient_visites / patient_notes_suivi :
-- mêmes règles de lecture/écriture, appliquées via une boucle pour éviter la répétition
do $$
declare
  t text;
begin
  foreach t in array array['patient_documents', 'patient_vaccinations', 'patient_visites', 'patient_notes_suivi']
  loop
    execute format('drop policy if exists "%1$s_select" on public.%1$s', t);
    execute format($p$
      create policy "%1$s_select"
      on public.%1$s for select
      to authenticated
      using (poste_id = public.current_poste_id() or public.is_super_admin())
    $p$, t);

    execute format('drop policy if exists "%1$s_insert" on public.%1$s', t);
    execute format($p$
      create policy "%1$s_insert"
      on public.%1$s for insert
      to authenticated
      with check (
        (poste_id = public.current_poste_id() and public.current_role() <> 'lecture_seule')
        or public.is_super_admin()
      )
    $p$, t);

    execute format('drop policy if exists "%1$s_update" on public.%1$s', t);
    execute format($p$
      create policy "%1$s_update"
      on public.%1$s for update
      to authenticated
      using (
        (poste_id = public.current_poste_id() and public.current_role() <> 'lecture_seule')
        or public.is_super_admin()
      )
      with check (
        (poste_id = public.current_poste_id() and public.current_role() <> 'lecture_seule')
        or public.is_super_admin()
      )
    $p$, t);

    execute format('drop policy if exists "%1$s_delete" on public.%1$s', t);
    execute format($p$
      create policy "%1$s_delete"
      on public.%1$s for delete
      to authenticated
      using (
        (poste_id = public.current_poste_id() and public.is_poste_admin())
        or public.is_super_admin()
      )
    $p$, t);
  end loop;
end $$;

-- 7. Stockage des documents patients
insert into storage.buckets (id, name, public)
values ('patient-documents', 'patient-documents', false)
on conflict (id) do nothing;

-- Convention de chemin : {poste_id}/{patient_id}/{horodatage}-{nom_fichier}
drop policy if exists "patient_documents_storage_select" on storage.objects;
create policy "patient_documents_storage_select"
on storage.objects for select
to authenticated
using (
  bucket_id = 'patient-documents'
  and (public.is_super_admin() or (storage.foldername(name))[1] = public.current_poste_id()::text)
);

drop policy if exists "patient_documents_storage_insert" on storage.objects;
create policy "patient_documents_storage_insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'patient-documents'
  and (public.is_super_admin() or (storage.foldername(name))[1] = public.current_poste_id()::text)
  and public.current_role() <> 'lecture_seule'
);

drop policy if exists "patient_documents_storage_delete" on storage.objects;
create policy "patient_documents_storage_delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'patient-documents'
  and (public.is_super_admin() or (storage.foldername(name))[1] = public.current_poste_id()::text)
  and public.current_role() <> 'lecture_seule'
);
