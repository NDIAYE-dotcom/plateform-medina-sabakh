-- Étape 12 — Comptabilité
-- À exécuter dans Supabase Dashboard → SQL Editor.

-- Les recettes existent déjà (tickets.montant depuis l'étape 8, mouvements_stock.montant depuis
-- l'étape 11) — cette étape n'ajoute que les dépenses, seul élément manquant pour calculer un bilan.

create table if not exists public.depenses (
  id uuid primary key default gen_random_uuid(),
  poste_id uuid not null references public.postes_sante(id) on delete restrict,
  date_depense date not null default current_date,
  categorie text not null default 'autre'
    check (categorie in ('salaires', 'loyer', 'fournitures', 'electricite_eau', 'transport', 'maintenance', 'autre')),
  libelle text not null,
  montant integer not null check (montant > 0),
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists depenses_poste_id_date_idx on public.depenses(poste_id, date_depense);

-- Row Level Security — restreinte aux rôles ayant une visibilité financière du poste
-- (Administrateur Poste de Santé, Caissier, Super Admin), contrairement aux autres modules
-- qui ne restreignent que le rôle "lecture_seule". Les dépenses sont un journal, comme les
-- tickets et les mouvements de stock : pas de modification depuis l'interface une fois saisies.
alter table public.depenses enable row level security;

drop policy if exists "depenses_select" on public.depenses;
create policy "depenses_select"
on public.depenses for select
to authenticated
using (
  (poste_id = public.current_poste_id() and public.current_role() in ('admin_poste', 'caissier'))
  or public.is_super_admin()
);

drop policy if exists "depenses_insert" on public.depenses;
create policy "depenses_insert"
on public.depenses for insert
to authenticated
with check (
  (poste_id = public.current_poste_id() and public.current_role() in ('admin_poste', 'caissier'))
  or public.is_super_admin()
);

drop policy if exists "depenses_delete" on public.depenses;
create policy "depenses_delete"
on public.depenses for delete
to authenticated
using (
  (poste_id = public.current_poste_id() and public.is_poste_admin())
  or public.is_super_admin()
);
