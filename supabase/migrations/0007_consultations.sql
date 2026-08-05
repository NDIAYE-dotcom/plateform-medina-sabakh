-- Étape 9 — Consultations et dossiers médicaux
-- À exécuter dans Supabase Dashboard → SQL Editor.

-- 1. Consultations médicales
create table if not exists public.consultations (
  id uuid primary key default gen_random_uuid(),
  poste_id uuid not null references public.postes_sante(id) on delete restrict,
  patient_id uuid not null references public.patients(id) on delete cascade,
  date_consultation timestamptz not null default now(),
  motif text,
  examen_clinique text,
  diagnostic text,
  traitement text,
  poids_kg numeric(5,2),
  temperature_c numeric(4,1),
  tension_arterielle text,
  medecin_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists consultations_patient_id_idx on public.consultations(patient_id);
create index if not exists consultations_poste_id_idx on public.consultations(poste_id, date_consultation desc);

drop trigger if exists consultations_set_updated_at on public.consultations;
create trigger consultations_set_updated_at
before update on public.consultations
for each row execute function public.set_updated_at();

-- 2. Lignes de prescription (forment l'ordonnance d'une consultation)
create table if not exists public.consultation_prescriptions (
  id uuid primary key default gen_random_uuid(),
  consultation_id uuid not null references public.consultations(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  poste_id uuid not null references public.postes_sante(id) on delete restrict,
  medicament text not null,
  posologie text,
  duree text,
  created_at timestamptz not null default now()
);

create index if not exists consultation_prescriptions_consultation_id_idx
  on public.consultation_prescriptions(consultation_id);

-- 3. Row Level Security — même principe d'isolation par poste que les étapes 6/7/8
alter table public.consultations enable row level security;
alter table public.consultation_prescriptions enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['consultations', 'consultation_prescriptions']
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
