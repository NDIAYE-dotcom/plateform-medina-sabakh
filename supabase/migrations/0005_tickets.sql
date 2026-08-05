-- Étape 8 — Gestion des tickets et file d'attente
-- À exécuter dans Supabase Dashboard → SQL Editor.

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  poste_id uuid not null references public.postes_sante(id) on delete restrict,
  date_ticket date not null default current_date,
  numero text not null,
  patient_id uuid references public.patients(id) on delete set null,
  nom_visiteur text not null,
  motif text,
  statut text not null check (statut in ('en_attente', 'en_cours', 'termine', 'annule')) default 'en_attente',
  created_by uuid references public.profiles(id) on delete set null,
  appele_at timestamptz,
  termine_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (poste_id, date_ticket, numero)
);

create index if not exists tickets_poste_id_date_idx on public.tickets(poste_id, date_ticket);
create index if not exists tickets_patient_id_idx on public.tickets(patient_id);

drop trigger if exists tickets_set_updated_at on public.tickets;
create trigger tickets_set_updated_at
before update on public.tickets
for each row execute function public.set_updated_at();

-- Numérotation automatique, remise à zéro chaque jour, par poste (ex. 001, 002...)
create or replace function public.set_ticket_numero()
returns trigger
language plpgsql
as $$
begin
  if new.numero is null or new.numero = '' then
    select lpad((count(*) + 1)::text, 3, '0')
    into new.numero
    from public.tickets
    where poste_id = new.poste_id and date_ticket = new.date_ticket;
  end if;
  return new;
end;
$$;

drop trigger if exists tickets_set_numero on public.tickets;
create trigger tickets_set_numero
before insert on public.tickets
for each row execute function public.set_ticket_numero();

-- Horodatage automatique des changements de statut
create or replace function public.set_ticket_status_timestamps()
returns trigger
language plpgsql
as $$
begin
  if new.statut is distinct from old.statut then
    if new.statut = 'en_cours' and new.appele_at is null then
      new.appele_at = now();
    elsif new.statut = 'termine' and new.termine_at is null then
      new.termine_at = now();
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists tickets_set_status_timestamps on public.tickets;
create trigger tickets_set_status_timestamps
before update on public.tickets
for each row execute function public.set_ticket_status_timestamps();

-- Row Level Security — même principe d'isolation par poste que les patients (étape 7)
alter table public.tickets enable row level security;

drop policy if exists "tickets_select" on public.tickets;
create policy "tickets_select"
on public.tickets for select
to authenticated
using (poste_id = public.current_poste_id() or public.is_super_admin());

drop policy if exists "tickets_insert" on public.tickets;
create policy "tickets_insert"
on public.tickets for insert
to authenticated
with check (
  (poste_id = public.current_poste_id() and public.current_role() <> 'lecture_seule')
  or public.is_super_admin()
);

drop policy if exists "tickets_update" on public.tickets;
create policy "tickets_update"
on public.tickets for update
to authenticated
using (
  (poste_id = public.current_poste_id() and public.current_role() <> 'lecture_seule')
  or public.is_super_admin()
)
with check (
  (poste_id = public.current_poste_id() and public.current_role() <> 'lecture_seule')
  or public.is_super_admin()
);

drop policy if exists "tickets_delete" on public.tickets;
create policy "tickets_delete"
on public.tickets for delete
to authenticated
using (
  (poste_id = public.current_poste_id() and public.is_poste_admin())
  or public.is_super_admin()
);

-- Temps réel pour la file d'attente (même principe qu'à l'étape 5)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'tickets'
  ) then
    alter publication supabase_realtime add table public.tickets;
  end if;
end $$;
