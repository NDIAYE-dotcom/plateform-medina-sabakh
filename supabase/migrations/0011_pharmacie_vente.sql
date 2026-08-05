-- Étape 11 (complément 2) — Vente au moment de la dispensation
-- À exécuter dans Supabase Dashboard → SQL Editor.

-- Montant encaissé pour un mouvement de sortie (dispensation) — nul pour une entrée (réception)
alter table public.mouvements_stock add column if not exists montant integer;
