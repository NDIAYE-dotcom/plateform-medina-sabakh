-- Étape 17 (Sécurité) — Verrouille en base ce qui n'était garanti que par l'absence de bouton
-- À exécuter dans Supabase Dashboard → SQL Editor.
--
-- Deux failles trouvées lors de la revue de sécurité de fin de projet. Aucune des deux n'était
-- exploitable depuis l'interface (aucun bouton "modifier"/"supprimer" n'existe pour ces données),
-- mais la RLS est la vraie protection dans ce projet (cf. toutes les étapes précédentes) — l'API
-- REST de Supabase reste directement joignable avec un jeton valide, donc une policy trop
-- permissive EST une faille, même sans bouton dans l'UI.
--
-- 1. Les dossiers médicaux et le journal de stock (consultations, ordonnances, grossesses, CPN,
--    mouvements de stock) sont censés être immuables — confirmé explicitement par le client :
--    "c'est pour la sécurité et la traçabilité des dossiers médicaux". Or ces tables avaient
--    encore des policies UPDATE et DELETE actives (héritées du gabarit commun réutilisé à chaque
--    étape), permettant à un Administrateur Poste de modifier ou supprimer directement via l'API
--    un enregistrement que l'application elle-même ne permet jamais de toucher.
--
-- 2. Suppression en cascade dangereuse : "patient_id" et "article_id" étaient déclarés
--    "on delete cascade" sur les tables cliniques et le journal de stock. Résultat : supprimer un
--    patient (policy "patients_delete" existante) effacerait silencieusement TOUT son historique
--    médical (consultations, ordonnances, grossesses, CPN, vaccins, visites, documents) ; de même,
--    supprimer un article de pharmacie effacerait tout son historique de mouvements et
--    d'inventaires. Remplacé par "on delete restrict" : la suppression d'un patient ou d'un
--    article reste possible tant qu'aucun historique n'y est rattaché (utile pour une fiche créée
--    par erreur), mais devient impossible dès qu'un historique réel existe — le dossier devient de
--    fait permanent dès la première utilisation, sans avoir besoin d'un statut "actif/archivé".

-- 1. Retire les policies UPDATE/DELETE des tables immuables — ne laisse que SELECT/INSERT.
do $$
declare
  t text;
begin
  foreach t in array array[
    'consultations', 'consultation_prescriptions',
    'grossesses', 'consultations_prenatales',
    'mouvements_stock'
  ]
  loop
    execute format('drop policy if exists "%1$s_update" on public.%1$s', t);
    execute format('drop policy if exists "%1$s_delete" on public.%1$s', t);
  end loop;
end $$;

-- 2. Remplace "on delete cascade" par "on delete restrict" sur les FK sensibles.
alter table public.patient_documents drop constraint if exists patient_documents_patient_id_fkey;
alter table public.patient_documents
  add constraint patient_documents_patient_id_fkey
  foreign key (patient_id) references public.patients(id) on delete restrict;

alter table public.patient_vaccinations drop constraint if exists patient_vaccinations_patient_id_fkey;
alter table public.patient_vaccinations
  add constraint patient_vaccinations_patient_id_fkey
  foreign key (patient_id) references public.patients(id) on delete restrict;

alter table public.patient_visites drop constraint if exists patient_visites_patient_id_fkey;
alter table public.patient_visites
  add constraint patient_visites_patient_id_fkey
  foreign key (patient_id) references public.patients(id) on delete restrict;

alter table public.patient_notes_suivi drop constraint if exists patient_notes_suivi_patient_id_fkey;
alter table public.patient_notes_suivi
  add constraint patient_notes_suivi_patient_id_fkey
  foreign key (patient_id) references public.patients(id) on delete restrict;

alter table public.consultations drop constraint if exists consultations_patient_id_fkey;
alter table public.consultations
  add constraint consultations_patient_id_fkey
  foreign key (patient_id) references public.patients(id) on delete restrict;

alter table public.consultation_prescriptions drop constraint if exists consultation_prescriptions_patient_id_fkey;
alter table public.consultation_prescriptions
  add constraint consultation_prescriptions_patient_id_fkey
  foreign key (patient_id) references public.patients(id) on delete restrict;

alter table public.grossesses drop constraint if exists grossesses_patient_id_fkey;
alter table public.grossesses
  add constraint grossesses_patient_id_fkey
  foreign key (patient_id) references public.patients(id) on delete restrict;

alter table public.consultations_prenatales drop constraint if exists consultations_prenatales_patient_id_fkey;
alter table public.consultations_prenatales
  add constraint consultations_prenatales_patient_id_fkey
  foreign key (patient_id) references public.patients(id) on delete restrict;

alter table public.mouvements_stock drop constraint if exists mouvements_stock_article_id_fkey;
alter table public.mouvements_stock
  add constraint mouvements_stock_article_id_fkey
  foreign key (article_id) references public.articles_stock(id) on delete restrict;

alter table public.inventaire_lignes drop constraint if exists inventaire_lignes_article_id_fkey;
alter table public.inventaire_lignes
  add constraint inventaire_lignes_article_id_fkey
  foreign key (article_id) references public.articles_stock(id) on delete restrict;
