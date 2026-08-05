-- Étape 11 — Pharmacie et gestion des stocks
-- À exécuter dans Supabase Dashboard → SQL Editor.

-- 1. Catalogue des articles (médicaments, consommables, matériel)
create table if not exists public.articles_stock (
  id uuid primary key default gen_random_uuid(),
  poste_id uuid not null references public.postes_sante(id) on delete restrict,
  nom text not null,
  categorie text not null default 'medicament' check (categorie in ('medicament', 'consommable', 'materiel')),
  unite text,
  seuil_alerte integer not null default 0,
  stock_actuel integer not null default 0,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists articles_stock_poste_id_idx on public.articles_stock(poste_id, categorie);

drop trigger if exists articles_stock_set_updated_at on public.articles_stock;
create trigger articles_stock_set_updated_at
before update on public.articles_stock
for each row execute function public.set_updated_at();

-- 2. Mouvements de stock (journal d'entrées/sorties — le solde n'est jamais modifié directement)
create table if not exists public.mouvements_stock (
  id uuid primary key default gen_random_uuid(),
  poste_id uuid not null references public.postes_sante(id) on delete restrict,
  article_id uuid not null references public.articles_stock(id) on delete cascade,
  type text not null check (type in ('entree', 'sortie')),
  quantite integer not null check (quantite > 0),
  motif text,
  patient_id uuid references public.patients(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists mouvements_stock_article_id_idx on public.mouvements_stock(article_id, created_at desc);
create index if not exists mouvements_stock_poste_id_idx on public.mouvements_stock(poste_id, created_at desc);

-- Le solde de chaque article est maintenu automatiquement à partir des mouvements
create or replace function public.apply_mouvement_stock()
returns trigger
language plpgsql
as $$
declare
  stock_courant integer;
begin
  select stock_actuel into stock_courant from public.articles_stock where id = new.article_id for update;

  if new.type = 'entree' then
    update public.articles_stock set stock_actuel = stock_courant + new.quantite where id = new.article_id;
  else
    if stock_courant - new.quantite < 0 then
      raise exception 'Stock insuffisant : % unité(s) disponible(s), % demandée(s).', stock_courant, new.quantite;
    end if;
    update public.articles_stock set stock_actuel = stock_courant - new.quantite where id = new.article_id;
  end if;

  return new;
end;
$$;

drop trigger if exists mouvements_stock_apply on public.mouvements_stock;
create trigger mouvements_stock_apply
before insert on public.mouvements_stock
for each row execute function public.apply_mouvement_stock();

-- 3. Row Level Security — même principe d'isolation par poste que les étapes 6/7/8/9/10
alter table public.articles_stock enable row level security;
alter table public.mouvements_stock enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['articles_stock', 'mouvements_stock']
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
