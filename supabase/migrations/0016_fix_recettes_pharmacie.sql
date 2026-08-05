-- Étape 13 (correctif) — La Comptabilité ne pouvait plus lire les ventes de la pharmacie
--
-- La migration précédente (0015) a restreint la lecture de mouvements_stock au Pharmacien, au
-- Magasinier, à l'Administrateur Poste et au rôle lecture seule — en oubliant que le Caissier a
-- besoin de lire cette table (en lecture seule) pour calculer les recettes pharmacie du Bilan
-- (supabase/migrations/0012_comptabilite.sql, useBilan.js). Résultat : "Recettes pharmacie"
-- retombait silencieusement à 0 pour un Caissier, alors que les ventes étaient bien enregistrées.
--
-- Correctif : le Caissier peut désormais LIRE mouvements_stock (mais toujours pas y écrire — il
-- ne dispense ni ne réceptionne rien, articles_stock reste inchangé et hors de sa portée).
--
-- À exécuter dans Supabase Dashboard → SQL Editor.

drop policy if exists "mouvements_stock_select" on public.mouvements_stock;
create policy "mouvements_stock_select"
on public.mouvements_stock for select
to authenticated
using (
  (poste_id = public.current_poste_id()
    and (public.is_pharmacie_role() or public.current_role() in ('lecture_seule', 'admin_poste', 'caissier')))
  or public.is_super_admin()
);
