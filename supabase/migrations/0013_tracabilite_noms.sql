-- Étape 12 (correctif) — Fiabiliser l'affichage "qui a fait / modifié"
--
-- Problème découvert : "Fait par" (mouvements de stock) et "Modifié par" (articles) reposaient sur
-- une jointure vers la table profiles au moment de l'affichage. Or les policies RLS de profiles
-- (étape 6) ne permettent de lire le profil d'un AUTRE utilisateur que si on est admin du même
-- poste ou super admin — un caissier consultant l'historique ne pouvait donc pas voir le nom d'un
-- collègue pharmacien, par exemple. Résultat : la colonne restait vide silencieusement (pas
-- d'erreur, la jointure retourne juste null).
--
-- Correctif : on capture un instantané du nom directement au moment de l'action, via un trigger
-- "security definer" (donc qui contourne les RLS pour cette seule lecture, de façon contrôlée) —
-- le nom est infalsifiable (calculé côté base à partir de auth.uid(), jamais envoyé par le client)
-- et reste visible quel que soit le rôle de la personne qui consulte l'historique par la suite.
--
-- À exécuter dans Supabase Dashboard → SQL Editor.

-- 1. Mouvements de stock
alter table public.mouvements_stock add column if not exists effectue_par text;

create or replace function public.set_mouvement_effectue_par()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  select coalesce(p.full_name, u.email)
  into new.effectue_par
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.id = auth.uid();
  return new;
end;
$$;

drop trigger if exists mouvements_stock_set_effectue_par on public.mouvements_stock;
create trigger mouvements_stock_set_effectue_par
before insert on public.mouvements_stock
for each row execute function public.set_mouvement_effectue_par();

-- 2. Articles (fiche catalogue) — même correctif pour "Modifié par"
alter table public.articles_stock add column if not exists updated_by_nom text;

create or replace function public.set_articles_stock_updated_by()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  new.updated_by := auth.uid();
  select coalesce(p.full_name, u.email)
  into new.updated_by_nom
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.id = auth.uid();
  return new;
end;
$$;
-- (le trigger before update existant sur articles_stock réutilise automatiquement cette fonction
-- mise à jour — pas besoin de le recréer)
