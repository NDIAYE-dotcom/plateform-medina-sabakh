-- Étape 11 (complément) — Prix, stock initial et traçabilité des modifications du catalogue
-- À exécuter dans Supabase Dashboard → SQL Editor.

-- 1. Prix unitaire (FCFA) — la fiche article n'est pas un mouvement, elle reste modifiable
alter table public.articles_stock add column if not exists prix_unitaire integer;

-- 2. Traçabilité : qui a modifié la fiche article en dernier
alter table public.articles_stock add column if not exists updated_by uuid references public.profiles(id) on delete set null;

-- Le champ est renseigné automatiquement par la base (pas par le client) pour ne pas pouvoir être falsifié
create or replace function public.set_articles_stock_updated_by()
returns trigger
language plpgsql
as $$
begin
  new.updated_by := auth.uid();
  return new;
end;
$$;

drop trigger if exists articles_stock_set_updated_by on public.articles_stock;
create trigger articles_stock_set_updated_by
before update on public.articles_stock
for each row execute function public.set_articles_stock_updated_by();
