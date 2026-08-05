-- Étape 14 — Inventaires périodiques
-- À exécuter dans Supabase Dashboard → SQL Editor.

-- Un inventaire est une session de comptage physique du stock. Chaque ligne compare le stock
-- théorique (solde du système au moment du comptage) au stock réellement compté. À la clôture,
-- les écarts génèrent automatiquement des mouvements d'ajustement (public.mouvements_stock) —
-- le solde d'un article ne s'écrit jamais directement, même pour un inventaire, même règle que
-- depuis l'étape 11.

create table if not exists public.inventaires (
  id uuid primary key default gen_random_uuid(),
  poste_id uuid not null references public.postes_sante(id) on delete restrict,
  date_inventaire date not null default current_date,
  statut text not null default 'en_cours' check (statut in ('en_cours', 'cloture')),
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  cloture_at timestamptz,
  cloture_by uuid references public.profiles(id) on delete set null
);

create index if not exists inventaires_poste_id_idx on public.inventaires(poste_id, date_inventaire desc);

create table if not exists public.inventaire_lignes (
  id uuid primary key default gen_random_uuid(),
  inventaire_id uuid not null references public.inventaires(id) on delete cascade,
  article_id uuid not null references public.articles_stock(id) on delete cascade,
  poste_id uuid not null references public.postes_sante(id) on delete restrict,
  stock_theorique integer not null,
  stock_compte integer not null check (stock_compte >= 0),
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (inventaire_id, article_id)
);

create index if not exists inventaire_lignes_inventaire_id_idx on public.inventaire_lignes(inventaire_id);

drop trigger if exists inventaire_lignes_set_updated_at on public.inventaire_lignes;
create trigger inventaire_lignes_set_updated_at
before update on public.inventaire_lignes
for each row execute function public.set_updated_at();

-- Clôture d'un inventaire : transforme chaque écart en mouvement d'ajustement, puis verrouille
-- l'inventaire. "security invoker" (par défaut) : la fonction s'exécute avec les droits de la
-- personne qui l'appelle, donc les RLS ci-dessous (qui peut modifier un inventaire, qui peut
-- créer un mouvement de stock) s'appliquent normalement — aucun contournement de sécurité.
create or replace function public.cloturer_inventaire(p_inventaire_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_statut text;
  r record;
  v_diff integer;
begin
  select statut into v_statut from public.inventaires where id = p_inventaire_id;

  if v_statut is null then
    raise exception 'Inventaire introuvable.';
  end if;
  if v_statut <> 'en_cours' then
    raise exception 'Cet inventaire est déjà clôturé.';
  end if;

  for r in select * from public.inventaire_lignes where inventaire_id = p_inventaire_id loop
    v_diff := r.stock_compte - r.stock_theorique;
    if v_diff <> 0 then
      insert into public.mouvements_stock (poste_id, article_id, type, quantite, motif, created_by)
      values (
        r.poste_id,
        r.article_id,
        case when v_diff > 0 then 'entree' else 'sortie' end,
        abs(v_diff),
        case when r.notes is not null and r.notes <> ''
          then 'Ajustement d''inventaire — ' || r.notes
          else 'Ajustement d''inventaire'
        end,
        auth.uid()
      );
    end if;
  end loop;

  update public.inventaires
  set statut = 'cloture', cloture_at = now(), cloture_by = auth.uid()
  where id = p_inventaire_id;
end;
$$;

-- Row Level Security — mêmes rôles que Pharmacie/Stock (Pharmacien, Magasinier, Administrateur
-- Poste), lecture seule incluse en lecture, cf. is_pharmacie_role() ajoutée à l'étape 13.
alter table public.inventaires enable row level security;
alter table public.inventaire_lignes enable row level security;

drop policy if exists "inventaires_select" on public.inventaires;
create policy "inventaires_select"
on public.inventaires for select
to authenticated
using (
  (poste_id = public.current_poste_id()
    and (public.is_pharmacie_role() or public.current_role() in ('lecture_seule', 'admin_poste')))
  or public.is_super_admin()
);

drop policy if exists "inventaires_insert" on public.inventaires;
create policy "inventaires_insert"
on public.inventaires for insert
to authenticated
with check (
  (poste_id = public.current_poste_id()
    and (public.is_pharmacie_role() or public.current_role() = 'admin_poste'))
  or public.is_super_admin()
);

drop policy if exists "inventaires_update" on public.inventaires;
create policy "inventaires_update"
on public.inventaires for update
to authenticated
using (
  (poste_id = public.current_poste_id()
    and (public.is_pharmacie_role() or public.current_role() = 'admin_poste'))
  or public.is_super_admin()
)
with check (
  (poste_id = public.current_poste_id()
    and (public.is_pharmacie_role() or public.current_role() = 'admin_poste'))
  or public.is_super_admin()
);

drop policy if exists "inventaire_lignes_select" on public.inventaire_lignes;
create policy "inventaire_lignes_select"
on public.inventaire_lignes for select
to authenticated
using (
  (poste_id = public.current_poste_id()
    and (public.is_pharmacie_role() or public.current_role() in ('lecture_seule', 'admin_poste')))
  or public.is_super_admin()
);

-- Une ligne ne peut être créée/modifiée que tant que l'inventaire parent est encore en cours —
-- une fois clôturé, les lignes sont verrouillées (les écarts sont déjà devenus des mouvements).
drop policy if exists "inventaire_lignes_insert" on public.inventaire_lignes;
create policy "inventaire_lignes_insert"
on public.inventaire_lignes for insert
to authenticated
with check (
  (
    poste_id = public.current_poste_id()
    and (public.is_pharmacie_role() or public.current_role() = 'admin_poste')
    and exists (
      select 1 from public.inventaires i
      where i.id = inventaire_lignes.inventaire_id and i.statut = 'en_cours'
    )
  )
  or public.is_super_admin()
);

drop policy if exists "inventaire_lignes_update" on public.inventaire_lignes;
create policy "inventaire_lignes_update"
on public.inventaire_lignes for update
to authenticated
using (
  (
    poste_id = public.current_poste_id()
    and (public.is_pharmacie_role() or public.current_role() = 'admin_poste')
    and exists (
      select 1 from public.inventaires i
      where i.id = inventaire_lignes.inventaire_id and i.statut = 'en_cours'
    )
  )
  or public.is_super_admin()
)
with check (
  (
    poste_id = public.current_poste_id()
    and (public.is_pharmacie_role() or public.current_role() = 'admin_poste')
    and exists (
      select 1 from public.inventaires i
      where i.id = inventaire_lignes.inventaire_id and i.statut = 'en_cours'
    )
  )
  or public.is_super_admin()
);

drop policy if exists "inventaire_lignes_delete" on public.inventaire_lignes;
create policy "inventaire_lignes_delete"
on public.inventaire_lignes for delete
to authenticated
using (
  (
    poste_id = public.current_poste_id()
    and public.is_poste_admin()
    and exists (
      select 1 from public.inventaires i
      where i.id = inventaire_lignes.inventaire_id and i.statut = 'en_cours'
    )
  )
  or public.is_super_admin()
);
