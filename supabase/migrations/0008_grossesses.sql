-- Étape 10 — Suivi des femmes enceintes
-- À exécuter dans Supabase Dashboard → SQL Editor.

-- 1. Grossesses
create table if not exists public.grossesses (
  id uuid primary key default gen_random_uuid(),
  poste_id uuid not null references public.postes_sante(id) on delete restrict,
  patient_id uuid not null references public.patients(id) on delete cascade,
  date_dernieres_regles date not null,
  date_prevue_accouchement date,
  gestite integer,
  parite integer,
  risques text,
  notes text,
  statut text not null default 'en_cours' check (statut in ('en_cours', 'accouchee', 'interrompue')),
  date_accouchement date,
  lieu_accouchement text,
  mode_accouchement text check (mode_accouchement in ('voie_basse', 'cesarienne') or mode_accouchement is null),
  issue text check (issue in ('vivant', 'mort_ne') or issue is null),
  poids_naissance_kg numeric(4,2),
  complications text,
  medecin_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists grossesses_patient_id_idx on public.grossesses(patient_id);
create index if not exists grossesses_poste_id_idx on public.grossesses(poste_id, date_prevue_accouchement);

-- DPA (Date Prévue d'Accouchement) auto-calculée à J+280 si non fournie
create or replace function public.set_grossesse_dpa()
returns trigger
language plpgsql
as $$
begin
  if new.date_prevue_accouchement is null and new.date_dernieres_regles is not null then
    new.date_prevue_accouchement := new.date_dernieres_regles + interval '280 days';
  end if;
  return new;
end;
$$;

drop trigger if exists grossesses_set_dpa on public.grossesses;
create trigger grossesses_set_dpa
before insert on public.grossesses
for each row execute function public.set_grossesse_dpa();

drop trigger if exists grossesses_set_updated_at on public.grossesses;
create trigger grossesses_set_updated_at
before update on public.grossesses
for each row execute function public.set_updated_at();

-- 2. Consultations prénatales (CPN)
create table if not exists public.consultations_prenatales (
  id uuid primary key default gen_random_uuid(),
  grossesse_id uuid not null references public.grossesses(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  poste_id uuid not null references public.postes_sante(id) on delete restrict,
  numero integer,
  date_cpn date not null default current_date,
  poids_kg numeric(5,2),
  tension_arterielle text,
  hauteur_uterine_cm numeric(4,1),
  bruits_coeur_foetal text check (bruits_coeur_foetal in ('percus', 'non_percus', 'non_recherches') or bruits_coeur_foetal is null),
  observations text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists consultations_prenatales_grossesse_id_idx
  on public.consultations_prenatales(grossesse_id);

-- Numéro de CPN auto-généré, séquentiel par grossesse (CPN 1, CPN 2...)
create or replace function public.set_cpn_numero()
returns trigger
language plpgsql
as $$
begin
  if new.numero is null then
    select count(*) + 1 into new.numero
    from public.consultations_prenatales
    where grossesse_id = new.grossesse_id;
  end if;
  return new;
end;
$$;

drop trigger if exists consultations_prenatales_set_numero on public.consultations_prenatales;
create trigger consultations_prenatales_set_numero
before insert on public.consultations_prenatales
for each row execute function public.set_cpn_numero();

-- 3. Row Level Security — même principe d'isolation par poste que les étapes 6/7/8/9
alter table public.grossesses enable row level security;
alter table public.consultations_prenatales enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['grossesses', 'consultations_prenatales']
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
