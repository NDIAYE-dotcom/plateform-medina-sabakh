-- Étape 5 — Tableau de bord principal
-- Active Supabase Realtime sur les tables utilisées par les statistiques du tableau de bord,
-- pour que les compteurs se mettent à jour automatiquement (§8 : "statistiques en temps réel").
-- À exécuter dans Supabase Dashboard → SQL Editor.

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'profiles'
  ) then
    alter publication supabase_realtime add table public.profiles;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'postes_sante'
  ) then
    alter publication supabase_realtime add table public.postes_sante;
  end if;
end $$;
