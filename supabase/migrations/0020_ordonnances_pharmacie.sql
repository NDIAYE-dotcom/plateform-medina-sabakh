-- Étape 15 (complément) — Ordonnances visibles depuis la Pharmacie
-- À exécuter dans Supabase Dashboard → SQL Editor.

-- But : le Pharmacien/Magasinier doit pouvoir anticiper les médicaments à préparer avant que le
-- patient ne se présente au comptoir, en voyant les ordonnances récemment prescrites.
--
-- Choix volontairement restreint : on élargit UNIQUEMENT "consultation_prescriptions" (la ligne
-- de prescription : médicament/posologie/durée + patient_id) aux rôles pharmacie, pas la table
-- "consultations" elle-même (diagnostic, examen clinique, tension artérielle...) qui reste
-- réservée aux rôles cliniques + admin_poste + lecture_seule, comme depuis l'étape 13. La
-- pharmacie n'a besoin que de savoir QUOI préparer pour QUEL patient, pas du dossier clinique
-- complet — même logique déjà appliquée pour "patients"/"tickets" (accès juste assez large pour
-- le besoin réel, pas plus).
drop policy if exists "consultation_prescriptions_select" on public.consultation_prescriptions;
create policy "consultation_prescriptions_select"
on public.consultation_prescriptions for select
to authenticated
using (
  (poste_id = public.current_poste_id()
    and (public.is_clinical_role() or public.is_pharmacie_role()
      or public.current_role() in ('lecture_seule', 'admin_poste')))
  or public.is_super_admin()
);
