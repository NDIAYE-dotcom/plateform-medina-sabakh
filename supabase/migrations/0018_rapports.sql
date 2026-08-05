-- Étape 15 — Rapports et statistiques
-- À exécuter dans Supabase Dashboard → SQL Editor.

-- Le module Rapports agrège des données déjà existantes (patients, tickets, consultations,
-- grossesses, pharmacie, comptabilité, personnel) — aucune nouvelle table n'est nécessaire.

-- Rapports est ouvert à l'Administrateur Poste, à "Consultation uniquement" et au Super Admin
-- (rôle transversal d'observation, cf. is_pharmacie_role()/is_clinical_role() à l'étape 13/14).
-- Or `depenses_select` excluait jusqu'ici volontairement lecture_seule (0012_comptabilite.sql) :
-- puisque le rapport affiche désormais un total de dépenses/bilan pour ce rôle, l'exclusion
-- créerait un "zéro silencieux" (RLS ne renvoie aucune ligne, sans erreur) — même classe de bug
-- que la régression recettes-pharmacie de l'étape 13 (0016). On l'aligne donc sur les autres
-- modules : lecture_seule garde un accès en lecture seule, jamais en écriture.
drop policy if exists "depenses_select" on public.depenses;
create policy "depenses_select"
on public.depenses for select
to authenticated
using (
  (poste_id = public.current_poste_id()
    and public.current_role() in ('admin_poste', 'caissier', 'lecture_seule'))
  or public.is_super_admin()
);
